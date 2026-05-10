import type { CompareResponse } from '../types/compare';
export interface GladysV2InputSide {
    name: string;
    symbol: string;
    source: string;
    fallbackUsed: boolean;
    status: string;
    marketCapUsd: number | null;
    volume24hUsd: number | null;
    change24hPct: number | null;
    riskLevel: string | null;
    riskScore: number | null;
    riskSummary: string | null;
    trustLabel: string | null;
    researchBrief: string | null;
    sector: string | null;
}
export interface GladysV2Input {
    left: GladysV2InputSide;
    right: GladysV2InputSide;
    comparativeIntelligence: CompareResponse['comparativeIntelligence'];
    deterministicInsight: CompareResponse['gladysInsight'];
}
export declare function buildGladysV2Input(comparison: CompareResponse): GladysV2Input;
