import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGladysCompareInsight } from '../src/utils/generateGladysCompareInsight.js';

function makeResearchResponse({
  raw,
  name,
  symbol,
  source = 'coingecko',
  fallbackUsed = false,
  status = 'live',
  marketCapUsd = null,
  volume24hUsd = null,
  change24hPct = null,
  riskLevel = 'unknown',
  riskScore = null,
  trustLabel = null,
  overrideReason = null
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
        lastUpdated: '2026-05-09T02:30:00.000Z'
      },
      risk: {
        level: riskLevel,
        band: riskLevel === 'high' ? 'high' : riskLevel === 'medium' ? 'elevated' : riskLevel === 'low' ? 'lower' : 'unknown',
        summaryMode: 'unknown',
        dominantDriver: null,
        overrideReason,
        score: riskScore,
        summary: 'Risk summary',
        signals: [],
        flags: [],
        details: {
          honeypot: overrideReason === 'honeypot_exit_risk',
          buyTax: null,
          sellTax: null,
          liquidityRisk: null,
          volumeAnomaly: null,
          ageRisk: null,
          trustLabel,
          trustScore: null
        }
      },
      signalInterpretation: null,
      researchBrief: null,
      sector: 'Unknown',
      sectorIntelligence: null,
      project: {
        description: null,
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
        used: fallbackUsed,
        reason: fallbackUsed ? 'live_lookup_failed' : 'none',
        localNoteId: null
      },
      sourceMeta: {
        primarySource: source,
        fetchedAt: '2026-05-09T02:30:00.000Z',
        liveAttempted: true,
        liveSucceeded: !fallbackUsed
      }
    }
  };
}

function makeComparison({ left, right, items, summary = 'Comparison summary' }) {
  return {
    left,
    right,
    comparativeIntelligence: {
      summary,
      items
    },
    gladysInsight: null,
    meta: {
      generatedAt: '2026-05-09T02:30:00.000Z'
    }
  };
}

test('prefers cleaner risk posture over simple metric wins when the other side is severe risk', () => {
  const left = makeResearchResponse({
    raw: 'RiskyDex',
    name: 'RiskyDex',
    symbol: 'RDX',
    source: 'dexscreener',
    fallbackUsed: true,
    marketCapUsd: 500000000,
    volume24hUsd: 90000000,
    change24hPct: 4,
    riskLevel: 'high',
    riskScore: 8.8,
    trustLabel: 'danger',
    overrideReason: 'honeypot_exit_risk'
  });

  const right = makeResearchResponse({
    raw: 'SteadyChain',
    name: 'SteadyChain',
    symbol: 'SDY',
    marketCapUsd: 250000000,
    volume24hUsd: 30000000,
    change24hPct: 2,
    riskLevel: 'low',
    riskScore: 2.5,
    trustLabel: 'safe'
  });

  const comparison = makeComparison({
    left,
    right,
    items: [
      { key: 'liquidity', label: 'Liquidity', betterSide: 'left', summary: 'Left shows stronger liquidity based on higher 24h volume.' },
      { key: 'size', label: 'Size', betterSide: 'left', summary: 'Left is larger by market capitalization.' },
      { key: 'stability', label: 'Stability', betterSide: 'right', summary: 'Right looks more stable based on smaller 24h price movement.' }
    ],
    summary: 'Left leads on size and liquidity, but right looks more stable.'
  });

  const insight = generateGladysCompareInsight(comparison);
  assert.equal(insight.strongerSideLabel, 'SteadyChain');
  assert.equal(insight.weakerSideLabel, 'RiskyDex');
  assert.match(insight.headline, /SteadyChain looks structurally stronger/);
  assert.ok(insight.reasons.some((reason) => reason.includes('severe caution signal')));
});

test('falls back to tie language when edge is small and data quality is mixed', () => {
  const left = makeResearchResponse({
    raw: 'TokenAlpha',
    name: 'TokenAlpha',
    symbol: 'ALP',
    source: 'coingecko',
    marketCapUsd: 100000000,
    volume24hUsd: 12000000,
    change24hPct: 5,
    riskLevel: 'medium',
    riskScore: 4.9,
    trustLabel: 'warning'
  });

  const right = makeResearchResponse({
    raw: 'TokenBeta',
    name: 'TokenBeta',
    symbol: 'BET',
    source: 'dexscreener',
    fallbackUsed: true,
    marketCapUsd: 95000000,
    volume24hUsd: 11000000,
    change24hPct: 4.3,
    riskLevel: 'medium',
    riskScore: 4.6,
    trustLabel: 'warning'
  });

  const comparison = makeComparison({
    left,
    right,
    items: [
      { key: 'liquidity', label: 'Liquidity', betterSide: 'tie', summary: 'Both assets show similar liquidity based on current 24h volume.' },
      { key: 'size', label: 'Size', betterSide: 'tie', summary: 'Both assets are similar in size based on market capitalization.' },
      { key: 'stability', label: 'Stability', betterSide: 'right', summary: 'Right looks more stable based on smaller 24h price movement.' }
    ],
    summary: 'The two assets are mixed across liquidity, size, and recent stability.'
  });

  const insight = generateGladysCompareInsight(comparison);
  assert.equal(insight.strongerSideLabel, 'Neither side');
  assert.equal(insight.weakerSideLabel, 'neither asset');
  assert.match(insight.verdict, /trade-off/);
  assert.match(insight.confidenceNote, /limited to moderate|moderate/);
});

test('replaces raw side labels in reasons with token names', () => {
  const left = makeResearchResponse({
    raw: 'Bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    marketCapUsd: 2000000000000,
    volume24hUsd: 45000000000,
    change24hPct: 2.1,
    riskLevel: 'low',
    riskScore: 2.4,
    trustLabel: 'safe'
  });

  const right = makeResearchResponse({
    raw: 'Ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    marketCapUsd: 650000000000,
    volume24hUsd: 30000000000,
    change24hPct: 3.8,
    riskLevel: 'medium',
    riskScore: 4.8,
    trustLabel: 'safe'
  });

  const comparison = makeComparison({
    left,
    right,
    items: [
      { key: 'liquidity', label: 'Liquidity', betterSide: 'left', summary: 'Left shows stronger liquidity based on higher 24h volume.' },
      { key: 'size', label: 'Size', betterSide: 'left', summary: 'Left is larger by market capitalization.' },
      { key: 'stability', label: 'Stability', betterSide: 'left', summary: 'Left looks more stable based on smaller 24h price movement.' }
    ],
    summary: 'Left appears stronger on liquidity and size, while right looks more volatile in recent price movement.'
  });

  const insight = generateGladysCompareInsight(comparison);
  assert.equal(insight.strongerSideLabel, 'Bitcoin');
  assert.ok(insight.reasons.some((reason) => reason.includes('Bitcoin')));
  assert.ok(insight.reasons.every((reason) => !/\bLeft\b|\bRight\b/.test(reason)));
});
