import { calculateRiskAnalysis } from '../src/utils/calculateRiskAnalysis.js';
import { generateSignalInterpretation } from '../src/utils/generateSignalInterpretation.js';

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

const researchProfiles = [
  {
    project: 'Bitcoin',
    aliases: ['bitcoin', 'btc'],
    summary:
      'Bitcoin is the oldest major cryptocurrency and is primarily positioned as a scarce digital asset and decentralized settlement network.',
    useCase:
      'Most commonly used as a store of value, treasury asset, long-term portfolio holding, and base-layer payment rail for simple value transfer.',
    risks:
      'Price volatility, regulation, self-custody mistakes, energy-policy criticism, and macro sentiment can all affect adoption and confidence.',
    ecosystemNotes:
      'Bitcoin has the deepest liquidity in crypto, strong institutional recognition, and a mature ecosystem of wallets, exchanges, custody providers, and infrastructure tools.'
  },
  {
    project: 'Ethereum',
    aliases: ['ethereum', 'eth'],
    summary:
      'Ethereum is a general-purpose blockchain for smart contracts and decentralized applications, making it one of the core platforms in crypto.',
    useCase:
      'Used for DeFi, stablecoins, NFTs, token launches, DAOs, on-chain identity experiments, and broader programmable blockchain activity.',
    risks:
      'Smart contract exploits, network fees during busy periods, shifting regulation, and competition from faster or cheaper chains remain relevant risks.',
    ecosystemNotes:
      'Ethereum has one of the largest developer communities, broad wallet and tooling support, and an active Layer 2 ecosystem that expands scalability.'
  },
  {
    project: 'Solana',
    aliases: ['solana', 'sol'],
    summary:
      'Solana is a high-throughput blockchain designed for fast transactions and lower fees, with a focus on consumer-scale crypto applications.',
    useCase:
      'Often used for payments, DeFi, NFTs, memecoin trading, consumer apps, and experiences that benefit from lower transaction costs.',
    risks:
      'Network stability concerns, ecosystem concentration, speculative activity, and execution risk around decentralization are common discussion points.',
    ecosystemNotes:
      'Solana has a fast-moving builder community, strong retail mindshare, active wallet adoption, and a growing ecosystem of trading and consumer products.'
  },
  {
    project: 'Chainlink',
    aliases: ['chainlink', 'link'],
    summary:
      'Chainlink is a decentralized oracle network focused on bringing off-chain data, computation, and interoperability into blockchain applications.',
    useCase:
      'Used to power price feeds, automation, cross-chain messaging, and external data delivery for DeFi protocols and other smart contract systems.',
    risks:
      'Adoption can depend on protocol integrations, token value capture can be debated, and competition in oracle or interoperability infrastructure remains a factor.',
    ecosystemNotes:
      'Chainlink is deeply integrated across DeFi and is widely recognized as core middleware for many blockchain-based applications.'
  },
  {
    project: 'Uniswap',
    aliases: ['uniswap', 'uni'],
    summary:
      'Uniswap is a decentralized exchange protocol best known for automated market making and permissionless token trading on-chain.',
    useCase:
      'Used for spot token swaps, liquidity provision, price discovery, and serving as trading infrastructure for other crypto applications.',
    risks:
      'Liquidity can move quickly, governance outcomes may affect direction, regulation of token trading venues may matter, and competitors can pressure market share.',
    ecosystemNotes:
      'Uniswap is one of the most recognized DeFi brands and has helped define the user experience for on-chain token trading across Ethereum-related ecosystems.'
  }
];

function json(res, statusCode, body) {
  res.status(statusCode);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.json(body);
}

function normalizeQuery(value) {
  return String(value ?? '').trim().toLowerCase();
}

function validateQuery(value) {
  const raw = String(value ?? '');
  const trimmed = raw.trim();
  const normalized = normalizeQuery(raw);

  if (!trimmed) {
    return {
      ok: false,
      raw,
      normalized,
      message: 'Please enter a token or project name before researching.',
      detail: `The q parameter must be a non-empty string between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`
    };
  }

  if (trimmed.length < MIN_QUERY_LENGTH || trimmed.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      raw,
      normalized,
      message: `Please enter between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`,
      detail: `The q parameter must be a non-empty string between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`
    };
  }

  return {
    ok: true,
    raw: trimmed,
    normalized
  };
}

function slugify(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function findProfile(query) {
  const normalized = normalizeQuery(query);
  return researchProfiles.find(
    (profile) => profile.project.toLowerCase() === normalized || profile.aliases.some((alias) => alias === normalized)
  );
}

function buildUnknownRisk() {
  return {
    level: 'unknown',
    score: null,
    summary: 'Market risk is unavailable because live market data could not be loaded for this result.',
    signals: [
      {
        key: 'missing_market_data',
        label: 'Live market data',
        value: 'Unavailable in fallback mode',
        impact: 'medium'
      }
    ]
  };
}

function buildNeutralSignalInterpretation() {
  return {
    summary: 'Signal interpretation is limited because live market data is unavailable for this result.',
    tone: 'neutral',
    signals: [
      {
        key: 'missing_data',
        label: 'Incomplete market data',
        detail: 'Live market fields are unavailable in fallback mode, so only limited interpretation is possible.',
        tone: 'neutral'
      }
    ]
  };
}

function ensureRiskOnResponse(response) {
  if (!response?.result) {
    return response;
  }

  if (response.result.risk) {
    return response;
  }

  const market = response.result.market;
  const hasAnyMarketData = Boolean(
    market &&
      [market.priceUsd, market.marketCapUsd, market.fullyDilutedValuationUsd, market.volume24hUsd, market.change24hPct, market.marketCapRank, market.lastUpdated].some(
        (value) => value !== null
      )
  );

  response.result.risk = hasAnyMarketData ? calculateRiskAnalysis(market) : buildUnknownRisk();
  return response;
}

function ensureSignalInterpretationOnResponse(response) {
  if (!response?.result) {
    return response;
  }

  if (response.result.signalInterpretation) {
    return response;
  }

  const market = response.result.market;
  const risk = response.result.risk ?? buildUnknownRisk();
  const hasAnyMarketData = Boolean(
    market &&
      [market.priceUsd, market.marketCapUsd, market.fullyDilutedValuationUsd, market.volume24hUsd, market.change24hPct, market.marketCapRank, market.lastUpdated].some(
        (value) => value !== null
      )
  );

  response.result.signalInterpretation = hasAnyMarketData ? generateSignalInterpretation(market, risk) : buildNeutralSignalInterpretation();
  return response;
}

function buildFallbackResearchResponse(query, reason = 'not_listed', message = 'Live data unavailable. Showing local fallback research.') {
  const profile = findProfile(query.raw);
  const note =
    profile ??
    {
      project: query.raw,
      aliases: [],
      summary: `${query.raw} is not in the built-in research set yet, so this note should be treated as a cautious starting point rather than a confident profile.`,
      useCase:
        'The first thing to confirm is what the project actually does: product utility, target users, token role, and whether the token is essential to the system.',
      risks:
        'Unknown projects can carry elevated risk from thin liquidity, weak documentation, unclear tokenomics, low security maturity, and hype-driven narratives.',
      ecosystemNotes:
        'Before trusting the project, review the official site, docs, social channels, exchange presence, on-chain activity, and whether developers or users appear genuinely active.'
    };

  return {
    status: 'fallback',
    query,
    result: {
      identity: {
        id: `local-${slugify(note.project)}`,
        name: note.project,
        symbol: profile?.aliases?.[1]?.toUpperCase?.() ?? null,
        slug: slugify(note.project),
        source: 'local',
        confidence: profile ? 'high' : 'medium'
      },
      market: {
        priceUsd: null,
        marketCapUsd: null,
        fullyDilutedValuationUsd: null,
        volume24hUsd: null,
        change24hPct: null,
        marketCapRank: null,
        lastUpdated: null
      },
      risk: buildUnknownRisk(),
      signalInterpretation: buildNeutralSignalInterpretation(),
      project: {
        description: note.summary,
        categories: [],
        homepageUrl: null,
        blockchainSiteUrls: [],
        officialTwitterHandle: null,
        officialTelegramHandle: null,
        sentimentVotesUpPct: null,
        sentimentVotesDownPct: null
      },
      media: {
        thumbUrl: null,
        smallUrl: null,
        largeUrl: null
      },
      links: {
        homepage: [],
        blockchainSite: [],
        officialForum: [],
        chat: [],
        announcement: [],
        twitter: [],
        telegram: [],
        github: [],
        subreddit: []
      },
      fallback: {
        used: true,
        reason,
        localNoteId: slugify(note.project)
      },
      sourceMeta: {
        primarySource: 'local',
        fetchedAt: new Date().toISOString(),
        liveAttempted: true,
        liveSucceeded: false
      }
    },
    message,
    error: null
  };
}

function cleanText(value) {
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

function cleanUrlList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter((value) => /^https?:\/\//i.test(value)))];
}

function buildSocialUrl(prefix, handle) {
  const cleaned = String(handle ?? '').trim();
  return cleaned ? [`${prefix}${cleaned}`] : [];
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    const error = new Error(`CoinGecko request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function buildLiveResearchResponse(query, coin) {
  const homepage = cleanUrlList(coin?.links?.homepage);
  const blockchainSite = cleanUrlList(coin?.links?.blockchain_site);
  const officialForum = cleanUrlList(coin?.links?.official_forum_url);
  const chat = cleanUrlList(coin?.links?.chat_url);
  const announcement = cleanUrlList(coin?.links?.announcement_url);
  const github = cleanUrlList(coin?.links?.repos_url?.github);
  const subreddit = coin?.links?.subreddit_url ? cleanUrlList([coin.links.subreddit_url]) : [];
  const twitter = buildSocialUrl('https://twitter.com/', coin?.links?.twitter_screen_name);
  const telegram = buildSocialUrl('https://t.me/', coin?.links?.telegram_channel_identifier);
  const market = {
    priceUsd: coin?.market_data?.current_price?.usd ?? null,
    marketCapUsd: coin?.market_data?.market_cap?.usd ?? null,
    fullyDilutedValuationUsd: coin?.market_data?.fully_diluted_valuation?.usd ?? null,
    volume24hUsd: coin?.market_data?.total_volume?.usd ?? null,
    change24hPct: coin?.market_data?.price_change_percentage_24h ?? null,
    marketCapRank: coin?.market_cap_rank ?? null,
    lastUpdated: coin?.last_updated ?? null
  };

  const risk = calculateRiskAnalysis(market);
  const signalInterpretation = generateSignalInterpretation(market, risk);

  return {
    status: 'live',
    query,
    result: {
      identity: {
        id: coin?.id ?? null,
        name: coin?.name ?? null,
        symbol: coin?.symbol ? String(coin.symbol).toUpperCase() : null,
        slug: coin?.id ?? null,
        source: 'coingecko',
        confidence: 'high'
      },
      market,
      risk,
      signalInterpretation,
      project: {
        description: cleanText(coin?.description?.en),
        categories: Array.isArray(coin?.categories) ? coin.categories : [],
        homepageUrl: homepage[0] ?? null,
        blockchainSiteUrls: blockchainSite,
        officialTwitterHandle: String(coin?.links?.twitter_screen_name ?? '').trim() || null,
        officialTelegramHandle: String(coin?.links?.telegram_channel_identifier ?? '').trim() || null,
        sentimentVotesUpPct: coin?.sentiment_votes_up_percentage ?? null,
        sentimentVotesDownPct: coin?.sentiment_votes_down_percentage ?? null
      },
      media: {
        thumbUrl: coin?.image?.thumb ?? null,
        smallUrl: coin?.image?.small ?? null,
        largeUrl: coin?.image?.large ?? null
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
    },
    message: 'Live research data retrieved successfully.',
    error: null
  };
}

async function getCoinGeckoResearchResponse(query) {
  const searchUrl = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query.raw)}`;
  const searchData = await fetchJson(searchUrl);
  const coins = Array.isArray(searchData?.coins) ? searchData.coins : [];
  const exactMatch = coins.find((coin) => {
    const id = String(coin?.id ?? '').toLowerCase();
    const name = String(coin?.name ?? '').toLowerCase();
    const symbol = String(coin?.symbol ?? '').toLowerCase();
    return id === query.normalized || name === query.normalized || symbol === query.normalized;
  });
  const selectedCoin = exactMatch ?? coins[0];

  if (!selectedCoin?.id) {
    return null;
  }

  const detailUrl = `${COINGECKO_BASE_URL}/coins/${encodeURIComponent(selectedCoin.id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
  const detailData = await fetchJson(detailUrl);
  return buildLiveResearchResponse(query, detailData);
}

async function resolveResearch(queryValue) {
  const validation = validateQuery(queryValue);

  if (!validation.ok) {
    return {
      statusCode: 400,
      body: {
        status: 'error',
        query: {
          raw: validation.raw,
          normalized: validation.normalized
        },
        result: null,
        message: validation.message,
        error: {
          code: 'BAD_REQUEST',
          detail: validation.detail
        }
      }
    };
  }

  const query = {
    raw: validation.raw,
    normalized: validation.normalized
  };

  try {
    const liveResponse = await getCoinGeckoResearchResponse(query);
    if (liveResponse) {
      return { statusCode: 200, body: liveResponse };
    }

    return {
      statusCode: 200,
      body: buildFallbackResearchResponse(query)
    };
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? error.status : undefined;
    return {
      statusCode: 200,
      body: buildFallbackResearchResponse(
        query,
        status === 429 ? 'rate_limited' : 'live_lookup_failed',
        status === 429 ? 'CoinGecko rate limit reached. Showing local fallback research.' : 'Live data unavailable. Showing local fallback research.'
      )
    };
  }
}

export default async function handler(req, res) {
  try {
    const queryValue = typeof req.query?.q === 'string' ? req.query.q : '';
    const { statusCode, body } = await resolveResearch(queryValue);
    return json(res, statusCode, ensureSignalInterpretationOnResponse(ensureRiskOnResponse(body)));
  } catch (error) {
    return json(res, 500, {
      status: 'error',
      query: {
        raw: typeof req?.query?.q === 'string' ? req.query.q : '',
        normalized: normalizeQuery(typeof req?.query?.q === 'string' ? req.query.q : '')
      },
      result: null,
      message: 'Unable to fetch research right now.',
      error: {
        code: 'INTERNAL_ERROR',
        detail: error instanceof Error ? error.message : 'Unexpected server error.'
      }
    });
  }
}
