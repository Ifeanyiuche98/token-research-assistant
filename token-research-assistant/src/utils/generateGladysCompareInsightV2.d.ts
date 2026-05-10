import type { CompareResponse, GladysV2Insight } from '../types/compare';
export declare function buildGladysV2SystemPrompt(): string;
export declare function buildGladysV2UserPrompt(comparison: CompareResponse): string;
export declare function generateGladysCompareInsightV2(comparison: CompareResponse): Promise<GladysV2Insight | null>;
