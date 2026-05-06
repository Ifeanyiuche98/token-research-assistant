function formatCompactUsd(value) {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(value);
}
function formatPercent(value) {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
}
function createSignal(key, label, value, impact) {
    return { key, label, value, impact };
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
function deriveSummaryMode(level, market) {
    if (level === 'unknown')
        return 'unknown';
    if (level === 'high')
        return 'high_risk_fragile';
    const hasModerateVolatility = market.change24hPct !== null && Math.abs(market.change24hPct) >= 10;
    const hasModestLiquidity = market.volume24hUsd !== null && market.volume24hUsd < 10000000;
    if (level === 'medium') {
        if (hasModerateVolatility || hasModestLiquidity) {
            return 'mixed_cautious';
        }
        return 'stable_watchful';
    }
    return 'stable';
}
function deriveDominantDriver(market, signals) {
    if (signals.some((signal) => signal.key === 'missing_market_data'))
        return 'missing_data';
    const weights = {
        liquidity: 0,
        volatility: 0,
        fdv_gap: 0,
        scale: 0
    };
    signals.forEach((signal) => {
        const weight = signal.impact === 'high' ? 3 : signal.impact === 'medium' ? 2 : 1;
        if (signal.key === 'low_volume')
            weights.liquidity += weight;
        if (signal.key === 'high_24h_move')
            weights.volatility += weight;
        if (signal.key === 'fdv_gap')
            weights.fdv_gap += weight;
        if (signal.key === 'small_market_cap')
            weights.scale += weight;
    });
    const ranked = Object.entries(weights).sort((left, right) => right[1] - left[1]);
    if (ranked.length === 0 || ranked[0][1] === 0) {
        return null;
    }
    const [topKey, topValue] = ranked[0];
    const secondValue = ranked[1]?.[1] ?? 0;
    if (topValue > 0 && secondValue > 0 && topValue === secondValue) {
        return 'mixed';
    }
    return topKey;
}
function buildSummary(level, dominantDriver) {
    if (level === 'unknown') {
        return 'Market risk is unavailable because key live market fields are missing.';
    }
    if (level === 'low') {
        return 'Risk stays low here because liquidity, scale, and overall structure look supportive in the current read.';
    }
    if (level === 'medium') {
        switch (dominantDriver) {
            case 'volatility':
                return 'Risk remains elevated mainly because short-term price behavior is active enough to soften an otherwise steadier setup.';
            case 'liquidity':
                return 'Risk remains elevated mainly because liquidity is not strong enough to make the setup feel fully clean.';
            case 'fdv_gap':
                return 'Risk remains elevated mainly because valuation stretch is meaningful enough to keep the profile watchful.';
            case 'scale':
                return 'Risk remains elevated mainly because smaller market scale can make sentiment shifts hit harder.';
            default:
                return 'Risk remains elevated because a few weaker areas still keep the setup from looking fully clear.';
        }
    }
    switch (dominantDriver) {
        case 'volatility':
            return 'Risk is high here because recent price behavior is unusually unstable and dominates the current read.';
        case 'liquidity':
            return 'Risk is high here because weak liquidity makes price behavior and execution quality harder to trust.';
        case 'fdv_gap':
            return 'Risk is high here because the valuation gap looks wide enough to raise dilution concerns.';
        case 'scale':
            return 'Risk is high here because smaller scale leaves the setup more fragile during sentiment shifts.';
        default:
            return 'Risk is high here because the weaker areas are strong enough to dominate the current market read.';
    }
}
export function calculateRiskAnalysis(market) {
    const signals = [];
    let score = 0;
    const missingCoreFields = [market.marketCapUsd, market.volume24hUsd, market.change24hPct].filter((value) => value === null).length;
    if (missingCoreFields > 0) {
        score += 1.5;
        signals.push(createSignal('missing_market_data', 'Incomplete market data', `${missingCoreFields} core field${missingCoreFields === 1 ? '' : 's'} missing`, 'medium'));
    }
    if (market.volume24hUsd !== null) {
        if (market.volume24hUsd < 1000000) {
            score += 2.5;
            signals.push(createSignal('low_volume', '24h volume', `< $${formatCompactUsd(1000000)}`, 'high'));
        }
        else if (market.volume24hUsd < 10000000) {
            score += 1;
            signals.push(createSignal('low_volume', '24h volume', `$${formatCompactUsd(market.volume24hUsd)}`, 'medium'));
        }
    }
    if (market.change24hPct !== null) {
        const absoluteMove = Math.abs(market.change24hPct);
        if (absoluteMove >= 20) {
            score += 2.5;
            signals.push(createSignal('high_24h_move', '24h price move', formatPercent(market.change24hPct), 'high'));
        }
        else if (absoluteMove >= 10) {
            score += 1;
            signals.push(createSignal('high_24h_move', '24h price move', formatPercent(market.change24hPct), 'medium'));
        }
    }
    if (market.marketCapUsd !== null) {
        if (market.marketCapUsd < 100000000) {
            score += 2;
            signals.push(createSignal('small_market_cap', 'Market cap', `$${formatCompactUsd(market.marketCapUsd)}`, 'high'));
        }
        else if (market.marketCapUsd < 1000000000) {
            score += 1;
            signals.push(createSignal('small_market_cap', 'Market cap', `$${formatCompactUsd(market.marketCapUsd)}`, 'medium'));
        }
    }
    if (market.marketCapUsd !== null && market.marketCapUsd > 0 && market.fullyDilutedValuationUsd !== null) {
        const fdvGap = market.fullyDilutedValuationUsd / market.marketCapUsd;
        if (fdvGap >= 5) {
            score += 2.5;
            signals.push(createSignal('fdv_gap', 'FDV / market cap', `${fdvGap.toFixed(1)}x`, 'high'));
        }
        else if (fdvGap >= 2) {
            score += 1.5;
            signals.push(createSignal('fdv_gap', 'FDV / market cap', `${fdvGap.toFixed(1)}x`, 'medium'));
        }
    }
    if (market.marketCapRank !== null && market.marketCapRank > 300) {
        score += 1;
    }
    if (missingCoreFields >= 2) {
        return {
            level: 'unknown',
            band: 'unknown',
            summaryMode: 'unknown',
            dominantDriver: 'missing_data',
            overrideReason: null,
            score: null,
            summary: 'Market risk is unavailable because key live market fields are missing.',
            signals
        };
    }
    const boundedScore = Math.max(0, Math.min(10, Number(score.toFixed(1))));
    const level = scoreToLevel(boundedScore);
    const dominantDriver = deriveDominantDriver(market, signals);
    return {
        level,
        band: levelToBand(level),
        summaryMode: deriveSummaryMode(level, market),
        dominantDriver,
        overrideReason: boundedScore >= 6 && dominantDriver === 'volatility' ? 'extreme_volatility' : null,
        score: boundedScore,
        summary: buildSummary(level, dominantDriver),
        signals
    };
}
