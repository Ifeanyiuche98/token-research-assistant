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
            return 2;
        case 'high':
            return 0;
        default:
            return 1;
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
    if (leftScore !== null && rightScore !== null && leftScore !== rightScore) {
        return leftScore < rightScore ? 'left' : 'right';
    }
    return 'tie';
}
function unique(items) {
    return [...new Set(items.filter((item) => Boolean(item && item.trim())))];
}
function replaceSideLabels(summary, leftName, rightName) {
    return summary.replace(/\bLeft\b/g, leftName).replace(/\bRight\b/g, rightName).replace(/\bleft\b/g, leftName).replace(/\bright\b/g, rightName);
}
export function generateGladysCompareInsight(comparison) {
    const { left, right, comparativeIntelligence } = comparison;
    const leftName = getDisplayName(left);
    const rightName = getDisplayName(right);
    const wins = { left: 0, right: 0 };
    for (const item of comparativeIntelligence?.items ?? []) {
        if (item.betterSide === 'left')
            wins.left += 1;
        if (item.betterSide === 'right')
            wins.right += 1;
    }
    const riskEdge = summarizeRiskEdge(left, right);
    if (riskEdge === 'left')
        wins.left += 1;
    if (riskEdge === 'right')
        wins.right += 1;
    const leftConfidence = getSourceConfidence(left);
    const rightConfidence = getSourceConfidence(right);
    if (leftConfidence > rightConfidence)
        wins.left += 1;
    if (rightConfidence > leftConfidence)
        wins.right += 1;
    const strongerSide = wins.left === wins.right ? 'tie' : wins.left > wins.right ? 'left' : 'right';
    const strongerLabel = strongerSide === 'left' ? leftName : strongerSide === 'right' ? rightName : 'Neither side';
    const weakerLabel = strongerSide === 'left' ? rightName : strongerSide === 'right' ? leftName : 'neither asset';
    const reasons = unique([
        comparativeIntelligence?.items.find((item) => item.key === 'liquidity' && item.betterSide === strongerSide)?.summary,
        comparativeIntelligence?.items.find((item) => item.key === 'size' && item.betterSide === strongerSide)?.summary,
        riskEdge === 'left' ? `${leftName} carries the cleaner visible risk posture right now.` : null,
        riskEdge === 'right' ? `${rightName} carries the cleaner visible risk posture right now.` : null,
        strongerSide === 'left' && leftConfidence > rightConfidence ? `${leftName} is coming through the stronger source path, which improves confidence in the read.` : null,
        strongerSide === 'right' && rightConfidence > leftConfidence ? `${rightName} is coming through the stronger source path, which improves confidence in the read.` : null,
        comparativeIntelligence?.items.find((item) => item.key === 'stability' && item.betterSide === strongerSide)?.summary
    ])
        .map((summary) => replaceSideLabels(summary, leftName, rightName))
        .slice(0, 3);
    const headline = strongerSide === 'tie'
        ? 'GLADYS: No clean winner yet'
        : `GLADYS: ${strongerLabel} looks structurally stronger`;
    const verdict = strongerSide === 'tie'
        ? `${leftName} and ${rightName} look mixed overall, so this comparison is better treated as a trade-off than a clean winner-versus-loser setup.`
        : `${strongerLabel} currently looks stronger overall, while ${weakerLabel} needs more caution unless its weaker signals improve.`;
    const caution = strongerSide === 'tie'
        ? 'Main caution: similar metrics do not mean both assets carry the same trust or downside profile.'
        : `Main caution: ${strongerLabel} looks better on balance, but that does not make ${weakerLabel} weak by default or ${strongerLabel} automatically safe.`;
    const confidenceNote = leftConfidence === rightConfidence
        ? 'Confidence: moderate, because both assets come through similarly reliable source paths.'
        : strongerSide === 'tie'
            ? 'Confidence: moderate, but source quality is uneven enough that manual verification still matters.'
            : `Confidence: moderate, with a slightly cleaner read on ${strongerLabel} because its source path looks stronger.`;
    const tone = strongerSide === 'tie' ? 'caution' : riskEdge === strongerSide ? 'positive' : 'neutral';
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
