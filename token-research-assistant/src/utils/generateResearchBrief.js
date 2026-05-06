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
function buildMarketPosture(risk) {
    switch (risk.summaryMode) {
        case 'stable':
            return 'The current setup looks broadly stable, with supportive scale, healthier liquidity, and no obvious structural stress dominating the read.';
        case 'stable_watchful':
            return 'The setup still looks broadly constructive, but one or two softer signals keep it from reading as fully clean.';
        case 'mixed_cautious':
            return 'There are some supportive signals here, but the weaker areas are meaningful enough to keep the broader picture leaning cautious.';
        case 'high_risk_fragile':
            if (risk.overrideReason === 'honeypot_exit_risk') {
                return 'The broader setup looks high risk because contract-level exit concerns dominate the picture.';
            }
            return 'The broader setup looks fragile, with enough structural weakness to make the token difficult to trust comfortably.';
        default:
            return 'Current market structure is hard to judge because live market data is incomplete.';
    }
}
function buildWatchout(market, risk, signalInterpretation) {
    if (risk.overrideReason === 'honeypot_exit_risk') {
        return 'The main watchout is severe exit risk: users may not be able to sell or transfer normally.';
    }
    if (risk.overrideReason === 'thin_liquidity_weak_visibility') {
        return 'The main watchout is that thin liquidity and weak verification visibility can make short-term market behavior hard to trust.';
    }
    if (risk.dominantDriver === 'liquidity') {
        return 'The main watchout is liquidity quality, because thinner markets can amplify slippage and unstable price action.';
    }
    if (risk.dominantDriver === 'volatility') {
        return 'The main watchout is unusually active short-term price behavior, which can make conviction harder to sustain.';
    }
    if (risk.dominantDriver === 'fdv_gap') {
        return 'The main watchout is valuation stretch, which can leave the setup more exposed to dilution concerns.';
    }
    if (risk.dominantDriver === 'scale') {
        return 'The main watchout is smaller scale, because lower depth can make sentiment swings matter more.';
    }
    if (risk.dominantDriver === 'trust') {
        return 'The main watchout is limited trust visibility, because cleaner market signals do not fully remove contract-level uncertainty.';
    }
    if (risk.level === 'unknown') {
        return 'The main watchout is incomplete market data, which limits how much confidence to place in this snapshot.';
    }
    const hasCautionSignals = signalInterpretation.signals.some((signal) => signal.tone === 'caution' || signal.tone === 'negative');
    if (hasCautionSignals) {
        return 'The main watchout is that a few softer signals still deserve monitoring even if the broader setup looks calmer.';
    }
    if (market.volume24hUsd !== null) {
        return 'The main watchout is that broader crypto conditions can still change quickly, even with current market support.';
    }
    return 'The main watchout is that market conditions can shift quickly, so the current snapshot should not be treated as static.';
}
export function generateResearchBrief(market, risk, signalInterpretation, project) {
    const sentenceOne = buildWhatItIs(project);
    const sentenceTwo = buildMarketPosture(risk);
    const sentenceThree = buildWatchout(market, risk, signalInterpretation);
    return {
        headline: 'Market structure overview',
        body: [sentenceOne, sentenceTwo, sentenceThree].join(' ')
    };
}
