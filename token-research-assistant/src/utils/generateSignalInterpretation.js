function createSignal(key, label, detail, tone) {
    return { key, label, detail, tone };
}
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
function getSummaryFromTone(tone) {
    switch (tone) {
        case 'positive':
            return 'Current market signals look relatively steady for this token, based on the available live data.';
        case 'negative':
            return 'Current market signals look stretched or fragile in a few areas, based on the available live data.';
        case 'caution':
            return 'Current market signals are mixed, with a few areas worth watching in the live data.';
        default:
            return 'Signal interpretation is limited because the live market data is incomplete.';
    }
}
function getDominantTone(signals, risk) {
    if (risk.level === 'unknown') {
        return 'neutral';
    }
    if (signals.some((signal) => signal.tone === 'negative')) {
        return 'negative';
    }
    if (signals.some((signal) => signal.tone === 'caution')) {
        return 'caution';
    }
    if (signals.some((signal) => signal.tone === 'positive')) {
        return 'positive';
    }
    return 'neutral';
}
export function generateSignalInterpretation(market, risk) {
    const signals = [];
    const missingCoreFields = [market.marketCapUsd, market.volume24hUsd, market.change24hPct].filter((value) => value === null).length;
    if (missingCoreFields > 0) {
        signals.push(createSignal('missing_data', 'Incomplete market data', `${missingCoreFields} core live field${missingCoreFields === 1 ? '' : 's'} missing, so interpretation is limited.`, 'neutral'));
    }
    if (market.volume24hUsd !== null) {
        if (market.volume24hUsd < 1000000) {
            signals.push(createSignal('liquidity', 'Liquidity signal', `24h volume is low at about $${formatCompactUsd(market.volume24hUsd)}.`, 'negative'));
        }
        else if (market.volume24hUsd < 10000000) {
            signals.push(createSignal('liquidity', 'Liquidity signal', `24h volume is modest at about $${formatCompactUsd(market.volume24hUsd)}.`, 'caution'));
        }
        else {
            signals.push(createSignal('liquidity', 'Liquidity signal', `24h volume is relatively healthy at about $${formatCompactUsd(market.volume24hUsd)}.`, 'positive'));
        }
    }
    if (market.change24hPct !== null) {
        const absoluteMove = Math.abs(market.change24hPct);
        if (absoluteMove >= 20) {
            signals.push(createSignal('volatility', 'Volatility signal', `Price moved ${formatPercent(market.change24hPct)} in 24h, which is a sharp short-term swing.`, 'negative'));
        }
        else if (absoluteMove >= 10) {
            signals.push(createSignal('volatility', 'Volatility signal', `Price moved ${formatPercent(market.change24hPct)} in 24h, showing elevated short-term volatility.`, 'caution'));
        }
        else {
            signals.push(createSignal('volatility', 'Volatility signal', `Price moved ${formatPercent(market.change24hPct)} in 24h, which looks relatively contained.`, 'positive'));
        }
    }
    if (market.marketCapUsd !== null) {
        if (market.marketCapUsd < 100000000) {
            signals.push(createSignal('market_cap', 'Market-cap signal', `Market cap is on the smaller side at about $${formatCompactUsd(market.marketCapUsd)}.`, 'negative'));
        }
        else if (market.marketCapUsd < 1000000000) {
            signals.push(createSignal('market_cap', 'Market-cap signal', `Market cap is mid-sized at about $${formatCompactUsd(market.marketCapUsd)}.`, 'caution'));
        }
        else {
            signals.push(createSignal('market_cap', 'Market-cap signal', `Market cap is relatively large at about $${formatCompactUsd(market.marketCapUsd)}.`, 'positive'));
        }
    }
    if (market.marketCapUsd !== null && market.marketCapUsd > 0 && market.fullyDilutedValuationUsd !== null) {
        const fdvGap = market.fullyDilutedValuationUsd / market.marketCapUsd;
        if (fdvGap >= 5) {
            signals.push(createSignal('fdv_gap', 'FDV-gap signal', `FDV is about ${fdvGap.toFixed(1)}x market cap, which suggests a wide valuation gap.`, 'negative'));
        }
        else if (fdvGap >= 2) {
            signals.push(createSignal('fdv_gap', 'FDV-gap signal', `FDV is about ${fdvGap.toFixed(1)}x market cap, so dilution is worth watching.`, 'caution'));
        }
        else {
            signals.push(createSignal('fdv_gap', 'FDV-gap signal', `FDV is close to market cap at about ${fdvGap.toFixed(1)}x.`, 'positive'));
        }
    }
    if (market.marketCapRank !== null) {
        if (market.marketCapRank > 300) {
            signals.push(createSignal('rank', 'Rank signal', `Market-cap rank is #${market.marketCapRank}, which places it deeper in the market.`, 'negative'));
        }
        else if (market.marketCapRank > 100) {
            signals.push(createSignal('rank', 'Rank signal', `Market-cap rank is #${market.marketCapRank}, which is mid-market.`, 'caution'));
        }
        else {
            signals.push(createSignal('rank', 'Rank signal', `Market-cap rank is #${market.marketCapRank}, which keeps it near the top of the market.`, 'positive'));
        }
    }
    const dominantTone = getDominantTone(signals, risk);
    return {
        summary: getSummaryFromTone(dominantTone),
        tone: dominantTone,
        signals
    };
}
