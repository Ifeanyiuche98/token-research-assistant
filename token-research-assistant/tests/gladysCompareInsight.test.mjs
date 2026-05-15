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
  assert.match(insight.headline, /SteadyChain looks safer on this setup/);
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
  assert.match(insight.verdict, /weaker data path keeps this from becoming a clean winner-versus-loser call|trade-off/);
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

test('uses sharper safer-language when a severe-risk side loses', () => {
  const left = makeResearchResponse({
    raw: 'SafeChain',
    name: 'SafeChain',
    symbol: 'SAFE',
    marketCapUsd: 300000000,
    volume24hUsd: 28000000,
    change24hPct: 1.6,
    riskLevel: 'low',
    riskScore: 2.1,
    trustLabel: 'safe'
  });

  const right = makeResearchResponse({
    raw: 'TrapToken',
    name: 'TrapToken',
    symbol: 'TRAP',
    source: 'dexscreener',
    fallbackUsed: true,
    marketCapUsd: 650000000,
    volume24hUsd: 45000000,
    change24hPct: 8.2,
    riskLevel: 'high',
    riskScore: 8.9,
    trustLabel: 'danger',
    overrideReason: 'honeypot_exit_risk'
  });

  const comparison = makeComparison({
    left,
    right,
    items: [
      { key: 'liquidity', label: 'Liquidity', betterSide: 'right', summary: 'Right shows stronger liquidity based on higher 24h volume.' },
      { key: 'size', label: 'Size', betterSide: 'right', summary: 'Right is larger by market capitalization.' },
      { key: 'stability', label: 'Stability', betterSide: 'left', summary: 'Left looks more stable based on smaller 24h price movement.' }
    ],
    summary: 'Right leads on headline size and liquidity, but left looks steadier.'
  });

  const insight = generateGladysCompareInsight(comparison);
  assert.match(insight.headline, /looks safer on this setup/);
  assert.match(insight.verdict, /safer side/);
  assert.match(insight.confidenceNote, /cleaner safety profile|opposite side is more fallback-heavy/);
});

test('uses cleaner risk posture wording when one live asset wins a close call', () => {
  const left = makeResearchResponse({
    raw: 'TokenNorth',
    name: 'TokenNorth',
    symbol: 'NOR',
    marketCapUsd: 220000000,
    volume24hUsd: 26000000,
    change24hPct: 4.2,
    riskLevel: 'low',
    riskScore: 3.1,
    trustLabel: 'safe'
  });

  const right = makeResearchResponse({
    raw: 'TokenSouth',
    name: 'TokenSouth',
    symbol: 'SOU',
    marketCapUsd: 230000000,
    volume24hUsd: 25500000,
    change24hPct: 4.1,
    riskLevel: 'medium',
    riskScore: 4.1,
    trustLabel: 'warning'
  });

  const comparison = makeComparison({
    left,
    right,
    items: [
      { key: 'liquidity', label: 'Liquidity', betterSide: 'left', summary: 'Left shows slightly stronger liquidity based on current 24h volume.' },
      { key: 'size', label: 'Size', betterSide: 'right', summary: 'Right is slightly larger by market capitalization.' },
      { key: 'stability', label: 'Stability', betterSide: 'tie', summary: 'Both assets look similar in recent price stability.' }
    ],
    summary: 'The two assets remain close, with only small differences across the visible metrics.'
  });

  const insight = generateGladysCompareInsight(comparison);
  assert.equal(insight.strongerSideLabel, 'TokenNorth');
  assert.match(insight.headline, /TokenNorth looks structurally stronger/);
  assert.match(insight.verdict, /visible metrics and risk posture are lining up on the same side|looks stronger on balance/);
  assert.match(insight.confidenceNote, /TokenNorth still keeps the cleaner visible setup|similarly reliable source paths/);
});

test('explains fallback-heavy ties as data-quality problems instead of simple trade-offs', () => {
  const left = makeResearchResponse({
    raw: 'TokenMist',
    name: 'TokenMist',
    symbol: 'MIST',
    source: 'dexscreener',
    fallbackUsed: true,
    status: 'fallback',
    riskLevel: 'unknown',
    riskScore: null,
    trustLabel: null
  });

  const right = makeResearchResponse({
    raw: 'TokenFog',
    name: 'TokenFog',
    symbol: 'FOG',
    source: 'dexscreener',
    fallbackUsed: true,
    status: 'fallback',
    riskLevel: 'unknown',
    riskScore: null,
    trustLabel: null
  });

  const comparison = makeComparison({
    left,
    right,
    items: [
      { key: 'liquidity', label: 'Liquidity', betterSide: 'unknown', summary: 'Liquidity cannot be compared reliably from the current dataset.' },
      { key: 'size', label: 'Size', betterSide: 'unknown', summary: 'Size cannot be compared reliably from the current dataset.' },
      { key: 'stability', label: 'Stability', betterSide: 'unknown', summary: 'Stability cannot be compared reliably from the current dataset.' }
    ],
    summary: 'Comparison insight is limited because one or both assets are missing important market data.'
  });

  const insight = generateGladysCompareInsight(comparison);
  assert.match(insight.verdict, /caution-first read/);
  assert.match(insight.caution, /data is too uneven/);
  assert.ok(insight.reasons.some((reason) => reason.includes('fallback-heavy or incomplete market data')));
});

test('distinguishes credible large-cap losers from weaker setups', () => {
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
      { key: 'stability', label: 'Stability', betterSide: 'tie', summary: 'Both assets show similar short-term price stability.' }
    ],
    summary: 'Bitcoin still looks like the stronger large-cap setup with a much larger market footprint and noticeably deeper trading activity, while recent price stability still looks broadly similar.'
  });

  const insight = generateGladysCompareInsight(comparison);
  assert.match(insight.headline, /stronger large-cap setup/);
  assert.match(insight.verdict, /stronger large-cap choice/);
  assert.match(insight.confidenceNote, /credible large-cap names/);
  assert.ok(insight.reasons.some((reason) => reason.includes('still looks credible')));
});

test('distinguishes higher-beta losers from credible large-cap losers', () => {
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
    raw: 'Solana',
    name: 'Solana',
    symbol: 'SOL',
    marketCapUsd: 80000000000,
    volume24hUsd: 12000000000,
    change24hPct: 6.4,
    riskLevel: 'medium',
    riskScore: 5.2,
    trustLabel: 'warning'
  });

  const comparison = makeComparison({
    left,
    right,
    items: [
      { key: 'liquidity', label: 'Liquidity', betterSide: 'left', summary: 'Left shows stronger liquidity based on higher 24h volume.' },
      { key: 'size', label: 'Size', betterSide: 'left', summary: 'Left is larger by market capitalization.' },
      { key: 'stability', label: 'Stability', betterSide: 'tie', summary: 'Both assets show similar short-term price stability.' }
    ],
    summary: 'Bitcoin still looks like the stronger large-cap setup with a much larger market footprint and noticeably deeper trading activity, while recent price stability still looks broadly similar.'
  });

  const insight = generateGladysCompareInsight(comparison);
  assert.match(insight.headline, /stronger large-cap setup/);
  assert.match(insight.verdict, /steadier structural choice/);
  assert.match(insight.confidenceNote, /more aggressive profile/);
  assert.ok(insight.reasons.some((reason) => reason.includes('faster-moving profile')));
});
