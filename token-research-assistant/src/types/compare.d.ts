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
export type GladysV2PriorityLabel = 'safer choice' | 'cleaner structure' | 'closer call' | 'higher upside' | 'better momentum profile' | 'better long-term credibility';
export type GladysV2Confidence = 'high' | 'moderate' | 'limited';
export type GladysV2DecisionConfidence = 'high' | 'moderate' | 'low';
export interface GladysV2PriorityAngle {
    label: GladysV2PriorityLabel;
    recommendation: string;
    reason: string;
}
export interface GladysV2Insight {
    version: 'v2';
    status: 'ready' | 'fallback_only' | 'degraded';
    headline: string;
    shortVerdict: string;
    strongerSideLabel: string;
    weakerSideLabel: string | null;
    decisiveTradeoff: string;
    watchout: string;
    dataConfidence: GladysV2Confidence;
    decisionConfidence: GladysV2DecisionConfidence;
    confidenceRationale: string;
    priorityAngles: GladysV2PriorityAngle[];
    reasons: string[];
    groundedInFallback: boolean;
}
export type CompareResponse = {
    left: ResearchResponse;
    right: ResearchResponse;
    comparativeIntelligence: ComparativeIntelligence | null;
    gladysInsight: GladysCompareInsight | null;
    gladysV2Insight: GladysV2Insight | null;
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
