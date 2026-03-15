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

export type ResearchResult = {
  identity: {
    id: string | null;
    name: string | null;
    symbol: string | null;
    slug: string | null;
    source: 'coingecko' | 'local';
    confidence: 'high' | 'medium' | 'low';
  };
  market: {
    priceUsd: number | null;
    marketCapUsd: number | null;
    fullyDilutedValuationUsd: number | null;
    volume24hUsd: number | null;
    change24hPct: number | null;
    marketCapRank: number | null;
    lastUpdated: string | null;
  };
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
    primarySource: 'coingecko' | 'local';
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
