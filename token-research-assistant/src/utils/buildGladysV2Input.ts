import type { CompareResponse } from '../types/compare';

export interface GladysV2InputSide {
  name: string;
  symbol: string;
  source: string;
  fallbackUsed: boolean;
  status: string;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  change24hPct: number | null;
  riskLevel: string | null;
  riskScore: number | null;
  riskSummary: string | null;
  trustLabel: string | null;
  researchBrief: string | null;
  sector: string | null;
}

export interface GladysV2Input {
  left: GladysV2InputSide;
  right: GladysV2InputSide;
  comparativeIntelligence: CompareResponse['comparativeIntelligence'];
  deterministicInsight: CompareResponse['gladysInsight'];
}

function getDisplayName(response: CompareResponse['left']) {
  return response.result?.identity.name ?? response.query.raw;
}

function getDisplaySymbol(response: CompareResponse['left']) {
  return response.result?.identity.symbol ?? '—';
}

function buildInputSide(response: CompareResponse['left']): GladysV2InputSide {
  return {
    name: getDisplayName(response),
    symbol: getDisplaySymbol(response),
    source: response.result?.identity.source ?? 'unknown',
    fallbackUsed: response.result?.fallback.used ?? response.status !== 'live',
    status: response.status,
    marketCapUsd: response.result?.market.marketCapUsd ?? null,
    volume24hUsd: response.result?.market.volume24hUsd ?? null,
    change24hPct: response.result?.market.change24hPct ?? null,
    riskLevel: response.result?.risk?.level ?? null,
    riskScore: response.result?.risk?.score ?? null,
    riskSummary: response.result?.risk?.summary ?? null,
    trustLabel: response.result?.risk?.details?.trustLabel ?? null,
    researchBrief: response.result?.researchBrief?.body ?? null,
    sector: response.result?.sector ?? null
  };
}

export function buildGladysV2Input(comparison: CompareResponse): GladysV2Input {
  return {
    left: buildInputSide(comparison.left),
    right: buildInputSide(comparison.right),
    comparativeIntelligence: comparison.comparativeIntelligence,
    deterministicInsight: comparison.gladysInsight
  };
}
