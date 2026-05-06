import { getCoinGeckoResearchResponse } from './coingecko';
import { getFallbackResearchResponse } from './fallback';
import { validateQuery } from './query';
import { enrichTrustRisk } from '../../utils/enrichTrustRisk';
import type { QueryValidationResult } from './query';
import type { ResearchResponse } from '../../types/research';

function classifyLiveLookupFailure(error: unknown, query: { raw: string; normalized: string }) {
  const maybeStatus = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined;
  const contractLookup = typeof error === 'object' && error && 'contractLookup' in error ? (error as { contractLookup?: { address?: string } }).contractLookup : null;
  const isContractQuery = Boolean(contractLookup?.address);

  if (maybeStatus === 404) {
    return {
      reason: 'not_found' as const,
      message: isContractQuery
        ? 'Contract was not found on CoinGecko or DEXScreener. Showing local fallback research.'
        : `Token or project was not found in live sources. Showing local fallback research for ${query.raw}.`,
      errorCode: 'NOT_FOUND' as const
    };
  }

  if (maybeStatus === 429) {
    return {
      reason: 'rate_limited' as const,
      message: 'CoinGecko rate limit reached. Showing local fallback research.',
      errorCode: 'RATE_LIMITED' as const
    };
  }

  return {
    reason: 'upstream_unavailable' as const,
    message: 'Live data sources are temporarily unavailable. Showing local fallback research.',
    errorCode: 'LIVE_LOOKUP_FAILED' as const
  };
}

export async function resolveResearch(queryValue: string): Promise<{ statusCode: number; body: ResearchResponse }> {
  const validation = validateQuery(queryValue);

  if (!validation.ok) {
    const invalid = validation as Extract<QueryValidationResult, { ok: false }>;
    return {
      statusCode: 400,
      body: {
        status: 'error',
        query: {
          raw: invalid.raw,
          normalized: invalid.normalized
        },
        result: null,
        message: invalid.message,
        error: {
          code: 'BAD_REQUEST',
          detail: invalid.detail
        }
      }
    };
  }

  const query = {
    raw: validation.raw,
    normalized: validation.normalized
  };

  try {
    const liveResponse = await getCoinGeckoResearchResponse(query);
    if (liveResponse) {
      const enrichedResponse = await enrichTrustRisk(liveResponse);
      return {
        statusCode: 200,
        body: enrichedResponse
      };
    }
  } catch (error) {
    const fallbackResponse = getFallbackResearchResponse(query);
    const classification = classifyLiveLookupFailure(error, query);
    fallbackResponse.result!.fallback.reason = classification.reason;
    fallbackResponse.message = classification.message;
    fallbackResponse.error = {
      code: classification.errorCode,
      detail: error instanceof Error ? error.message : 'Unexpected live lookup failure.'
    };
    return {
      statusCode: 200,
      body: fallbackResponse
    };
  }

  const fallbackResponse = getFallbackResearchResponse(query);
  return {
    statusCode: 200,
    body: fallbackResponse
  };
}
