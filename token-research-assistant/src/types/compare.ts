import type { ResearchResponse } from './research';

export type CompareResponse = {
  left: ResearchResponse;
  right: ResearchResponse;
  meta: {
    generatedAt: string;
  };
};

export type CompareUiState =
  | { type: 'loading'; leftQuery: string; rightQuery: string }
  | { type: 'result'; data: CompareResponse }
  | { type: 'error'; message: string };
