import { getCoinGeckoResearchResponse } from './coingecko';
import { getFallbackResearchResponse } from './fallback';
import { validateQuery } from './query';
import type { QueryValidationResult } from './query';
import type { ResearchResponse } from '../../types/research';

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
      return {
        statusCode: 200,
        body: liveResponse
      };
    }
  } catch (error) {
    const maybeStatus = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined;
    const fallbackResponse = getFallbackResearchResponse(query);
    fallbackResponse.result!.fallback.reason = maybeStatus === 429 ? 'rate_limited' : 'live_lookup_failed';
    fallbackResponse.message =
      maybeStatus === 429
        ? 'CoinGecko rate limit reached. Showing local fallback research.'
        : 'Live data unavailable. Showing local fallback research.';
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
