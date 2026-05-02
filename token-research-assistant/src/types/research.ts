export type ResearchNote = {
  project: string;
  summary: string;
  useCase: string;
  risks: string;
  ecosystemNotes: string;
  matchedOn: string;
  aliases: string[];
  isFallback: boolean;
};

export type ResearchStatus = 'live' | 'fallback' | 'not_found' | 'error';

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type RiskSignal = {
  key: 'missing_market_data' | 'low_volume' | 'high_24h_move' | 'small_market_cap' | 'fdv_gap';
  label: string;
  value: string;
  impact: 'low' | 'medium' | 'high';
};

export type RiskAnalysis = {
  level: RiskLevel;
  score: number | null;
  summary: string;
  signals: RiskSignal[];
};

export type SignalTone = 'positive' | 'caution' | 'negative' | 'neutral';

export type InterpretedSignal = {
  key: 'liquidity' | 'volatility' | 'market_cap' | 'fdv_gap' | 'rank' | 'missing_data';
  label: string;
  detail: string;
  tone: SignalTone;
};

export type SignalInterpretation = {
  summary: string;
  tone: SignalTone;
  signals: InterpretedSignal[];
};

export interface ResearchBrief {
  headline: string;
  body: string;
}

export interface SectorIntelligence {
  profile: string;
  watchouts: string[];
}

export type Sector = 'Layer 1' | 'DeFi' | 'NFT / Gaming' | 'AI' | 'Infrastructure' | 'Meme' | 'Stablecoin' | 'Exchange' | 'Unknown';

export type ResearchResult = {
  identity: {
    id: string | null;
    name: string | null;
    symbol: string | null;
    slug: string | null;
    source: 'coingecko' | 'dexscreener' | 'local';
    confidence: 'high' | 'medium' | 'low';
  };
  market: {
    priceUsd: number | null;
    marketCapUsd: number | null;
    fullyDilutedValuationUsd: number | null;
    volume24hUsd: number | null;
    liquidityUsd: number | null;
    change24hPct: number | null;
    marketCapRank: number | null;
    lastUpdated: string | null;
  };
  risk: RiskAnalysis | null;
  signalInterpretation: SignalInterpretation | null;
  researchBrief: ResearchBrief | null;
  sector: Sector | null;
  sectorIntelligence: SectorIntelligence | null;
  project: {
    description: string | null;
    categories: string[];
    homepageUrl: string | null;
    blockchainSiteUrls: string[];
    officialTwitterHandle: string | null;
    officialTelegramHandle: string | null;
    sentimentVotesUpPct: number | null;
    sentimentVotesDownPct: number | null;
  };
  media: {
    thumbUrl: string | null;
    smallUrl: string | null;
    largeUrl: string | null;
  };
  links: {
    homepage: string[];
    blockchainSite: string[];
    officialForum: string[];
    chat: string[];
    announcement: string[];
    twitter: string[];
    telegram: string[];
    github: string[];
    subreddit: string[];
  };
  fallback: {
    used: boolean;
    reason: 'none' | 'live_lookup_failed' | 'not_listed' | 'rate_limited';
    localNoteId: string | null;
  };
  sourceMeta: {
    primarySource: 'coingecko' | 'dexscreener' | 'local';
    fetchedAt: string;
    liveAttempted: boolean;
    liveSucceeded: boolean;
  };
};

export type ResearchError = {
  code: 'BAD_REQUEST' | 'NOT_FOUND' | 'LIVE_LOOKUP_FAILED' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
  detail: string;
};

export type ResearchResponse = {
  status: ResearchStatus;
  query: {
    raw: string;
    normalized: string;
  };
  result: ResearchResult | null;
  message: string;
  error: ResearchError | null;
};

export type ResearchUiState =
  | { type: 'loading'; query: string }
  | { type: 'live_result'; data: ResearchResponse }
  | { type: 'fallback_result'; data: ResearchResponse }
  | { type: 'not_found'; query: string; message: string }
  | { type: 'error'; query: string; message: string };
