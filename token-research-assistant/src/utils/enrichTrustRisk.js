const CONTRACT_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const HONEYPOT_API_BASE_URL = 'https://api.honeypot.is/v2/IsHoneypot?address=';
function isContractAddress(value) {
    return CONTRACT_ADDRESS_PATTERN.test(String(value ?? '').trim());
}
function createRiskSignal(key, label, value, impact) {
    return { key, label, value, impact };
}
function createInterpretedSignal(key, label, detail, tone) {
    return { key, label, detail, tone };
}
function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
async function fetchHoneypot(address) {
    try {
        const response = await fetch(`${HONEYPOT_API_BASE_URL}${encodeURIComponent(address)}`, {
            headers: { accept: 'application/json' }
        });
        if (!response.ok) {
            return { honeypot: null, buyTax: null, sellTax: null };
        }
        const data = (await response.json());
        return {
            honeypot: typeof data?.honeypotResult?.isHoneypot === 'boolean' ? data.honeypotResult.isHoneypot : null,
            buyTax: toNumber(data?.simulationResult?.buyTax ?? data?.token?.buyTax),
            sellTax: toNumber(data?.simulationResult?.sellTax ?? data?.token?.sellTax)
        };
    }
    catch {
        return { honeypot: null, buyTax: null, sellTax: null };
    }
}
function getLiquidityRisk(liquidityUsd) {
    if (liquidityUsd === null)
        return null;
    if (liquidityUsd < 10000)
        return 'high';
    if (liquidityUsd <= 100000)
        return 'medium';
    return 'low';
}
function getAgeRisk(assetCreatedAt) {
    if (!assetCreatedAt)
        return null;
    const createdAtMs = Date.parse(assetCreatedAt);
    if (Number.isNaN(createdAtMs))
        return null;
    const ageDays = (Date.now() - createdAtMs) / (1000 * 60 * 60 * 24);
    if (ageDays < 7)
        return 'high';
    if (ageDays <= 30)
        return 'medium';
    return 'low';
}
function getVolumeAnomaly(volume24hUsd, liquidityUsd) {
    if (volume24hUsd === null || liquidityUsd === null || liquidityUsd <= 0) {
        return null;
    }
    return volume24hUsd / liquidityUsd > 3;
}
function deriveTrustScore(input) {
    let score = 0;
    if (input.honeypot === true)
        score += 4;
    if (input.liquidityRisk === 'high')
        score += 3;
    else if (input.liquidityRisk === 'medium')
        score += 1;
    if (input.volumeAnomaly === true)
        score += 2;
    if (input.ageRisk === 'high')
        score += 2;
    else if (input.ageRisk === 'medium')
        score += 1;
    return Math.max(0, Math.min(10, score));
}
function deriveTrustLabel(score) {
    if (score === null)
        return null;
    if (score >= 7)
        return 'danger';
    if (score >= 4)
        return 'warning';
    return 'safe';
}
function combineLevel(baseLevel, trustLabel) {
    if (trustLabel === 'danger')
        return 'high';
    if (trustLabel === 'warning' && (baseLevel === 'low' || baseLevel === 'unknown'))
        return 'medium';
    return baseLevel;
}
function combineScore(baseScore, trustScore) {
    if (baseScore === null && trustScore === null)
        return null;
    const normalizedBase = baseScore === null ? 0 : Math.min(10, Math.round(baseScore / 10));
    const combined = Math.max(normalizedBase, trustScore ?? 0);
    return Math.max(0, Math.min(10, combined));
}
function buildSummary(baseSummary, flags) {
    if (flags.length === 0) {
        return baseSummary;
    }
    return `${baseSummary} Trust-layer signals: ${flags.join('; ')}.`;
}
export async function enrichTrustRisk(response) {
    if (!response?.result || response.result.identity.source === 'local') {
        return response;
    }
    const contractAddress = response.query?.raw?.trim();
    if (!isContractAddress(contractAddress)) {
        return response;
    }
    const baseRisk = response.result.risk ?? {
        level: 'unknown',
        score: null,
        summary: 'Risk data is limited for this result.',
        signals: []
    };
    const baseSignalInterpretation = response.result.signalInterpretation ?? {
        summary: 'Signal interpretation is limited for this result.',
        tone: 'neutral',
        signals: []
    };
    const market = response.result.market;
    const { honeypot, buyTax, sellTax } = await fetchHoneypot(contractAddress);
    const liquidityRisk = getLiquidityRisk(market.liquidityUsd);
    const volumeAnomaly = getVolumeAnomaly(market.volume24hUsd, market.liquidityUsd);
    const ageRisk = getAgeRisk(response.result.sourceMeta.assetCreatedAt);
    const trustScore = deriveTrustScore({ honeypot, liquidityRisk, volumeAnomaly, ageRisk });
    const trustLabel = deriveTrustLabel(trustScore);
    const flags = [...(baseRisk.flags ?? [])];
    const riskSignals = [...baseRisk.signals];
    const interpretedSignals = [...baseSignalInterpretation.signals];
    if (honeypot === true) {
        flags.push('Honeypot risk detected');
        riskSignals.push(createRiskSignal('honeypot', 'Honeypot check', 'Token appears to restrict selling or transfer exits.', 'high'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Honeypot warning', 'Honeypot detection flagged this contract as risky to exit.', 'negative'));
    }
    if (liquidityRisk === 'high') {
        flags.push('Low liquidity — high volatility risk');
        riskSignals.push(createRiskSignal('low_liquidity', 'Liquidity depth', 'Liquidity is below $10k.', 'high'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Low-liquidity warning', 'Liquidity is thin, which raises slippage and volatility risk.', 'negative'));
    }
    else if (liquidityRisk === 'medium') {
        flags.push('Moderate liquidity — trading conditions can move quickly');
        riskSignals.push(createRiskSignal('low_liquidity', 'Liquidity depth', 'Liquidity is between $10k and $100k.', 'medium'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Moderate-liquidity caution', 'Liquidity is present but still light enough for trading conditions to shift quickly.', 'caution'));
    }
    if (volumeAnomaly === true) {
        flags.push('Unusual trading activity detected');
        riskSignals.push(createRiskSignal('volume_anomaly', 'Volume anomaly', '24h volume is more than 3x liquidity.', 'medium'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Volume anomaly', 'Trading activity looks unusually high relative to available liquidity.', 'caution'));
    }
    if (ageRisk === 'high') {
        flags.push('New contract — limited history');
        riskSignals.push(createRiskSignal('age_risk', 'Market age', 'Token listing or pair appears younger than 7 days.', 'high'));
        interpretedSignals.push(createInterpretedSignal('trust', 'New-market warning', 'This token appears very new, so its market history is still limited.', 'negative'));
    }
    else if (ageRisk === 'medium') {
        flags.push('Young contract — limited history');
        riskSignals.push(createRiskSignal('age_risk', 'Market age', 'Token listing or pair appears between 7 and 30 days old.', 'medium'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Young-market caution', 'This token still has a relatively short live-market history.', 'caution'));
    }
    if (buyTax !== null || sellTax !== null) {
        const taxParts = [];
        if (buyTax !== null)
            taxParts.push(`buy tax ${buyTax.toFixed(2)}%`);
        if (sellTax !== null)
            taxParts.push(`sell tax ${sellTax.toFixed(2)}%`);
        flags.push(`Trade tax data available: ${taxParts.join(', ')}`);
    }
    response.result.risk = {
        ...baseRisk,
        level: combineLevel(baseRisk.level, trustLabel),
        score: combineScore(baseRisk.score, trustScore),
        summary: buildSummary(baseRisk.summary, flags),
        signals: riskSignals,
        flags,
        details: {
            honeypot,
            buyTax,
            sellTax,
            liquidityRisk,
            volumeAnomaly,
            ageRisk,
            trustLabel,
            trustScore
        }
    };
    const tone = interpretedSignals.some((signal) => signal.tone === 'negative')
        ? 'negative'
        : interpretedSignals.some((signal) => signal.tone === 'caution')
            ? 'caution'
            : baseSignalInterpretation.tone;
    response.result.signalInterpretation = {
        ...baseSignalInterpretation,
        summary: flags.length > 0
            ? `${baseSignalInterpretation.summary} Trust checks added ${flags.length} extra signal${flags.length === 1 ? '' : 's'} for this contract.`
            : baseSignalInterpretation.summary,
        tone,
        signals: interpretedSignals
    };
    return response;
}
