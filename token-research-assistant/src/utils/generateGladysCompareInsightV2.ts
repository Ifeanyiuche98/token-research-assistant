import type { CompareResponse, GladysV2Insight } from '../types/compare';
import { buildGladysV2Input } from './buildGladysV2Input';
import { validateGladysV2Insight } from './validateGladysV2Insight';

function isGladysV2Enabled() {
  return false;
}

function buildPromptPayload(comparison: CompareResponse) {
  return buildGladysV2Input(comparison);
}

export function buildGladysV2SystemPrompt() {
  return [
    'You are GLADYS v2, a decision-oriented comparison analyst for crypto assets.',
    'Use only the structured comparison payload provided to you.',
    'Do not invent missing data, catalysts, metrics, or project claims.',
    'Respect severe risk signals and limited-data warnings.',
    'Return valid JSON only.'
  ].join(' ');
}

export function buildGladysV2UserPrompt(comparison: CompareResponse) {
  return [
    'Generate a structured GLADYS v2 compare insight.',
    'Stay grounded in the provided deterministic comparison signals.',
    'Be concise, cautious, and decision-useful.',
    'Payload:',
    JSON.stringify(buildPromptPayload(comparison), null, 2)
  ].join('\n\n');
}

export async function generateGladysCompareInsightV2(comparison: CompareResponse): Promise<GladysV2Insight | null> {
  if (!isGladysV2Enabled()) {
    return null;
  }

  void buildPromptPayload(comparison);
  void buildGladysV2SystemPrompt();
  void buildGladysV2UserPrompt(comparison);

  const candidate: unknown = null;
  const validation = validateGladysV2Insight(candidate, comparison);
  return validation.ok ? validation.insight : null;
}
