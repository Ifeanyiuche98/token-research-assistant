import type { ResearchResponse, ResearchResult } from '../../types/research';
import { calculateRiskAnalysis } from '../../utils/calculateRiskAnalysis';
import { generateSignalInterpretation } from '../../utils/generateSignalInterpretation';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

type CoinGeckoSearchResponse = {
  coins?: Array<{
    id: string;
    name: string;
    symbol: string;
  }>;
};

type CoinGeckoCoinResponse = {
  id?: string;
  name?: string;
  symbol?: string;
  categories?: string[];
  description?: { en?: string };
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    official_forum_url?: string[];
    chat_url?: string[];
    announcement_url?: string[];
    repos_url?: {
      github?: string[];
    };
    subreddit_url?: string;
    twitter_screen_name?: string;
    telegram_channel_identifier?: string;
  };
  market_data?: {
    current_price?: { usd?: number };
    market_cap?: { usd?: number };
    fully_diluted_valuation?: { usd?: number };
    total_volume?: { usd?: number };
    price_change_percentage_24h?: number;
  };
  market_cap_rank?: number;
  last_updated?: string;
  sentiment_votes_up_percentage?: number;
  sentiment_votes_down_percentage?: number;
};

function cleanText(value: string | undefined): string | null {
  if (!value) return null;
  const stripped = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) return null;

  return stripped.length > 360 ? `${stripped.slice(0, 357).trim()}...` : stripped;
}

function cleanUrlList(values: Array<string | undefined> | undefined): string[] {
  if (!values) return [];

  const unique = new Set<string>();

  for (const value of values) {
    const next = value?.trim();
    if (next && /^https?:\/\//i.test(next)) {
      unique.add(next);
    }
  }

  return [...unique];
}

function buildSocialUrl(prefix: string, handle: string | undefined): string[] {
  const cleaned = handle?.trim();
  if (!cleaned) return [];
  return [`${prefix}${cleaned}`];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    const error = new Error(`CoinGecko request failed with status ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as T;
}

function buildLiveResponse(query: { raw: string; normalized: string }, coin: CoinGeckoCoinResponse): ResearchResponse {
  const homepage = cleanUrlList(coin.links?.homepage);
  const blockchainSite = cleanUrlList(coin.links?.blockchain_site);
  const officialForum = cleanUrlList(coin.links?.official_forum_url);
  const chat = cleanUrlList(coin.links?.chat_url);
  const announcement = cleanUrlList(coin.links?.announcement_url);
  const github = cleanUrlList(coin.links?.repos_url?.github);
  const subreddit = coin.links?.subreddit_url ? cleanUrlList([coin.links.subreddit_url]) : [];
  const twitter = buildSocialUrl('https://twitter.com/', coin.links?.twitter_screen_name);
  const telegram = buildSocialUrl('https://t.me/', coin.links?.telegram_channel_identifier);

  const market = {
    priceUsd: coin.market_data?.current_price?.usd ?? null,
    marketCapUsd: coin.market_data?.market_cap?.usd ?? null,
    fullyDilutedValuationUsd: coin.market_data?.fully_diluted_valuation?.usd ?? null,
    volume24hUsd: coin.market_data?.total_volume?.usd ?? null,
    change24hPct: coin.market_data?.price_change_percentage_24h ?? null,
    marketCapRank: coin.market_cap_rank ?? null,
    lastUpdated: coin.last_updated ?? null
  };

  const risk = calculateRiskAnalysis(market);
  const signalInterpretation = generateSignalInterpretation(market, risk);

  const result: ResearchResult = {
    identity: {
      id: coin.id ?? null,
      name: coin.name ?? null,
      symbol: coin.symbol ? coin.symbol.toUpperCase() : null,
      slug: coin.id ?? null,
      source: 'coingecko',
      confidence: 'high'
    },
    market,
    risk,
    signalInterpretation,
    project: {
      description: cleanText(coin.description?.en),
      categories: coin.categories ?? [],
      homepageUrl: homepage[0] ?? null,
      blockchainSiteUrls: blockchainSite,
      officialTwitterHandle: coin.links?.twitter_screen_name?.trim() || null,
      officialTelegramHandle: coin.links?.telegram_channel_identifier?.trim() || null,
      sentimentVotesUpPct: coin.sentiment_votes_up_percentage ?? null,
      sentimentVotesDownPct: coin.sentiment_votes_down_percentage ?? null
    },
    media: {
      thumbUrl: coin.image?.thumb ?? null,
      smallUrl: coin.image?.small ?? null,
      largeUrl: coin.image?.large ?? null
    },
    links: {
      homepage,
      blockchainSite,
      officialForum,
      chat,
      announcement,
      twitter,
      telegram,
      github,
      subreddit
    },
    fallback: {
      used: false,
      reason: 'none',
      localNoteId: null
    },
    sourceMeta: {
      primarySource: 'coingecko',
      fetchedAt: new Date().toISOString(),
      liveAttempted: true,
      liveSucceeded: true
    }
  };

  return {
    status: 'live',
    query,
    result,
    message: 'Live research data retrieved successfully.',
    error: null
  };
}

export async function getCoinGeckoResearchResponse(query: { raw: string; normalized: string }): Promise<ResearchResponse | null> {
  const searchUrl = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query.raw)}`;
  const searchData = await fetchJson<CoinGeckoSearchResponse>(searchUrl);
  const exactMatch = searchData.coins?.find(
    (coin) => coin.id.toLowerCase() === query.normalized || coin.name.toLowerCase() === query.normalized || coin.symbol.toLowerCase() === query.normalized
  );
  const selectedCoin = exactMatch ?? searchData.coins?.[0];

  if (!selectedCoin?.id) {
    return null;
  }

  const detailUrl = `${COINGECKO_BASE_URL}/coins/${encodeURIComponent(selectedCoin.id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
  const detailData = await fetchJson<CoinGeckoCoinResponse>(detailUrl);

  return buildLiveResponse(query, detailData);
}
