import type { CompareResponse } from '../types/compare';
import type { SignalTone } from '../types/research';
export type GladysCompareInsight = {
    headline: string;
    verdict: string;
    caution: string;
    confidenceNote: string;
    strongerSideLabel: string;
    weakerSideLabel: string;
    tone: SignalTone;
    reasons: string[];
};
export declare function generateGladysCompareInsight(comparison: CompareResponse): GladysCompareInsight;
