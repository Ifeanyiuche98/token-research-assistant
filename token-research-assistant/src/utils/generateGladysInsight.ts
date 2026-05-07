import type { ResearchResponse, SignalTone, TrustRiskBand, TrustRiskLabel } from '../types/research';

export type GladysInsightInput = {
  token: {
    name: string | null;
    symbol: string | null;
    source: 'coingecko' | 'dexscreener' | 'local';
    confidence: 'high' | 'medium' | 'low';
  };
  risk: {
    level: 'low' | 'medium' | 'high' | 'unknown';
    band: 'lower' | 'elevated' | 'high' | 'unknown';
    score: number | null;
    summaryMode: string;
    dominantDriver: string | null;
    overrideReason: string | null;
    flags: string[];
    honeypot: boolean | null;
    trustLabel: TrustRiskLabel;
    trustScore: number | null;
    liquidityRisk: TrustRiskBand;
    volumeAnomaly: boolean | null;
    ageRisk: TrustRiskBand;
  };
  signalInterpretation: {
    tone: SignalTone;
    summary: string | null;
    topSignals: string[];
  };
  researchBrief: {
    headline: string | null;
    body: string | null;
  };
  sector: string | null;
  fallback: {
    used: boolean;
    reason: string;
  };
};

export type GladysInsight = {
  headline: string;
  summary: string;
  riskCall: string;
  confidenceNote: string;
  actionNote: string;
  tone: SignalTone;
  bullets: string[];
};

export function buildGladysInput(response: ResearchResponse): GladysInsightInput | null {
  const result = response.result;
  if (!result || !result.risk || !result.signalInterpretation) return null;

  return {
    token: {
      name: result.identity.name,
      symbol: result.identity.symbol,
      source: result.identity.source,
      confidence: result.identity.confidence
    },
    risk: {
      level: result.risk.level,
      band: result.risk.band,
      score: result.risk.score,
      summaryMode: result.risk.summaryMode,
      dominantDriver: result.risk.dominantDriver,
      overrideReason: result.risk.overrideReason,
      flags: result.risk.flags ?? [],
      honeypot: result.risk.details?.honeypot ?? null,
      trustLabel: result.risk.details?.trustLabel ?? null,
      trustScore: result.risk.details?.trustScore ?? null,
      liquidityRisk: result.risk.details?.liquidityRisk ?? null,
      volumeAnomaly: result.risk.details?.volumeAnomaly ?? null,
      ageRisk: result.risk.details?.ageRisk ?? null
    },
    signalInterpretation: {
      tone: result.signalInterpretation.tone,
      summary: result.signalInterpretation.summary,
      topSignals: result.signalInterpretation.signals.slice(0, 3).map((signal) => `${signal.label}: ${signal.detail}`)
    },
    researchBrief: {
      headline: result.researchBrief?.headline ?? null,
      body: result.researchBrief?.body ?? null
    },
    sector: result.sector,
    fallback: {
      used: result.fallback.used,
      reason: result.fallback.reason
    }
  };
}

function unique(items: Array<string | null | undefined>) {
  return [...new Set(items.filter((item): item is string => Boolean(item && item.trim())))];
}

function buildHeadline(input: GladysInsightInput) {
  if (input.risk.overrideReason === 'honeypot_exit_risk') return 'GLADYS: Exit risk looks severe';
  if (input.risk.level === 'high') return 'GLADYS: Too many weak points are stacking up';
  if (input.token.source === 'dexscreener' && input.risk.band === 'lower') return 'GLADYS: Calm on the surface, but trust is limited';
  if (input.risk.level === 'medium') return 'GLADYS: Not clean enough to treat casually';
  if (input.risk.level === 'low') return 'GLADYS: This looks broadly healthy';
  return 'GLADYS: Read this with limited confidence';
}

function buildSummary(input: GladysInsightInput) {
  const tokenName = input.token.name ?? 'This token';

  if (input.risk.overrideReason === 'honeypot_exit_risk') {
    return `${tokenName} should be treated as a serious danger case because available checks suggest selling or exiting may not work normally.`;
  }

  if (input.token.source === 'dexscreener' && input.risk.band === 'lower') {
    return `${tokenName} looks calm from the visible market data, but this is still a DEX-only read, so low visible risk should not be confused with strong verification.`;
  }

  if (input.risk.level === 'high') {
    return `${tokenName} currently looks fragile. Any positives here are being outweighed by the main caution signals.`;
  }

  if (input.risk.level === 'medium') {
    return `${tokenName} has some decent traits, but the setup still has enough weak spots that caution should lead.`;
  }

  if (input.risk.level === 'low') {
    return `${tokenName} looks stable right now, with no obvious stress point taking over the picture.`;
  }

  return `${tokenName} does not have enough clean market context for a stronger read, so this should be treated as a limited snapshot.`;
}

function buildRiskCall(input: GladysInsightInput) {
  if (input.risk.overrideReason === 'honeypot_exit_risk') return 'Biggest concern: exit risk dominates everything else.';
  if (input.risk.overrideReason === 'thin_liquidity_weak_visibility') return 'Biggest concern: thin liquidity and weak visibility make this hard to trust.';

  switch (input.risk.dominantDriver) {
    case 'liquidity':
      return 'Biggest concern: liquidity is not strong enough for comfort.';
    case 'volatility':
      return 'Biggest concern: short-term price action is still too unstable.';
    case 'fdv_gap':
      return 'Biggest concern: valuation stretch keeps dilution risk alive.';
    case 'scale':
      return 'Biggest concern: the token is still small enough to be easily shaken.';
    case 'trust':
      return 'Biggest concern: trust signals are weaker than the surface numbers suggest.';
    case 'honeypot':
      return 'Biggest concern: contract-level exit checks materially weaken trust.';
    default:
      return 'Biggest concern: this setup still needs a cautious read, even if parts of it look fine.';
  }
}

function buildConfidenceNote(input: GladysInsightInput) {
  if (input.token.source === 'coingecko' && !input.fallback.used) {
    return 'Confidence: relatively stronger, because this came through the primary verified research path.';
  }

  if (input.token.source === 'dexscreener') {
    return 'Confidence: limited, because this is being interpreted from a DEX-only / unverified source path.';
  }

  if (input.fallback.used || input.token.source === 'local') {
    return 'Confidence: limited, because this result is partly fallback-based rather than fully live.';
  }

  return 'Confidence: limited, so important details should still be verified manually.';
}

function buildActionNote(input: GladysInsightInput) {
  if (input.risk.overrideReason === 'honeypot_exit_risk') {
    return 'Next move: do not assume normal exits are possible. Verify sellability, taxes, and contract safety first.';
  }

  if (input.token.source === 'dexscreener' && input.risk.band === 'lower') {
    return 'Next move: verify the contract, liquidity depth, and real project links before treating this calm read as genuine safety.';
  }

  if (input.risk.level === 'high') {
    return 'Next move: re-check liquidity, trust flags, and recent behavior before trusting any upside story.';
  }

  if (input.risk.level === 'medium') {
    return 'Next move: watch the main weak points and see whether the better-looking signals actually hold up.';
  }

  return 'Next move: keep an eye on market conditions and re-check if the structure or source context changes.';
}

export function generateGladysInsight(input: GladysInsightInput): GladysInsight {
  const bullets = unique([
    input.token.source === 'dexscreener' ? 'DEX-only source path.' : null,
    input.risk.honeypot === true ? 'Honeypot warning surfaced.' : null,
    input.risk.liquidityRisk === 'high' ? 'Liquidity is very thin.' : null,
    input.risk.volumeAnomaly === true ? 'Volume looks unusually high relative to liquidity.' : null,
    input.risk.ageRisk === 'high' ? 'Market history is still very limited.' : null,
    input.risk.ageRisk === 'medium' ? 'Market history is still fairly short.' : null,
    input.risk.trustLabel === 'danger' ? 'Trust checks materially worsen the setup.' : null,
    input.risk.trustLabel === 'warning' ? 'Trust checks add meaningful caution.' : null
  ]).slice(0, 2);

  return {
    headline: buildHeadline(input),
    summary: buildSummary(input),
    riskCall: buildRiskCall(input),
    confidenceNote: buildConfidenceNote(input),
    actionNote: buildActionNote(input),
    tone: input.risk.overrideReason === 'honeypot_exit_risk' ? 'negative' : input.signalInterpretation.tone,
    bullets
  };
}
