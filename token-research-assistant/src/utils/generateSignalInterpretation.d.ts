import type { ResearchResult, RiskAnalysis, SignalInterpretation } from '../types/research';
type MarketData = ResearchResult['market'];
export declare function generateSignalInterpretation(market: MarketData, risk: RiskAnalysis): SignalInterpretation;
export {};
