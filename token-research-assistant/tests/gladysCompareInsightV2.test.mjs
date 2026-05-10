import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGladysV2Input } from '../src/utils/buildGladysV2Input.js';
import { validateGladysV2Insight } from '../src/utils/validateGladysV2Insight.js';

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
  riskSummary = 'Risk summary',
  trustLabel = null,
  overrideReason = null,
  researchBrief = null,
  sector = 'Unknown'
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
        lastUpdated: '2026-05-10T10:30:00.000Z'
      },
      risk: {
        level: riskLevel,
        band: riskLevel === 'high' ? 'high' : riskLevel === 'medium' ? 'elevated' : riskLevel === 'low' ? 'lower' : 'unknown',
        summaryMode: 'unknown',
        dominantDriver: null,
        overrideReason,
        score: riskScore,
        summary: riskSummary,
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
      researchBrief: researchBrief ? { headline: 'Brief', body: researchBrief } : null,
      sector,
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
        homepage: [], blockchainSite: [], officialForum: [], chat: [], announcement: [], twitter: [], telegram: [], github: [], subreddit: []
      },
      fallback: {
        used: fallbackUsed,
        reason: fallbackUsed ? 'live_lookup_failed' : 'none',
        localNoteId: null
      },
      sourceMeta: {
        primarySource: source,
        fetchedAt: '2026-05-10T10:30:00.000Z',
        liveAttempted: true,
        liveSucceeded: !fallbackUsed
      }
    }
  };
}

function makeComparison() {
  const left = makeResearchResponse({
    raw: 'Bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    marketCapUsd: 2000000000000,
    volume24hUsd: 45000000000,
    change24hPct: 2.1,
    riskLevel: 'low',
    riskScore: 2.4,
    trustLabel: 'safe',
    researchBrief: 'Bitcoin remains the larger and more liquid asset.',
    sector: 'Store of Value'
  });

  const right = makeResearchResponse({
    raw: 'Ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    marketCapUsd: 650000000000,
    volume24hUsd: 30000000000,
    change24hPct: 5.4,
    riskLevel: 'medium',
    riskScore: 4.8,
    trustLabel: 'warning',
    researchBrief: 'Ethereum remains competitive but with a weaker profile in this snapshot.',
    sector: 'Smart Contract Platform'
  });

  return {
    left,
    right,
    comparativeIntelligence: {
      summary: 'Bitcoin appears stronger on liquidity and size, while Ethereum looks more volatile in recent price movement.',
      items: [
        { key: 'liquidity', label: 'Liquidity', betterSide: 'left', summary: 'Bitcoin shows stronger liquidity based on higher 24h volume.' },
        { key: 'size', label: 'Size', betterSide: 'left', summary: 'Bitcoin is larger by market capitalization.' },
        { key: 'stability', label: 'Stability', betterSide: 'left', summary: 'Bitcoin looks more stable based on smaller 24h price movement.' }
      ]
    },
    gladysInsight: {
      headline: 'GLADYS: Bitcoin looks structurally stronger',
      verdict: 'Bitcoin currently looks stronger on balance, while Ethereum needs more caution unless its weaker signals improve.',
      caution: 'Bitcoin looks better on balance, but that still does not make it automatically safe or Ethereum automatically weak.',
      confidenceNote: 'Confidence: moderate, because both assets come through similarly reliable source paths.',
      strongerSideLabel: 'Bitcoin',
      weakerSideLabel: 'Ethereum',
      tone: 'positive',
      reasons: [
        'Bitcoin shows stronger liquidity based on higher 24h volume.',
        'Bitcoin is larger by market capitalization.'
      ]
    },
    gladysV2Insight: null,
    meta: {
      generatedAt: '2026-05-10T10:30:00.000Z'
    }
  };
}

test('buildGladysV2Input produces compact normalized comparison payload', () => {
  const comparison = makeComparison();
  const payload = buildGladysV2Input(comparison);

  assert.equal(payload.left.name, 'Bitcoin');
  assert.equal(payload.right.symbol, 'ETH');
  assert.equal(payload.left.fallbackUsed, false);
  assert.equal(payload.left.marketCapUsd, 2000000000000);
  assert.equal(payload.right.riskLevel, 'medium');
  assert.equal(payload.deterministicInsight?.strongerSideLabel, 'Bitcoin');
});

test('validateGladysV2Insight accepts grounded well-structured output', () => {
  const comparison = makeComparison();
  const candidate = {
    headline: 'Bitcoin looks like the cleaner overall choice',
    shortVerdict: 'Bitcoin has the stronger profile here, while Ethereum still reads as credible but less clean on this snapshot.',
    strongerSideLabel: 'Bitcoin',
    weakerSideLabel: 'Ethereum',
    decisiveTradeoff: 'Bitcoin pairs stronger liquidity and scale with the cleaner overall structure in this comparison.',
    watchout: 'That edge still does not make Bitcoin automatically safe, and market conditions can shift quickly.',
    dataConfidence: 'high',
    decisionConfidence: 'moderate',
    confidenceRationale: 'The source paths are solid, but Ethereum is still large enough to keep this from being treated as trivial.',
    priorityAngles: [
      { label: 'safer choice', recommendation: 'Bitcoin', reason: 'It carries the cleaner overall profile in this snapshot.' },
      { label: 'cleaner structure', recommendation: 'Bitcoin', reason: 'Its size, liquidity, and stability all line up on the same side.' }
    ],
    reasons: [
      'Bitcoin shows stronger liquidity based on higher 24h volume.',
      'Bitcoin is larger by market capitalization.'
    ],
    groundedInFallback: true
  };

  const result = validateGladysV2Insight(candidate, comparison);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.insight.version, 'v2');
    assert.equal(result.insight.status, 'ready');
  }
});

test('validateGladysV2Insight rejects severe contradictions and hype language', () => {
  const comparison = makeComparison();
  const candidate = {
    headline: 'Ethereum is guaranteed to moon',
    shortVerdict: 'Ethereum is the clear winner here.',
    strongerSideLabel: 'Ethereum',
    weakerSideLabel: 'Bitcoin',
    decisiveTradeoff: 'Ethereum has stronger liquidity and is larger in market size.',
    watchout: 'No real watchout here.',
    dataConfidence: 'high',
    decisionConfidence: 'high',
    confidenceRationale: 'Everything is obvious.',
    priorityAngles: [
      { label: 'higher upside', recommendation: 'Ethereum', reason: 'It is guaranteed to moon from here.' }
    ],
    reasons: ['Ethereum has stronger liquidity than Bitcoin.'],
    groundedInFallback: true
  };

  const result = validateGladysV2Insight(candidate, comparison);
  assert.equal(result.ok, false);
});
