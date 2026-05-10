function getDisplayName(response) {
    return response.result?.identity.name ?? response.query.raw;
}
function getDisplaySymbol(response) {
    return response.result?.identity.symbol ?? '—';
}
function buildInputSide(response) {
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
export function buildGladysV2Input(comparison) {
    return {
        left: buildInputSide(comparison.left),
        right: buildInputSide(comparison.right),
        comparativeIntelligence: comparison.comparativeIntelligence,
        deterministicInsight: comparison.gladysInsight
    };
}
