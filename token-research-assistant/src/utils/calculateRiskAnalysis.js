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
export function calculateRiskAnalysis(market) {
    const signals = [];
    let score = 0;
    const missingCoreFields = [market.marketCapUsd, market.volume24hUsd, market.change24hPct].filter((value) => value === null).length;
    if (missingCoreFields > 0) {
        score += 20;
        signals.push(createSignal('missing_market_data', 'Incomplete market data', `${missingCoreFields} core field${missingCoreFields === 1 ? '' : 's'} missing`, 'medium'));
    }
    if (market.volume24hUsd !== null) {
        if (market.volume24hUsd < 1000000) {
            score += 25;
            signals.push(createSignal('low_volume', '24h volume', `< $${formatCompactUsd(1000000)}`, 'high'));
        }
        else if (market.volume24hUsd < 10000000) {
            score += 10;
            signals.push(createSignal('low_volume', '24h volume', `$${formatCompactUsd(market.volume24hUsd)}`, 'medium'));
        }
    }
    if (market.change24hPct !== null) {
        const absoluteMove = Math.abs(market.change24hPct);
        if (absoluteMove >= 20) {
            score += 25;
            signals.push(createSignal('high_24h_move', '24h price move', formatPercent(market.change24hPct), 'high'));
        }
        else if (absoluteMove >= 10) {
            score += 10;
            signals.push(createSignal('high_24h_move', '24h price move', formatPercent(market.change24hPct), 'medium'));
        }
    }
    if (market.marketCapUsd !== null) {
        if (market.marketCapUsd < 100000000) {
            score += 20;
            signals.push(createSignal('small_market_cap', 'Market cap', `$${formatCompactUsd(market.marketCapUsd)}`, 'high'));
        }
        else if (market.marketCapUsd < 1000000000) {
            score += 10;
            signals.push(createSignal('small_market_cap', 'Market cap', `$${formatCompactUsd(market.marketCapUsd)}`, 'medium'));
        }
    }
    if (market.marketCapUsd !== null && market.marketCapUsd > 0 && market.fullyDilutedValuationUsd !== null) {
        const fdvGap = market.fullyDilutedValuationUsd / market.marketCapUsd;
        if (fdvGap >= 5) {
            score += 25;
            signals.push(createSignal('fdv_gap', 'FDV / market cap', `${fdvGap.toFixed(1)}x`, 'high'));
        }
        else if (fdvGap >= 2) {
            score += 15;
            signals.push(createSignal('fdv_gap', 'FDV / market cap', `${fdvGap.toFixed(1)}x`, 'medium'));
        }
    }
    if (market.marketCapRank !== null && market.marketCapRank > 300) {
        score += 10;
    }
    const boundedScore = Math.max(0, Math.min(100, score));
    if (missingCoreFields >= 2) {
        return {
            level: 'unknown',
            score: null,
            summary: 'Market risk is unavailable because key live market fields are missing.',
            signals
        };
    }
    if (boundedScore >= 55) {
        return {
            level: 'high',
            score: boundedScore,
            summary: 'Higher market risk based on current liquidity, size, valuation gap, or short-term price movement.',
            signals
        };
    }
    if (boundedScore >= 25) {
        return {
            level: 'medium',
            score: boundedScore,
            summary: 'Moderate market risk based on current liquidity, size, valuation gap, or short-term price movement.',
            signals
        };
    }
    return {
        level: 'low',
        score: boundedScore,
        summary: 'Lower market risk based on current liquidity, size, valuation gap, and recent price movement.',
        signals
    };
}
