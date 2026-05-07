import type { ResearchResponse, SignalTone, TrustRiskBand, TrustRiskLabel } from '../types/research';
export type GladysInsightInput = {
    token: {
        name: string | null;
        symbol: string | null;
        source: 'coingecko' | 'dexscreener' | 'local';
        confidence: 'high' | 'medium' | 'low';
    };
    risk: {
        level: 'low' | 'medium' | 'high' | 'unknown';
        band: 'lower' | 'elevated' | 'high' | 'unknown';
        score: number | null;
        summaryMode: string;
        dominantDriver: string | null;
        overrideReason: string | null;
        flags: string[];
        honeypot: boolean | null;
        trustLabel: TrustRiskLabel;
        trustScore: number | null;
        liquidityRisk: TrustRiskBand;
        volumeAnomaly: boolean | null;
        ageRisk: TrustRiskBand;
    };
    signalInterpretation: {
        tone: SignalTone;
        summary: string | null;
        topSignals: string[];
    };
    researchBrief: {
        headline: string | null;
        body: string | null;
    };
    sector: string | null;
    fallback: {
        used: boolean;
        reason: string;
    };
};
export type GladysInsight = {
    headline: string;
    summary: string;
    riskCall: string;
    confidenceNote: string;
    actionNote: string;
    tone: SignalTone;
    bullets: string[];
};
export declare function buildGladysInput(response: ResearchResponse): GladysInsightInput | null;
export declare function generateGladysInsight(input: GladysInsightInput): GladysInsight;
