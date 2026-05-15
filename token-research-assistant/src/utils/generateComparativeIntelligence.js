function getDisplayName(response) {
    return response.result?.identity.name ?? response.query.raw;
}
function getNumericValue(response, selector) {
    const value = selector(response);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function isFallbackOrUnknown(response) {
    return response.status !== 'live' || response.result?.fallback.used === true;
}
function compareNumericValues(leftValue, rightValue, config, left, right) {
    const leftKnown = leftValue !== null;
    const rightKnown = rightValue !== null;
    const leftLabel = getDisplayName(left);
    const rightLabel = getDisplayName(right);
    if (!leftKnown && !rightKnown) {
        return {
            key: config.key,
            label: config.label,
            betterSide: 'unknown',
            summary: config.unknownSummary
        };
    }
    if (!leftKnown || !rightKnown) {
        const presentSide = leftKnown ? 'left' : 'right';
        const missingResponse = leftKnown ? right : left;
        if (isFallbackOrUnknown(missingResponse)) {
            return {
                key: config.key,
                label: config.label,
                betterSide: presentSide,
                summary: config.presentSideSummary[presentSide](leftLabel, rightLabel)
            };
        }
        return {
            key: config.key,
            label: config.label,
            betterSide: 'unknown',
            summary: config.unknownSummary
        };
    }
    const absoluteDifference = Math.abs(leftValue - rightValue);
    const maxValue = Math.max(Math.abs(leftValue), Math.abs(rightValue));
    const ratioDifference = maxValue === 0 ? 0 : absoluteDifference / maxValue;
    const withinRatio = typeof config.closeRatio === 'number' ? ratioDifference <= config.closeRatio : false;
    const withinAbsoluteDifference = typeof config.closeDifference === 'number' ? absoluteDifference <= config.closeDifference : false;
    if (withinRatio || withinAbsoluteDifference || leftValue === rightValue) {
        return {
            key: config.key,
            label: config.label,
            betterSide: 'tie',
            summary: config.tieSummary
        };
    }
    const betterSide = config.preferLower ? (leftValue < rightValue ? 'left' : 'right') : leftValue > rightValue ? 'left' : 'right';
    return {
        key: config.key,
        label: config.label,
        betterSide,
        summary: config.presentSideSummary[betterSide](leftLabel, rightLabel)
    };
}
function buildLiquidityInsight(left, right) {
    return compareNumericValues(getNumericValue(left, (response) => response.result?.market.volume24hUsd ?? null), getNumericValue(right, (response) => response.result?.market.volume24hUsd ?? null), {
        key: 'liquidity',
        label: 'Liquidity',
        closeRatio: 0.1,
        presentSideSummary: {
            left: (leftLabel) => `${leftLabel} shows stronger liquidity based on higher 24h volume.`,
            right: (_leftLabel, rightLabel) => `${rightLabel} shows stronger liquidity based on higher 24h volume.`
        },
        tieSummary: 'Both assets show similar liquidity based on current 24h volume.',
        unknownSummary: 'Liquidity comparison is limited because market data is incomplete.'
    }, left, right);
}
function buildSizeInsight(left, right) {
    return compareNumericValues(getNumericValue(left, (response) => response.result?.market.marketCapUsd ?? null), getNumericValue(right, (response) => response.result?.market.marketCapUsd ?? null), {
        key: 'size',
        label: 'Size',
        closeRatio: 0.1,
        presentSideSummary: {
            left: (leftLabel) => `${leftLabel} is larger by market capitalization.`,
            right: (_leftLabel, rightLabel) => `${rightLabel} is larger by market capitalization.`
        },
        tieSummary: 'Both assets are similar in size based on market capitalization.',
        unknownSummary: 'Size comparison is limited because market data is incomplete.'
    }, left, right);
}
function buildStabilityInsight(left, right) {
    const leftMove = getNumericValue(left, (response) => {
        const value = response.result?.market.change24hPct;
        return value === null || value === undefined ? null : Math.abs(value);
    });
    const rightMove = getNumericValue(right, (response) => {
        const value = response.result?.market.change24hPct;
        return value === null || value === undefined ? null : Math.abs(value);
    });
    return compareNumericValues(leftMove, rightMove, {
        key: 'stability',
        label: 'Stability',
        closeDifference: 2,
        preferLower: true,
        presentSideSummary: {
            left: (leftLabel) => `${leftLabel} looks more stable based on smaller 24h price movement.`,
            right: (_leftLabel, rightLabel) => `${rightLabel} looks more stable based on smaller 24h price movement.`
        },
        tieSummary: 'Both assets show similar short-term price stability.',
        unknownSummary: 'Stability comparison is limited because recent price-move data is incomplete.'
    }, left, right);
}
function getWinningItems(items, side) {
    return items.filter((item) => item.betterSide === side).map((item) => item.key);
}
function getMarketCap(response) {
    return getNumericValue(response, (candidate) => candidate.result?.market.marketCapUsd ?? null);
}
function getVolume(response) {
    return getNumericValue(response, (candidate) => candidate.result?.market.volume24hUsd ?? null);
}
function getAbsMove(response) {
    return getNumericValue(response, (candidate) => {
        const value = candidate.result?.market.change24hPct;
        return value === null || value === undefined ? null : Math.abs(value);
    });
}
function looksBlueChipCandidate(response) {
    const marketCap = getMarketCap(response);
    return marketCap !== null && marketCap >= 10000000000;
}
function describeScaleGap(winner, loser) {
    const winnerCap = getMarketCap(winner);
    const loserCap = getMarketCap(loser);
    if (winnerCap === null || loserCap === null || loserCap <= 0)
        return null;
    const ratio = winnerCap / loserCap;
    if (ratio >= 5)
        return 'with a much larger market footprint';
    if (ratio >= 2)
        return 'with a clearly larger market footprint';
    if (ratio >= 1.25)
        return 'with a moderate market-size edge';
    return null;
}
function describeLiquidityGap(winner, loser) {
    const winnerVolume = getVolume(winner);
    const loserVolume = getVolume(loser);
    if (winnerVolume === null || loserVolume === null || loserVolume <= 0)
        return null;
    const ratio = winnerVolume / loserVolume;
    if (ratio >= 2)
        return 'and noticeably deeper trading activity';
    if (ratio >= 1.25)
        return 'and somewhat deeper trading activity';
    return null;
}
function describeStabilityState(items, winningSide, winningLabel, losingLabel) {
    const stabilityItem = items.find((item) => item.key === 'stability');
    if (!stabilityItem)
        return null;
    if (stabilityItem.betterSide === 'tie')
        return 'while recent price stability still looks broadly similar';
    if (stabilityItem.betterSide === winningSide)
        return `while ${winningLabel} also looks steadier in recent price movement`;
    const losingSide = winningSide === 'left' ? 'right' : 'left';
    if (stabilityItem.betterSide === losingSide)
        return `even though ${losingLabel} looks steadier in recent price movement`;
    return null;
}
function buildWinnerSummary(items, left, right, winningSide) {
    const winningLabel = winningSide === 'left' ? getDisplayName(left) : getDisplayName(right);
    const losingLabel = winningSide === 'left' ? getDisplayName(right) : getDisplayName(left);
    const winnerResponse = winningSide === 'left' ? left : right;
    const loserResponse = winningSide === 'left' ? right : left;
    const winningItems = getWinningItems(items, winningSide);
    const stabilityPhrase = describeStabilityState(items, winningSide, winningLabel, losingLabel);
    if (winningItems.includes('liquidity') && winningItems.includes('size')) {
        const scaleGap = describeScaleGap(winnerResponse, loserResponse);
        const liquidityGap = describeLiquidityGap(winnerResponse, loserResponse);
        const blueChipVsBlueChip = looksBlueChipCandidate(winnerResponse) && looksBlueChipCandidate(loserResponse);
        const base = blueChipVsBlueChip
            ? `${winningLabel} still looks like the stronger large-cap setup`
            : `${winningLabel} still looks like the stronger market-structure setup`;
        const extras = [scaleGap, liquidityGap].filter(Boolean).join(' ');
        if (extras && stabilityPhrase)
            return `${base} ${extras}, ${stabilityPhrase}.`;
        if (extras)
            return `${base} ${extras}.`;
        if (stabilityPhrase)
            return `${base}, ${stabilityPhrase}.`;
        return `${base}.`;
    }
    if (winningItems.includes('liquidity') && winningItems.includes('stability')) {
        return `${winningLabel} looks stronger on trading support and short-term stability, even without a clear size advantage.`;
    }
    if (winningItems.includes('size') && winningItems.includes('stability')) {
        return `${winningLabel} combines the larger market base with the steadier recent price profile in this snapshot.`;
    }
    if (winningItems.includes('liquidity')) {
        return stabilityPhrase
            ? `${winningLabel} has the clearer liquidity edge, ${stabilityPhrase}.`
            : `${winningLabel} has the clearer liquidity edge in this snapshot.`;
    }
    if (winningItems.includes('size')) {
        return stabilityPhrase
            ? `${winningLabel} carries the size advantage here, ${stabilityPhrase}.`
            : `${winningLabel} carries the clearer market-size advantage in this snapshot.`;
    }
    if (winningItems.includes('stability')) {
        return `${winningLabel} looks steadier in recent price movement, which gives it the cleaner short-term profile right now.`;
    }
    return 'The two assets are mixed across liquidity, size, and recent stability.';
}
function buildMixedSummary(items, left, right) {
    const leftLabel = getDisplayName(left);
    const rightLabel = getDisplayName(right);
    const leftWins = getWinningItems(items, 'left');
    const rightWins = getWinningItems(items, 'right');
    if (leftWins.includes('liquidity') && rightWins.includes('size')) {
        return `${leftLabel} looks more liquid right now, while ${rightLabel} carries the larger market footprint, so the setup still reads as a real trade-off.`;
    }
    if (rightWins.includes('liquidity') && leftWins.includes('size')) {
        return `${rightLabel} looks more liquid right now, while ${leftLabel} carries the larger market footprint, so the setup still reads as a real trade-off.`;
    }
    if (leftWins.includes('stability') || rightWins.includes('stability')) {
        const stableWinner = leftWins.includes('stability') ? leftLabel : rightLabel;
        const otherLabel = stableWinner === leftLabel ? rightLabel : leftLabel;
        return `${stableWinner} looks steadier in recent price movement, but ${otherLabel} still answers back on other market signals, so this remains a mixed comparison.`;
    }
    return 'The two assets are mixed across liquidity, size, and recent stability.';
}
function buildSummary(items, left, right) {
    const unknownCount = items.filter((item) => item.betterSide === 'unknown').length;
    if (unknownCount >= 2) {
        return 'Comparison insight is limited because one or both assets are missing important market data.';
    }
    const leftWins = items.filter((item) => item.betterSide === 'left');
    const rightWins = items.filter((item) => item.betterSide === 'right');
    if (leftWins.length === 0 && rightWins.length === 0) {
        return 'The two assets look broadly similar across liquidity, size, and recent stability.';
    }
    if (leftWins.length > 0 && rightWins.length > 0) {
        return buildMixedSummary(items, left, right);
    }
    return buildWinnerSummary(items, left, right, leftWins.length > 0 ? 'left' : 'right');
}
export function generateComparativeIntelligence(left, right) {
    const items = [buildLiquidityInsight(left, right), buildSizeInsight(left, right), buildStabilityInsight(left, right)];
    return {
        summary: buildSummary(items, left, right),
        items
    };
}
