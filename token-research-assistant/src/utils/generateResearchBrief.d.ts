import type { ResearchBrief, ResearchResult, RiskAnalysis, SignalInterpretation } from '../types/research';
type MarketData = ResearchResult['market'];
type ProjectData = Pick<ResearchResult['project'], 'description' | 'categories'> & {
    name?: string | null;
};
export declare function generateResearchBrief(market: MarketData, risk: RiskAnalysis, signalInterpretation: SignalInterpretation, project: ProjectData): ResearchBrief;
export {};
