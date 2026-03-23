import type { ResearchResponse } from './research';

export interface ComparisonInsightItem {
  key: 'liquidity' | 'size' | 'stability';
  label: string;
  betterSide: 'left' | 'right' | 'tie' | 'unknown';
  summary: string;
}

export interface ComparativeIntelligence {
  summary: string;
  items: ComparisonInsightItem[];
}

export type CompareResponse = {
  left: ResearchResponse;
  right: ResearchResponse;
  comparativeIntelligence: ComparativeIntelligence | null;
  meta: {
    generatedAt: string;
  };
};

export type CompareUiState =
  | { type: 'loading'; leftQuery: string; rightQuery: string }
  | { type: 'result'; data: CompareResponse }
  | { type: 'error'; message: string };
