function formatCompactUsd(value) {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(value);
}
function firstSentence(value) {
    if (!value)
        return null;
    const match = value.trim().match(/.+?[.!?](\s|$)/);
    return match ? match[0].trim() : value.trim();
}
function buildWhatItIs(project) {
    const descriptionSentence = firstSentence(project.description);
    if (descriptionSentence) {
        return descriptionSentence;
    }
    if (project.categories.length > 0) {
        const categoryLabel = project.categories.slice(0, 2).join(' and ');
        return `${project.name ?? 'This asset'} appears to be associated with ${categoryLabel.toLowerCase()}.`;
    }
    return `${project.name ?? 'This asset'} is a crypto project with limited descriptive context in the current response.`;
}
function buildMarketPosture(market, risk) {
    const largeMarketCap = market.marketCapUsd !== null && market.marketCapUsd >= 1000000000;
    const mediumMarketCap = market.marketCapUsd !== null && market.marketCapUsd >= 100000000 && market.marketCapUsd < 1000000000;
    const highLiquidity = market.volume24hUsd !== null && market.volume24hUsd >= 10000000;
    const mediumLiquidity = market.volume24hUsd !== null && market.volume24hUsd >= 1000000 && market.volume24hUsd < 10000000;
    const lowLiquidity = market.volume24hUsd !== null && market.volume24hUsd < 1000000;
    if (largeMarketCap && highLiquidity && risk.level === 'low') {
        return 'Current market structure looks relatively strong, supported by higher liquidity and larger market size.';
    }
    if ((mediumMarketCap || mediumLiquidity || risk.level === 'medium') && !lowLiquidity) {
        return 'Current market structure suggests moderate risk, with balanced size and liquidity.';
    }
    if (lowLiquidity || (!largeMarketCap && market.marketCapUsd !== null && market.marketCapUsd < 100000000) || risk.level === 'high') {
        return 'Current market structure suggests elevated risk, driven by smaller market size and limited liquidity.';
    }
    if (risk.level === 'unknown') {
        return 'Current market structure is hard to judge because live market data is incomplete.';
    }
    return 'Current market structure suggests moderate risk, with balanced size and liquidity.';
}
function buildWatchout(market, risk, signalInterpretation) {
    const hasLowLiquiditySignal = risk.signals.some((signal) => signal.key === 'low_volume' && signal.impact === 'high') ||
        signalInterpretation.signals.some((signal) => signal.key === 'liquidity' && signal.tone === 'negative');
    if (hasLowLiquiditySignal) {
        return 'The main watchout is low liquidity, which can increase price instability.';
    }
    const hasFdvGapSignal = risk.signals.some((signal) => signal.key === 'fdv_gap') || signalInterpretation.signals.some((signal) => signal.key === 'fdv_gap' && signal.tone !== 'positive');
    if (hasFdvGapSignal) {
        return 'The main watchout is a high valuation gap, which may indicate dilution risk.';
    }
    const hasVolatilitySignal = risk.signals.some((signal) => signal.key === 'high_24h_move') || signalInterpretation.signals.some((signal) => signal.key === 'volatility' && signal.tone !== 'positive');
    if (hasVolatilitySignal) {
        return 'The main watchout is elevated volatility, which can make short-term price moves harder to read.';
    }
    const hasSmallMarketCapSignal = risk.signals.some((signal) => signal.key === 'small_market_cap') || signalInterpretation.signals.some((signal) => signal.key === 'market_cap' && signal.tone !== 'positive');
    if (hasSmallMarketCapSignal) {
        return 'The main watchout is smaller market size, which can leave the asset more sensitive to sentiment shifts.';
    }
    if (risk.level === 'unknown') {
        return 'The main watchout is incomplete market data, which limits how much confidence to place in this snapshot.';
    }
    const volumeText = market.volume24hUsd !== null ? ` around $${formatCompactUsd(market.volume24hUsd)} in 24h volume` : '';
    return `The main watchout is that conditions can still change quickly, even with${volumeText || ' the current'} market support.`;
}
export function generateResearchBrief(market, risk, signalInterpretation, project) {
    const sentenceOne = buildWhatItIs(project);
    const sentenceTwo = buildMarketPosture(market, risk);
    const sentenceThree = buildWatchout(market, risk, signalInterpretation);
    return {
        headline: 'Market structure overview',
        body: [sentenceOne, sentenceTwo, sentenceThree].join(' ')
    };
}
