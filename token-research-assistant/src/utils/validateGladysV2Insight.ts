import type { CompareResponse, GladysV2Insight, GladysV2PriorityAngle } from '../types/compare';

export type GladysV2ValidationResult =
  | { ok: true; insight: GladysV2Insight }
  | { ok: false; reason: string };

type GladysV2Draft = Omit<GladysV2Insight, 'version' | 'status'>;

const VALID_DATA_CONFIDENCE = new Set(['high', 'moderate', 'limited']);
const VALID_DECISION_CONFIDENCE = new Set(['high', 'moderate', 'low']);
const VALID_PRIORITY_LABELS = new Set([
  'safer choice',
  'cleaner structure',
  'closer call',
  'higher upside',
  'better momentum profile',
  'better long-term credibility'
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function getDisplayName(response: CompareResponse['left']) {
  return response.result?.identity.name ?? response.query.raw;
}

function hasSevereRisk(response: CompareResponse['left']) {
  const risk = response.result?.risk;
  return risk?.overrideReason === 'honeypot_exit_risk' || risk?.level === 'high' || risk?.details?.trustLabel === 'danger';
}

function hasLimitedData(response: CompareResponse['left']) {
  return response.status !== 'live' || response.result?.fallback.used === true || !response.result?.market;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePriorityAngles(value: unknown): GladysV2PriorityAngle[] | null {
  if (!Array.isArray(value)) return null;

  const normalized = value
    .filter(isObject)
    .map((item) => ({
      label: item.label,
      recommendation: item.recommendation,
      reason: item.reason
    }))
    .filter(
      (item): item is GladysV2PriorityAngle =>
        typeof item.label === 'string' &&
        VALID_PRIORITY_LABELS.has(item.label) &&
        isNonEmptyString(item.recommendation) &&
        isNonEmptyString(item.reason)
    )
    .slice(0, 3);

  return normalized.length >= 1 ? normalized : null;
}

function normalizeReasons(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const reasons = value.filter(isNonEmptyString).map((reason) => reason.trim()).slice(0, 4);
  return reasons.length >= 1 ? reasons : null;
}

function inferDeterministicOutcome(comparison: CompareResponse): 'left' | 'right' | 'tie' {
  const stronger = comparison.gladysInsight?.strongerSideLabel;
  const leftName = getDisplayName(comparison.left);
  const rightName = getDisplayName(comparison.right);

  if (!stronger || stronger === 'Neither side') return 'tie';
  if (stronger === leftName) return 'left';
  if (stronger === rightName) return 'right';
  return 'tie';
}

function findMetricWinner(comparison: CompareResponse, key: 'liquidity' | 'size' | 'stability') {
  return comparison.comparativeIntelligence?.items.find((item) => item.key === key)?.betterSide ?? 'unknown';
}

export function validateGladysV2Insight(candidate: unknown, comparison: CompareResponse): GladysV2ValidationResult {
  if (!isObject(candidate)) {
    return { ok: false, reason: 'GLADYS v2 output is not an object.' };
  }

  const priorityAngles = normalizePriorityAngles(candidate.priorityAngles);
  if (!priorityAngles) {
    return { ok: false, reason: 'GLADYS v2 output is missing valid priority angles.' };
  }

  const reasons = normalizeReasons(candidate.reasons);
  if (!reasons) {
    return { ok: false, reason: 'GLADYS v2 output is missing valid reasons.' };
  }

  const draft: GladysV2Draft = {
    headline: typeof candidate.headline === 'string' ? candidate.headline.trim() : '',
    shortVerdict: typeof candidate.shortVerdict === 'string' ? candidate.shortVerdict.trim() : '',
    strongerSideLabel: typeof candidate.strongerSideLabel === 'string' ? candidate.strongerSideLabel.trim() : '',
    weakerSideLabel: candidate.weakerSideLabel === null ? null : typeof candidate.weakerSideLabel === 'string' ? candidate.weakerSideLabel.trim() : null,
    decisiveTradeoff: typeof candidate.decisiveTradeoff === 'string' ? candidate.decisiveTradeoff.trim() : '',
    watchout: typeof candidate.watchout === 'string' ? candidate.watchout.trim() : '',
    dataConfidence: candidate.dataConfidence as GladysV2Insight['dataConfidence'],
    decisionConfidence: candidate.decisionConfidence as GladysV2Insight['decisionConfidence'],
    confidenceRationale: typeof candidate.confidenceRationale === 'string' ? candidate.confidenceRationale.trim() : '',
    priorityAngles,
    reasons,
    groundedInFallback: candidate.groundedInFallback === true
  };

  if (!isNonEmptyString(draft.headline) || draft.headline.length > 120) {
    return { ok: false, reason: 'GLADYS v2 headline is missing or too long.' };
  }

  if (!isNonEmptyString(draft.shortVerdict) || draft.shortVerdict.length > 320) {
    return { ok: false, reason: 'GLADYS v2 short verdict is missing or too long.' };
  }

  if (!isNonEmptyString(draft.decisiveTradeoff) || !isNonEmptyString(draft.watchout) || !isNonEmptyString(draft.confidenceRationale)) {
    return { ok: false, reason: 'GLADYS v2 output is missing one or more required analysis fields.' };
  }

  if (!VALID_DATA_CONFIDENCE.has(draft.dataConfidence) || !VALID_DECISION_CONFIDENCE.has(draft.decisionConfidence)) {
    return { ok: false, reason: 'GLADYS v2 output has invalid confidence labels.' };
  }

  if (!draft.groundedInFallback) {
    return { ok: false, reason: 'GLADYS v2 output must explicitly stay grounded in fallback signals.' };
  }

  const leftName = getDisplayName(comparison.left);
  const rightName = getDisplayName(comparison.right);
  const deterministicOutcome = inferDeterministicOutcome(comparison);
  const leftSevere = hasSevereRisk(comparison.left);
  const rightSevere = hasSevereRisk(comparison.right);
  const limitedData = hasLimitedData(comparison.left) || hasLimitedData(comparison.right);
  const liquidityWinner = findMetricWinner(comparison, 'liquidity');
  const sizeWinner = findMetricWinner(comparison, 'size');

  if (deterministicOutcome === 'tie' && draft.decisionConfidence === 'high') {
    return { ok: false, reason: 'GLADYS v2 cannot claim high confidence when deterministic insight is a tie.' };
  }

  if (limitedData && draft.decisionConfidence === 'high') {
    return { ok: false, reason: 'GLADYS v2 cannot claim high decision confidence on limited-data comparisons.' };
  }

  if (leftSevere && draft.strongerSideLabel === leftName) {
    return { ok: false, reason: 'GLADYS v2 cannot recommend the severe-risk side as stronger.' };
  }

  if (rightSevere && draft.strongerSideLabel === rightName) {
    return { ok: false, reason: 'GLADYS v2 cannot recommend the severe-risk side as stronger.' };
  }

  const fullText = [
    draft.headline,
    draft.shortVerdict,
    draft.decisiveTradeoff,
    draft.watchout,
    draft.confidenceRationale,
    ...draft.reasons,
    ...draft.priorityAngles.flatMap((angle) => [angle.recommendation, angle.reason])
  ].join(' ');

  if (liquidityWinner === 'left' && /Ethereum has stronger liquidity/i.test(fullText) && rightName === 'Ethereum') {
    return { ok: false, reason: 'GLADYS v2 contradicted the liquidity winner.' };
  }

  if (sizeWinner === 'left' && /Ethereum is larger/i.test(fullText) && rightName === 'Ethereum') {
    return { ok: false, reason: 'GLADYS v2 contradicted the size winner.' };
  }

  if (/moon|guaranteed|massive breakout/i.test(fullText)) {
    return { ok: false, reason: 'GLADYS v2 output used hype or unsupported language.' };
  }

  return {
    ok: true,
    insight: {
      version: 'v2',
      status: 'ready',
      ...draft,
      reasons: draft.reasons.slice(0, 4),
      priorityAngles: draft.priorityAngles.slice(0, 3)
    }
  };
}
