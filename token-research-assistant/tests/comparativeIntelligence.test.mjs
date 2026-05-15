import test from 'node:test';
import assert from 'node:assert/strict';
import { generateComparativeIntelligence } from '../src/utils/generateComparativeIntelligence.js';

function makeResearchResponse({
  raw,
  name,
  symbol,
  source = 'coingecko',
  fallbackUsed = false,
  status = 'live',
  marketCapUsd = null,
  volume24hUsd = null,
  change24hPct = null
}) {
  return {
    status,
    query: {
      raw,
      normalized: raw.toLowerCase()
    },
    message: 'ok',
    error: null,
    result: {
      identity: {
        id: raw.toLowerCase(),
        name,
        symbol,
        slug: raw.toLowerCase(),
        source,
        confidence: source === 'coingecko' ? 'high' : 'low'
      },
      market: {
        priceUsd: null,
        marketCapUsd,
        fullyDilutedValuationUsd: marketCapUsd,
        volume24hUsd,
        liquidityUsd: null,
        change24hPct,
        marketCapRank: null,
        lastUpdated: '2026-05-10T08:30:00.000Z'
      },
      risk: null,
      signalInterpretation: null,
      researchBrief: null,
      sector: 'Unknown',
      sectorIntelligence: null,
      project: null,
      media: null,
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
        used: fallbackUsed,
        reason: fallbackUsed ? 'live_lookup_failed' : 'none',
        localNoteId: null
      },
      sourceMeta: {
        primarySource: source,
        fetchedAt: '2026-05-10T08:30:00.000Z',
        liveAttempted: true,
        liveSucceeded: !fallbackUsed
      }
    }
  };
}

test('uses token names instead of left and right labels in per-card summaries and top summary', () => {
  const left = makeResearchResponse({
    raw: 'Bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    marketCapUsd: 2000000000000,
    volume24hUsd: 45000000000,
    change24hPct: 2.1
  });

  const right = makeResearchResponse({
    raw: 'Ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    marketCapUsd: 650000000000,
    volume24hUsd: 30000000000,
    change24hPct: 5.4
  });

  const intelligence = generateComparativeIntelligence(left, right);

  assert.match(intelligence.summary, /Bitcoin/);
  assert.doesNotMatch(intelligence.summary, /\bLeft\b|\bRight\b/);
  assert.equal(intelligence.items[0].summary, 'Bitcoin shows stronger liquidity based on higher 24h volume.');
  assert.equal(intelligence.items[1].summary, 'Bitcoin is larger by market capitalization.');
  assert.equal(intelligence.items[2].summary, 'Bitcoin looks more stable based on smaller 24h price movement.');
  assert.ok(intelligence.items.every((item) => !/\bLeft\b|\bRight\b/.test(item.summary)));
});

test('uses the present token name when the opposite side is fallback or missing', () => {
  const left = makeResearchResponse({
    raw: 'SteadyChain',
    name: 'SteadyChain',
    symbol: 'SDY',
    marketCapUsd: 250000000,
    volume24hUsd: 30000000,
    change24hPct: 2
  });

  const right = makeResearchResponse({
    raw: 'UnknownDex',
    name: 'UnknownDex',
    symbol: 'UDX',
    source: 'dexscreener',
    fallbackUsed: true,
    marketCapUsd: null,
    volume24hUsd: null,
    change24hPct: null
  });

  const intelligence = generateComparativeIntelligence(left, right);

  assert.equal(intelligence.items[0].summary, 'SteadyChain shows stronger liquidity based on higher 24h volume.');
  assert.equal(intelligence.items[1].summary, 'SteadyChain is larger by market capitalization.');
  assert.equal(intelligence.items[2].summary, 'SteadyChain looks more stable based on smaller 24h price movement.');
  assert.ok(intelligence.items.every((item) => !/\bLeft\b|\bRight\b/.test(item.summary)));
});

test('uses more differentiated winner summaries for strong live-vs-live pairs', () => {
  const bitcoin = makeResearchResponse({
    raw: 'Bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    marketCapUsd: 2000000000000,
    volume24hUsd: 45000000000,
    change24hPct: 2.1
  });

  const ethereum = makeResearchResponse({
    raw: 'Ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    marketCapUsd: 650000000000,
    volume24hUsd: 30000000000,
    change24hPct: 5.4
  });

  const intelligence = generateComparativeIntelligence(bitcoin, ethereum);
  assert.match(intelligence.summary, /stronger large-cap setup/);
  assert.match(intelligence.summary, /larger market footprint/);
  assert.match(intelligence.summary, /Ethereum looks steadier|recent price stability still looks broadly similar|Bitcoin also looks steadier/);
});

test('uses mixed-summary wording when liquidity and size point in different directions', () => {
  const left = makeResearchResponse({
    raw: 'FastToken',
    name: 'FastToken',
    symbol: 'FAST',
    marketCapUsd: 400000000,
    volume24hUsd: 90000000,
    change24hPct: 6.1
  });

  const right = makeResearchResponse({
    raw: 'BigToken',
    name: 'BigToken',
    symbol: 'BIG',
    marketCapUsd: 900000000,
    volume24hUsd: 50000000,
    change24hPct: 3.2
  });

  const intelligence = generateComparativeIntelligence(left, right);
  assert.match(intelligence.summary, /looks more liquid right now/);
  assert.match(intelligence.summary, /larger market footprint/);
  assert.match(intelligence.summary, /real trade-off/);
});
