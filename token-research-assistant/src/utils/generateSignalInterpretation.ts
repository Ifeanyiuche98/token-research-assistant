import type { InterpretedSignal, ResearchResult, RiskAnalysis, RiskSummaryMode, SignalInterpretation, SignalTone } from '../types/research';

type MarketData = ResearchResult['market'];

function createSignal(key: InterpretedSignal['key'], label: string, detail: string, tone: SignalTone): InterpretedSignal {
  return { key, label, detail, tone };
}

function formatCompactUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

function buildSummary(mode: RiskSummaryMode, risk: RiskAnalysis) {
  switch (mode) {
    case 'stable':
      return 'The market setup looks broadly stable, with healthy scale and no obvious structural stress in the current read.';
    case 'stable_watchful':
      return 'The setup remains broadly constructive, though a few caution signals suggest it should be watched rather than treated as fully clean.';
    case 'mixed_cautious':
      if (risk.dominantDriver === 'trust') {
        return 'Some indicators look constructive, but trust and verification concerns still keep the broader setup leaning cautious.';
      }
      return 'Some indicators look constructive, but the broader setup still leans cautious because the weaker areas are too meaningful to ignore.';
    case 'high_risk_fragile':
      if (risk.overrideReason === 'honeypot_exit_risk') {
        return 'This token shows signs of severe exit risk, which makes the setup difficult to trust regardless of any short-term positives.';
      }
      if (risk.overrideReason === 'thin_liquidity_weak_visibility') {
        return 'The token’s weak liquidity, very small scale, and limited trust visibility create a fragile setup that deserves strong caution.';
      }
      return 'Available signals point to a fragile setup where structural risk dominates, so caution should outweigh any short-term positives.';
    default:
      return 'Signal interpretation is limited because the live market data is incomplete.';
  }
}

function toneFromMode(mode: RiskSummaryMode): SignalTone {
  if (mode === 'stable') return 'positive';
  if (mode === 'stable_watchful' || mode === 'mixed_cautious') return 'caution';
  if (mode === 'high_risk_fragile') return 'negative';
  return 'neutral';
}

export function generateSignalInterpretation(market: MarketData, risk: RiskAnalysis): SignalInterpretation {
  const signals: InterpretedSignal[] = [];
  const missingCoreFields = [market.marketCapUsd, market.volume24hUsd, market.change24hPct].filter((value) => value === null).length;

  if (missingCoreFields > 0) {
    signals.push(
      createSignal(
        'missing_data',
        'Incomplete market data',
        `${missingCoreFields} core live field${missingCoreFields === 1 ? '' : 's'} missing, so interpretation is limited.`,
        'neutral'
      )
    );
  }

  if (market.volume24hUsd !== null) {
    if (market.volume24hUsd < 1_000_000) {
      signals.push(createSignal('liquidity', 'Liquidity signal', `Liquidity looks thin, with only about $${formatCompactUsd(market.volume24hUsd)} in 24h volume.`, 'negative'));
    } else if (market.volume24hUsd < 10_000_000) {
      signals.push(createSignal('liquidity', 'Liquidity signal', `Liquidity is present but still modest at about $${formatCompactUsd(market.volume24hUsd)} in 24h volume.`, 'caution'));
    } else {
      signals.push(createSignal('liquidity', 'Liquidity signal', `Trading activity looks healthy, with about $${formatCompactUsd(market.volume24hUsd)} in 24h volume.`, 'positive'));
    }
  }

  if (market.change24hPct !== null) {
    const absoluteMove = Math.abs(market.change24hPct);
    if (absoluteMove >= 20) {
      signals.push(createSignal('volatility', 'Volatility signal', `Short-term price behavior is highly unstable after a ${formatPercent(market.change24hPct)} move in 24h.`, 'negative'));
    } else if (absoluteMove >= 10) {
      signals.push(createSignal('volatility', 'Volatility signal', `Recent price action is active enough to deserve caution after a ${formatPercent(market.change24hPct)} 24h move.`, 'caution'));
    } else {
      signals.push(createSignal('volatility', 'Volatility signal', `Recent price action looks relatively contained, with a ${formatPercent(market.change24hPct)} move in 24h.`, 'positive'));
    }
  }

  if (market.marketCapUsd !== null) {
    if (market.marketCapUsd < 100_000_000) {
      signals.push(createSignal('market_cap', 'Market-cap signal', `The project is still small at roughly $${formatCompactUsd(market.marketCapUsd)} in market cap, which can make it more fragile.`, 'negative'));
    } else if (market.marketCapUsd < 1_000_000_000) {
      signals.push(createSignal('market_cap', 'Market-cap signal', `The project sits in a mid-sized range at roughly $${formatCompactUsd(market.marketCapUsd)} in market cap.`, 'caution'));
    } else {
      signals.push(createSignal('market_cap', 'Market-cap signal', `Scale looks supportive, with market cap around $${formatCompactUsd(market.marketCapUsd)}.`, 'positive'));
    }
  }

  if (market.marketCapUsd !== null && market.marketCapUsd > 0 && market.fullyDilutedValuationUsd !== null) {
    const fdvGap = market.fullyDilutedValuationUsd / market.marketCapUsd;
    if (fdvGap >= 5) {
      signals.push(createSignal('fdv_gap', 'FDV-gap signal', `The valuation gap looks wide at about ${fdvGap.toFixed(1)}x market cap, which raises dilution risk.`, 'negative'));
    } else if (fdvGap >= 2) {
      signals.push(createSignal('fdv_gap', 'FDV-gap signal', `FDV is about ${fdvGap.toFixed(1)}x market cap, so dilution still deserves monitoring.`, 'caution'));
    } else {
      signals.push(createSignal('fdv_gap', 'FDV-gap signal', `FDV stays close to market cap at about ${fdvGap.toFixed(1)}x, which is a healthier alignment.`, 'positive'));
    }
  }

  if (market.marketCapRank !== null) {
    if (market.marketCapRank > 300) {
      signals.push(createSignal('rank', 'Rank signal', `Market-cap rank sits deeper in the market at #${market.marketCapRank}, which adds fragility.`, 'negative'));
    } else if (market.marketCapRank > 100) {
      signals.push(createSignal('rank', 'Rank signal', `Market-cap rank is #${market.marketCapRank}, which suggests a mid-market position.`, 'caution'));
    } else {
      signals.push(createSignal('rank', 'Rank signal', `Market-cap rank is #${market.marketCapRank}, keeping the asset near the top of the market.`, 'positive'));
    }
  }

  return {
    summary: buildSummary(risk.summaryMode, risk),
    tone: toneFromMode(risk.summaryMode),
    signals
  };
}
