function getDisplayName(response) {
    return response.result?.identity.name ?? response.query.raw;
}
function getRiskLevel(response) {
    return response.result?.risk?.level ?? 'unknown';
}
function getRiskScore(response) {
    const score = response.result?.risk?.score;
    return typeof score === 'number' && Number.isFinite(score) ? score : null;
}
function getSourceConfidence(response) {
    if (response.result?.identity.source === 'coingecko' && response.result?.fallback.used === false)
        return 3;
    if (response.result?.identity.source === 'dexscreener')
        return 1;
    if (response.result?.fallback.used)
        return 1;
    return 2;
}
function riskWeight(level) {
    switch (level) {
        case 'low':
            return 3;
        case 'medium':
            return 1;
        case 'high':
            return -3;
        default:
            return 0;
    }
}
function summarizeRiskEdge(left, right) {
    const leftLevel = getRiskLevel(left);
    const rightLevel = getRiskLevel(right);
    const leftScore = getRiskScore(left);
    const rightScore = getRiskScore(right);
    if (leftLevel !== rightLevel) {
        return riskWeight(leftLevel) > riskWeight(rightLevel) ? 'left' : 'right';
    }
    if (leftScore !== null && rightScore !== null) {
        const diff = Math.abs(leftScore - rightScore);
        if (diff >= 0.75) {
            return leftScore < rightScore ? 'left' : 'right';
        }
    }
    return 'tie';
}
function hasSevereRisk(response) {
    const risk = response.result?.risk;
    return risk?.overrideReason === 'honeypot_exit_risk' || risk?.level === 'high' || risk?.details?.trustLabel === 'danger';
}
function hasLimitedData(response) {
    return response.status !== 'live' || response.result?.fallback.used === true || !response.result?.market;
}
function countSideWins(comparison, side) {
    return (comparison.comparativeIntelligence?.items ?? []).filter((item) => item.betterSide === side).length;
}
function buildSideAssessment(comparison, side) {
    const response = comparison[side];
    const name = getDisplayName(response);
    const sourceConfidence = getSourceConfidence(response);
    const limitedData = hasLimitedData(response);
    const severeRisk = hasSevereRisk(response);
    const riskLevel = getRiskLevel(response);
    const riskScore = getRiskScore(response);
    const comparativeWins = countSideWins(comparison, side);
    let score = comparativeWins * 2;
    score += riskWeight(riskLevel) * 2;
    score += sourceConfidence - 2;
    if (riskScore !== null) {
        score += Math.max(-2, Math.min(2, (5 - riskScore) / 2));
    }
    if (limitedData)
        score -= 2;
    if (severeRisk)
        score -= 4;
    return {
        side,
        name,
        score,
        sourceConfidence,
        limitedData,
        severeRisk,
        riskLevel
    };
}
function unique(items) {
    return [...new Set(items.filter((item) => Boolean(item && item.trim())))];
}
function replaceSideLabels(summary, leftName, rightName) {
    return summary.replace(/\bLeft\b/g, leftName).replace(/\bRight\b/g, rightName).replace(/\bleft\b/g, leftName).replace(/\bright\b/g, rightName);
}
function chooseOutcome(left, right) {
    if (left.severeRisk && !right.severeRisk)
        return 'right';
    if (right.severeRisk && !left.severeRisk)
        return 'left';
    const scoreDiff = left.score - right.score;
    const requiresWiderEdge = left.limitedData || right.limitedData;
    const decisiveThreshold = requiresWiderEdge ? 3 : 2;
    if (Math.abs(scoreDiff) >= decisiveThreshold) {
        return scoreDiff > 0 ? 'left' : 'right';
    }
    if (left.limitedData !== right.limitedData) {
        return 'tie';
    }
    return 'tie';
}
function getOutcomeLabels(outcome, left, right) {
    if (outcome === 'left') {
        return { strongerLabel: left.name, weakerLabel: right.name };
    }
    if (outcome === 'right') {
        return { strongerLabel: right.name, weakerLabel: left.name };
    }
    return { strongerLabel: 'Neither side', weakerLabel: 'neither asset' };
}
function getWinningReasons(comparison, winningSide, leftName, rightName) {
    return (comparison.comparativeIntelligence?.items ?? [])
        .filter((item) => item.betterSide === winningSide)
        .map((item) => replaceSideLabels(item.summary, leftName, rightName));
}
function buildReasons(comparison, outcome, left, right, riskEdge) {
    if (outcome === 'tie') {
        const bothLimited = left.limitedData && right.limitedData;
        const oneLimited = left.limitedData !== right.limitedData;
        return unique([
            bothLimited ? 'Both sides still need manual verification because the comparison is leaning on fallback-heavy or incomplete market data.' : null,
            oneLimited ? 'One side has a weaker data path, which keeps this from being treated as a clean like-for-like decision.' : null,
            comparison.comparativeIntelligence?.summary,
            riskEdge === 'tie' ? 'Neither side has a decisive risk advantage from the visible data.' : null,
            !bothLimited && !oneLimited ? 'The visible signals stay close enough that this still reads as a trade-off rather than a decisive winner.' : null
        ]).slice(0, 3);
    }
    const winningSide = outcome;
    const winningAssessment = winningSide === 'left' ? left : right;
    const losingAssessment = winningSide === 'left' ? right : left;
    return unique([
        losingAssessment.severeRisk ? `${losingAssessment.name} has at least one severe caution signal weighing on the comparison.` : null,
        winningAssessment.limitedData === false && losingAssessment.limitedData === true ? `${winningAssessment.name} has the cleaner data path, while ${losingAssessment.name} is more limited or fallback-heavy.` : null,
        riskEdge === winningSide ? `${winningAssessment.name} carries the cleaner visible risk posture right now.` : null,
        ...getWinningReasons(comparison, winningSide, left.name, right.name),
        winningAssessment.sourceConfidence > losingAssessment.sourceConfidence ? `${winningAssessment.name} comes through the stronger source path, which improves confidence in the read.` : null
    ]).slice(0, 3);
}
function buildHeadline(outcome, strongerLabel, left, right, riskEdge) {
    if (outcome === 'tie') {
        if (left.limitedData || right.limitedData)
            return 'GLADYS: No clean winner yet';
        if (riskEdge !== 'tie')
            return 'GLADYS: Close call with one cleaner risk profile';
        return 'GLADYS: No clean winner yet';
    }
    const winner = outcome === 'left' ? left : right;
    const loser = outcome === 'left' ? right : left;
    if (loser.severeRisk)
        return `GLADYS: ${strongerLabel} looks safer on this setup`;
    if (winner.limitedData === false && loser.limitedData === true)
        return `GLADYS: ${strongerLabel} has the cleaner read`;
    if (riskEdge === outcome)
        return `GLADYS: ${strongerLabel} looks structurally stronger`;
    return `GLADYS: ${strongerLabel} has the clearer edge right now`;
}
function buildVerdict(comparison, outcome, strongerLabel, weakerLabel, left, right, riskEdge) {
    if (outcome === 'tie') {
        if (left.limitedData && right.limitedData) {
            return `${left.name} and ${right.name} still need a caution-first read because both sides are leaning on incomplete or fallback-heavy data.`;
        }
        if (left.limitedData || right.limitedData) {
            return `${left.name} and ${right.name} still look mixed overall, and the weaker data path keeps this from becoming a clean winner-versus-loser call.`;
        }
        if (riskEdge !== 'tie') {
            const cleaner = riskEdge === 'left' ? left.name : right.name;
            return `${left.name} and ${right.name} remain close overall, but ${cleaner} carries the cleaner visible risk posture in this snapshot.`;
        }
        return `${left.name} and ${right.name} still look mixed overall, so this is better treated as a trade-off than a clear winner-versus-loser setup.`;
    }
    const winner = outcome === 'left' ? left : right;
    const loser = outcome === 'left' ? right : left;
    const winnerWins = countSideWins(comparison, outcome);
    if (loser.severeRisk) {
        return `${strongerLabel} currently looks like the safer side because ${weakerLabel} carries at least one heavier caution signal in the current read.`;
    }
    if (winner.limitedData === false && loser.limitedData === true) {
        return `${strongerLabel} currently has the cleaner overall read, while ${weakerLabel} is harder to trust because more of its path is limited or fallback-heavy.`;
    }
    if (winnerWins >= 2 && riskEdge === outcome) {
        return `${strongerLabel} currently has the clearer edge because the visible metrics and risk posture are lining up on the same side.`;
    }
    return `${strongerLabel} currently looks stronger on balance, while ${weakerLabel} needs more caution unless its weaker signals improve.`;
}
function buildCaution(outcome, strongerLabel, weakerLabel, left, right) {
    if (outcome === 'tie') {
        if (left.limitedData || right.limitedData) {
            return 'Main caution: a cautious tie does not mean the assets are equally trustworthy — it may just mean the current data is too uneven to separate them cleanly.';
        }
        return 'Main caution: similar-looking metrics still do not mean both assets carry the same trust or downside profile.';
    }
    const loser = outcome === 'left' ? right : left;
    if (loser.severeRisk) {
        return `${strongerLabel} may look safer here, but that does not remove the need to verify token identity, liquidity depth, and downside scenarios manually.`;
    }
    return `${strongerLabel} looks better on balance, but that still does not make it automatically safe or ${weakerLabel} automatically weak.`;
}
function buildConfidenceNote(outcome, strongerLabel, left, right, riskEdge) {
    if (outcome === 'tie') {
        if (left.limitedData || right.limitedData) {
            return 'Confidence: limited to moderate, because the comparison still includes uneven or fallback-heavy data.';
        }
        if (riskEdge !== 'tie') {
            const cleaner = riskEdge === 'left' ? left.name : right.name;
            return `Confidence: moderate, because the overall setup is still close even though ${cleaner} has the cleaner visible risk posture.`;
        }
        return 'Confidence: moderate, because neither side created a decisive enough edge to call this cleanly.';
    }
    const winner = outcome === 'left' ? left : right;
    const loser = outcome === 'left' ? right : left;
    if (winner.limitedData) {
        return `Confidence: moderate, but ${strongerLabel} still has some data limitations worth verifying manually.`;
    }
    if (loser.limitedData) {
        return `Confidence: moderate, with extra trust in ${strongerLabel} because the opposite side is more fallback-heavy.`;
    }
    if (loser.severeRisk) {
        return `Confidence: moderate, because ${strongerLabel} benefits from a cleaner safety profile rather than just a small metric edge.`;
    }
    if (winner.sourceConfidence === loser.sourceConfidence && riskEdge === outcome) {
        return `Confidence: moderate, because both assets come through similarly reliable source paths and ${strongerLabel} still keeps the cleaner visible setup.`;
    }
    if (winner.sourceConfidence === loser.sourceConfidence) {
        return 'Confidence: moderate, because both assets come through similarly reliable source paths.';
    }
    return `Confidence: moderate, with a cleaner read on ${strongerLabel} because its source path looks stronger.`;
}
export function generateGladysCompareInsight(comparison) {
    const left = buildSideAssessment(comparison, 'left');
    const right = buildSideAssessment(comparison, 'right');
    const riskEdge = summarizeRiskEdge(comparison.left, comparison.right);
    const outcome = chooseOutcome(left, right);
    const { strongerLabel, weakerLabel } = getOutcomeLabels(outcome, left, right);
    const reasons = buildReasons(comparison, outcome, left, right, riskEdge);
    const headline = buildHeadline(outcome, strongerLabel, left, right, riskEdge);
    const verdict = buildVerdict(comparison, outcome, strongerLabel, weakerLabel, left, right, riskEdge);
    const caution = buildCaution(outcome, strongerLabel, weakerLabel, left, right);
    const confidenceNote = buildConfidenceNote(outcome, strongerLabel, left, right, riskEdge);
    const tone = outcome === 'tie' ? 'caution' : outcome === riskEdge || (outcome === 'left' ? right : left).severeRisk ? 'positive' : 'neutral';
    return {
        headline,
        verdict,
        caution,
        confidenceNote,
        strongerSideLabel: strongerLabel,
        weakerSideLabel: weakerLabel,
        tone,
        reasons
    };
}
