import { resolveResearch } from './endpoint';
import { normalizeQuery } from './query';
import { generateComparativeIntelligence } from '../../utils/generateComparativeIntelligence';
import type { CompareResponse } from '../../types/compare';

export async function resolveComparison(leftQueryValue: string, rightQueryValue: string): Promise<{ statusCode: number; body: CompareResponse | { message: string } }> {
  const leftTrimmed = leftQueryValue.trim();
  const rightTrimmed = rightQueryValue.trim();

  if (!leftTrimmed || !rightTrimmed) {
    return {
      statusCode: 400,
      body: {
        message: 'Please enter both tokens before comparing.'
      }
    };
  }

  if (normalizeQuery(leftTrimmed) === normalizeQuery(rightTrimmed)) {
    return {
      statusCode: 400,
      body: {
        message: 'Choose two different tokens or projects to compare.'
      }
    };
  }

  const [left, right] = await Promise.all([resolveResearch(leftTrimmed), resolveResearch(rightTrimmed)]);

  return {
    statusCode: 200,
    body: {
      left: left.body,
      right: right.body,
      comparativeIntelligence: generateComparativeIntelligence(left.body, right.body),
      meta: {
        generatedAt: new Date().toISOString()
      }
    }
  };
}
