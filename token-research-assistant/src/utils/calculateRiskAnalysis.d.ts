import type { ResearchResult, RiskAnalysis } from '../types/research';
type MarketData = ResearchResult['market'];
export declare function calculateRiskAnalysis(market: MarketData): RiskAnalysis;
export {};
