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
        score += 6;
    if (input.liquidityRisk === 'high')
        score += 2.5;
    else if (input.liquidityRisk === 'medium')
        score += 1;
    if (input.volumeAnomaly === true)
        score += 1.5;
    if (input.ageRisk === 'high')
        score += 1.5;
    else if (input.ageRisk === 'medium')
        score += 0.75;
    return Math.max(0, Math.min(10, Number(score.toFixed(1))));
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
function scoreToLevel(score) {
    if (score === null)
        return 'unknown';
    if (score >= 6)
        return 'high';
    if (score >= 3)
        return 'medium';
    return 'low';
}
function levelToBand(level) {
    if (level === 'high')
        return 'high';
    if (level === 'medium')
        return 'elevated';
    if (level === 'low')
        return 'lower';
    return 'unknown';
}
function modeFromLevel(level) {
    if (level === 'high')
        return 'high_risk_fragile';
    if (level === 'medium')
        return 'mixed_cautious';
    if (level === 'low')
        return 'stable';
    return 'unknown';
}
function pushUniqueFlag(flags, value) {
    if (!flags.includes(value)) {
        flags.push(value);
    }
}
function deriveOverrideReason(input) {
    if (input.honeypot === true)
        return 'honeypot_exit_risk';
    if (input.liquidityRisk === 'high' && (input.volumeAnomaly === true || input.ageRisk === 'high')) {
        return 'thin_liquidity_weak_visibility';
    }
    return null;
}
function deriveDominantDriver(baseRisk, overrideReason) {
    if (overrideReason === 'honeypot_exit_risk')
        return 'honeypot';
    if (overrideReason === 'thin_liquidity_weak_visibility')
        return 'trust';
    return baseRisk.dominantDriver ?? 'trust';
}
function combineScore(baseScore, trustScore, overrideReason) {
    if (baseScore === null && trustScore === null)
        return null;
    let combined = Math.max(baseScore ?? 0, trustScore ?? 0);
    if (overrideReason === 'honeypot_exit_risk') {
        combined = Math.max(combined, 9);
    }
    else if (overrideReason === 'thin_liquidity_weak_visibility') {
        combined = Math.max(combined, 7.5);
    }
    else if (trustScore !== null) {
        combined = Math.max(combined, Number(Math.min(10, (baseScore ?? 0) + trustScore * 0.35).toFixed(1)));
    }
    return Math.max(0, Math.min(10, Number(combined.toFixed(1))));
}
function buildSummary(mode, dominantDriver, overrideReason) {
    if (overrideReason === 'honeypot_exit_risk') {
        return 'Risk is high because available checks suggest serious selling or transfer restrictions, which can make exits unreliable or impossible.';
    }
    if (overrideReason === 'thin_liquidity_weak_visibility') {
        return 'Risk is high because thin liquidity, very small scale, and limited verification make price behavior and trust quality harder to rely on.';
    }
    switch (mode) {
        case 'stable':
            return 'Risk stays low here because liquidity, scale, and overall market structure remain supportive in the current read.';
        case 'stable_watchful':
            return 'Risk remains relatively contained, but some caution is still warranted because one or two weaker signals slightly soften the overall profile.';
        case 'mixed_cautious':
            if (dominantDriver === 'trust') {
                return 'Risk leans higher here because trust-layer checks add enough uncertainty to outweigh the cleaner parts of the setup.';
            }
            return 'Risk leans higher here because the token’s weaker areas are meaningful enough to outweigh its more supportive signals.';
        case 'high_risk_fragile':
            if (dominantDriver === 'trust' || dominantDriver === 'honeypot') {
                return 'This high-risk verdict is driven by warning signals strong enough to materially weaken confidence in the setup.';
            }
            return 'The profile reads as high risk because the main caution drivers are severe enough to outweigh any supporting signals.';
        default:
            return 'Risk visibility is limited for this asset. Treat the result as incomplete and verify manually.';
    }
}
function summarizeTrustChecks(overrideReason, trustLabel) {
    if (overrideReason === 'honeypot_exit_risk') {
        return 'Available checks suggest users may face serious selling or transfer restrictions, making this a high-risk setup.';
    }
    if (overrideReason === 'thin_liquidity_weak_visibility') {
        return 'Trust checks reinforce a fragile setup, with weak liquidity visibility and limited market history.';
    }
    if (trustLabel === 'danger') {
        return 'Trust checks materially worsen the setup and keep caution in control.';
    }
    if (trustLabel === 'warning') {
        return 'Trust checks add meaningful caution even if some market signals still look constructive.';
    }
    return null;
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
        band: 'unknown',
        summaryMode: 'unknown',
        dominantDriver: 'missing_data',
        overrideReason: null,
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
    const overrideReason = deriveOverrideReason({ honeypot, liquidityRisk, volumeAnomaly, ageRisk });
    const flags = [...(baseRisk.flags ?? [])];
    const riskSignals = [...baseRisk.signals];
    const interpretedSignals = [...baseSignalInterpretation.signals];
    pushUniqueFlag(flags, 'Risk signals are heuristic — not financial advice');
    if (response.result.identity.source === 'dexscreener') {
        pushUniqueFlag(flags, 'Unverified token — always confirm contract authenticity');
    }
    if (honeypot === true) {
        pushUniqueFlag(flags, 'Honeypot risk detected');
        riskSignals.push(createRiskSignal('honeypot', 'Honeypot check', 'Token appears to restrict selling or transfer exits.', 'high'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Honeypot warning', 'Available checks suggest users may be unable to exit normally.', 'negative'));
    }
    if (liquidityRisk === 'high') {
        pushUniqueFlag(flags, 'Low liquidity — high volatility risk');
        riskSignals.push(createRiskSignal('low_liquidity', 'Liquidity depth', 'Liquidity is below $10k.', 'high'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Low-liquidity warning', 'Liquidity is thin enough to make price behavior and execution quality hard to trust.', 'negative'));
    }
    else if (liquidityRisk === 'medium') {
        pushUniqueFlag(flags, 'Moderate liquidity — trading conditions can move quickly');
        riskSignals.push(createRiskSignal('low_liquidity', 'Liquidity depth', 'Liquidity is between $10k and $100k.', 'medium'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Moderate-liquidity caution', 'Liquidity is present, but still light enough for trading conditions to shift quickly.', 'caution'));
    }
    if (volumeAnomaly === true) {
        pushUniqueFlag(flags, 'Unusual trading activity detected');
        riskSignals.push(createRiskSignal('volume_anomaly', 'Volume anomaly', '24h volume is more than 3x liquidity.', 'medium'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Volume anomaly', 'Trading activity looks unusually high relative to available liquidity.', 'caution'));
    }
    if (ageRisk === 'high') {
        pushUniqueFlag(flags, 'New contract — limited history');
        riskSignals.push(createRiskSignal('age_risk', 'Market age', 'Token listing or pair appears younger than 7 days.', 'high'));
        interpretedSignals.push(createInterpretedSignal('trust', 'New-market warning', 'This token appears very new, so its live market history is still limited.', 'negative'));
    }
    else if (ageRisk === 'medium') {
        pushUniqueFlag(flags, 'Young contract — limited history');
        riskSignals.push(createRiskSignal('age_risk', 'Market age', 'Token listing or pair appears between 7 and 30 days old.', 'medium'));
        interpretedSignals.push(createInterpretedSignal('trust', 'Young-market caution', 'This token still has a relatively short live-market history.', 'caution'));
    }
    if (buyTax !== null || sellTax !== null) {
        const taxParts = [];
        if (buyTax !== null)
            taxParts.push(`buy tax ${buyTax.toFixed(2)}%`);
        if (sellTax !== null)
            taxParts.push(`sell tax ${sellTax.toFixed(2)}%`);
        pushUniqueFlag(flags, `Trade tax data available: ${taxParts.join(', ')}`);
    }
    const finalScore = combineScore(baseRisk.score, trustScore, overrideReason);
    const finalLevel = scoreToLevel(finalScore);
    const dominantDriver = deriveDominantDriver(baseRisk, overrideReason);
    const summaryMode = overrideReason === 'honeypot_exit_risk' || overrideReason === 'thin_liquidity_weak_visibility'
        ? 'high_risk_fragile'
        : finalLevel === 'medium' && dominantDriver === 'trust'
            ? 'mixed_cautious'
            : modeFromLevel(finalLevel);
    response.result.risk = {
        ...baseRisk,
        level: finalLevel,
        band: levelToBand(finalLevel),
        summaryMode,
        dominantDriver,
        overrideReason,
        score: finalScore,
        summary: buildSummary(summaryMode, dominantDriver, overrideReason),
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
    const tone = summaryMode === 'high_risk_fragile'
        ? 'negative'
        : summaryMode === 'mixed_cautious' || summaryMode === 'stable_watchful'
            ? 'caution'
            : summaryMode === 'stable'
                ? 'positive'
                : baseSignalInterpretation.tone;
    const trustSummary = summarizeTrustChecks(overrideReason, trustLabel);
    response.result.signalInterpretation = {
        ...baseSignalInterpretation,
        summary: trustSummary ?? baseSignalInterpretation.summary,
        tone,
        signals: interpretedSignals
    };
    return response;
}
