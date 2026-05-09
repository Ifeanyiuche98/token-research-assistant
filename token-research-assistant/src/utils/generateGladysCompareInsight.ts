import type { CompareResponse, GladysCompareInsight } from '../types/compare';
import type { RiskLevel, SignalTone } from '../types/research';

type CompareSide = 'left' | 'right';
type CompareOutcome = CompareSide | 'tie';

type SideAssessment = {
  side: CompareSide;
  name: string;
  score: number;
  sourceConfidence: number;
  limitedData: boolean;
  severeRisk: boolean;
  riskLevel: RiskLevel;
};

function getDisplayName(response: CompareResponse['left']) {
  return response.result?.identity.name ?? response.query.raw;
}

function getRiskLevel(response: CompareResponse['left']): RiskLevel {
  return response.result?.risk?.level ?? 'unknown';
}

function getRiskScore(response: CompareResponse['left']): number | null {
  const score = response.result?.risk?.score;
  return typeof score === 'number' && Number.isFinite(score) ? score : null;
}

function getSourceConfidence(response: CompareResponse['left']) {
  if (response.result?.identity.source === 'coingecko' && response.result?.fallback.used === false) return 3;
  if (response.result?.identity.source === 'dexscreener') return 1;
  if (response.result?.fallback.used) return 1;
  return 2;
}

function riskWeight(level: RiskLevel) {
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

function summarizeRiskEdge(left: CompareResponse['left'], right: CompareResponse['right']): CompareOutcome {
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

function hasSevereRisk(response: CompareResponse['left']) {
  const risk = response.result?.risk;
  return risk?.overrideReason === 'honeypot_exit_risk' || risk?.level === 'high' || risk?.details?.trustLabel === 'danger';
}

function hasLimitedData(response: CompareResponse['left']) {
  return response.status !== 'live' || response.result?.fallback.used === true || !response.result?.market;
}

function countSideWins(comparison: CompareResponse, side: CompareSide) {
  return (comparison.comparativeIntelligence?.items ?? []).filter((item) => item.betterSide === side).length;
}

function buildSideAssessment(comparison: CompareResponse, side: CompareSide): SideAssessment {
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

  if (limitedData) score -= 2;
  if (severeRisk) score -= 4;

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

function unique(items: Array<string | null | undefined>) {
  return [...new Set(items.filter((item): item is string => Boolean(item && item.trim())))];
}

function replaceSideLabels(summary: string, leftName: string, rightName: string) {
  return summary.replace(/\bLeft\b/g, leftName).replace(/\bRight\b/g, rightName).replace(/\bleft\b/g, leftName).replace(/\bright\b/g, rightName);
}

function chooseOutcome(left: SideAssessment, right: SideAssessment): CompareOutcome {
  if (left.severeRisk && !right.severeRisk) return 'right';
  if (right.severeRisk && !left.severeRisk) return 'left';

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

function getOutcomeLabels(outcome: CompareOutcome, left: SideAssessment, right: SideAssessment) {
  if (outcome === 'left') {
    return { strongerLabel: left.name, weakerLabel: right.name };
  }

  if (outcome === 'right') {
    return { strongerLabel: right.name, weakerLabel: left.name };
  }

  return { strongerLabel: 'Neither side', weakerLabel: 'neither asset' };
}

function buildReasons(
  comparison: CompareResponse,
  outcome: CompareOutcome,
  left: SideAssessment,
  right: SideAssessment,
  riskEdge: CompareOutcome
) {
  if (outcome === 'tie') {
    return unique([
      comparison.comparativeIntelligence?.summary,
      left.limitedData || right.limitedData ? 'Data quality is uneven enough that the comparison still needs manual verification.' : null,
      riskEdge === 'tie' ? 'Neither side has a decisive risk advantage from the visible data.' : null
    ]).slice(0, 3);
  }

  const winningSide = outcome;
  const winningAssessment = winningSide === 'left' ? left : right;
  const losingAssessment = winningSide === 'left' ? right : left;

  return unique([
    losingAssessment.severeRisk ? `${losingAssessment.name} has at least one severe caution signal weighing on the comparison.` : null,
    winningAssessment.limitedData === false && losingAssessment.limitedData === true ? `${winningAssessment.name} has the cleaner data path, while ${losingAssessment.name} is more limited or fallback-heavy.` : null,
    riskEdge === winningSide ? `${winningAssessment.name} carries the cleaner visible risk posture right now.` : null,
    comparison.comparativeIntelligence?.items.find((item) => item.key === 'liquidity' && item.betterSide === winningSide)?.summary,
    comparison.comparativeIntelligence?.items.find((item) => item.key === 'size' && item.betterSide === winningSide)?.summary,
    comparison.comparativeIntelligence?.items.find((item) => item.key === 'stability' && item.betterSide === winningSide)?.summary,
    winningAssessment.sourceConfidence > losingAssessment.sourceConfidence ? `${winningAssessment.name} comes through the stronger source path, which improves confidence in the read.` : null
  ])
    .map((summary) => replaceSideLabels(summary, left.name, right.name))
    .slice(0, 3);
}

export function generateGladysCompareInsight(comparison: CompareResponse): GladysCompareInsight {
  const left = buildSideAssessment(comparison, 'left');
  const right = buildSideAssessment(comparison, 'right');
  const riskEdge = summarizeRiskEdge(comparison.left, comparison.right);
  const outcome = chooseOutcome(left, right);
  const { strongerLabel, weakerLabel } = getOutcomeLabels(outcome, left, right);
  const reasons = buildReasons(comparison, outcome, left, right, riskEdge);

  const headline = outcome === 'tie' ? 'GLADYS: No clean winner yet' : `GLADYS: ${strongerLabel} looks structurally stronger`;

  const verdict =
    outcome === 'tie'
      ? `${left.name} and ${right.name} still look mixed overall, so this is better treated as a trade-off than a clear winner-versus-loser setup.`
      : `${strongerLabel} currently looks stronger on balance, while ${weakerLabel} needs more caution unless its weaker signals improve.`;

  const caution =
    outcome === 'tie'
      ? 'Main caution: similar-looking metrics still do not mean both assets carry the same trust or downside profile.'
      : `${strongerLabel} looks better on balance, but that still does not make it automatically safe or ${weakerLabel} automatically weak.`;

  const confidenceNote =
    outcome === 'tie'
      ? left.limitedData || right.limitedData
        ? 'Confidence: limited to moderate, because the comparison still includes uneven or fallback-heavy data.'
        : 'Confidence: moderate, because neither side created a decisive enough edge to call this cleanly.'
      : (outcome === 'left' ? left : right).limitedData
        ? `Confidence: moderate, but ${strongerLabel} still has some data limitations worth verifying manually.`
        : left.sourceConfidence === right.sourceConfidence
          ? 'Confidence: moderate, because both assets come through similarly reliable source paths.'
          : `Confidence: moderate, with a cleaner read on ${strongerLabel} because its source path looks stronger.`;

  const tone: SignalTone = outcome === 'tie' ? 'caution' : (outcome === riskEdge || (outcome === 'left' ? right : left).severeRisk ? 'positive' : 'neutral');

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
