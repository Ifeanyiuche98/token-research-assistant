import type { ResearchResponse, SignalTone } from './research';
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
export interface GladysCompareInsight {
    headline: string;
    verdict: string;
    caution: string;
    confidenceNote: string;
    strongerSideLabel: string;
    weakerSideLabel: string;
    tone: SignalTone;
    reasons: string[];
}
export type CompareResponse = {
    left: ResearchResponse;
    right: ResearchResponse;
    comparativeIntelligence: ComparativeIntelligence | null;
    gladysInsight: GladysCompareInsight | null;
    meta: {
        generatedAt: string;
    };
};
export type CompareUiState = {
    type: 'loading';
    leftQuery: string;
    rightQuery: string;
} | {
    type: 'result';
    data: CompareResponse;
} | {
    type: 'error';
    message: string;
};
