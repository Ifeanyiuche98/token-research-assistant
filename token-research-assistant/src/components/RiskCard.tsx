import { useState } from 'react';
import type { ResearchResponse, RiskAnalysis, TrustRiskBand } from '../types/research';

type RiskCardProps = {
  response: ResearchResponse;
};

type VisualRiskTone = 'safe' | 'warning' | 'danger' | 'unknown';

type DetailRow = {
  label: string;
  value: string;
  tone?: 'neutral' | 'safe' | 'warning' | 'danger';
};

function getVisualRiskTone(risk: RiskAnalysis): VisualRiskTone {
  switch (risk.band) {
    case 'lower':
      return 'safe';
    case 'elevated':
      return 'warning';
    case 'high':
      return 'danger';
    default:
      return 'unknown';
  }
}

function getRiskMeta(tone: VisualRiskTone) {
  switch (tone) {
    case 'safe':
      return { label: 'LOWER RISK', badge: '🟢 Lower risk', className: 'risk-visual-safe' };
    case 'warning':
      return { label: 'ELEVATED RISK', badge: '🟡 Elevated risk', className: 'risk-visual-warning' };
    case 'danger':
      return { label: 'HIGH RISK', badge: '🔴 High risk', className: 'risk-visual-danger' };
    default:
      return { label: 'UNKNOWN', badge: '⚪ Unknown', className: 'risk-visual-unknown' };
  }
}

function getBandTone(band: TrustRiskBand): DetailRow['tone'] {
  if (band === 'low') return 'safe';
  if (band === 'medium') return 'warning';
  if (band === 'high') return 'danger';
  return 'neutral';
}

function formatBooleanValue(value: boolean | null | undefined) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unknown';
}

function formatTaxValue(value: number | null | undefined) {
  return value === null || value === undefined ? 'Unknown' : `${value.toFixed(2)}%`;
}

function formatBandValue(value: TrustRiskBand) {
  if (value === null) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getFlagTone(flag: string): DetailRow['tone'] {
  const normalized = flag.toLowerCase();

  if (normalized.includes('honeypot') || normalized.includes('high volatility') || normalized.includes('low liquidity')) {
    return 'danger';
  }

  if (
    normalized.includes('unusual trading') ||
    normalized.includes('new contract') ||
    normalized.includes('young contract') ||
    normalized.includes('unverified') ||
    normalized.includes('trade tax')
  ) {
    return 'warning';
  }

  return 'neutral';
}

function buildDetails(risk: RiskAnalysis): DetailRow[] {
  return [
    {
      label: 'Honeypot',
      value: formatBooleanValue(risk.details?.honeypot),
      tone: risk.details?.honeypot === true ? 'danger' : risk.details?.honeypot === false ? 'safe' : 'neutral'
    },
    {
      label: 'Buy Tax',
      value: formatTaxValue(risk.details?.buyTax),
      tone: 'neutral'
    },
    {
      label: 'Sell Tax',
      value: formatTaxValue(risk.details?.sellTax),
      tone: 'neutral'
    },
    {
      label: 'Liquidity Risk',
      value: formatBandValue(risk.details?.liquidityRisk ?? null),
      tone: getBandTone(risk.details?.liquidityRisk ?? null)
    },
    {
      label: 'Volume Anomaly',
      value: formatBooleanValue(risk.details?.volumeAnomaly),
      tone: risk.details?.volumeAnomaly === true ? 'warning' : risk.details?.volumeAnomaly === false ? 'safe' : 'neutral'
    },
    {
      label: 'Contract Age Risk',
      value: formatBandValue(risk.details?.ageRisk ?? null),
      tone: getBandTone(risk.details?.ageRisk ?? null)
    }
  ];
}

function getHumanRiskSummary(risk: RiskAnalysis, isDexSource: boolean) {
  if (risk.overrideReason === 'honeypot_exit_risk') {
    return 'Available checks suggest users may face serious selling or transfer restrictions, making this a high-risk setup.';
  }

  if (risk.overrideReason === 'thin_liquidity_weak_visibility') {
    return 'Thin liquidity, very small scale, and limited verification make this setup difficult to trust.';
  }

  switch (risk.summaryMode) {
    case 'stable':
      return isDexSource
        ? 'No major contract-level warnings were surfaced here, though independent verification still matters.'
        : 'The current read looks broadly stable, with no obvious structural stress dominating the setup.';
    case 'stable_watchful':
      return 'The setup still looks mostly constructive, but a few caution signals keep it from reading as fully clean.';
    case 'mixed_cautious':
      return 'Some supportive signals are present, but the weaker areas are meaningful enough to keep caution in control.';
    case 'high_risk_fragile':
      return 'The broader profile looks risk-heavy, with warning signals strong enough to dominate the current read.';
    default:
      return 'Risk visibility is limited for this asset. Treat the result as incomplete and verify manually.';
  }
}

function getDriverLine(risk: RiskAnalysis) {
  if (risk.overrideReason === 'honeypot_exit_risk') {
    return 'Primary driver: severe exit-risk warning from contract checks.';
  }

  if (risk.overrideReason === 'thin_liquidity_weak_visibility') {
    return 'Primary driver: thin liquidity combined with weak trust visibility.';
  }

  switch (risk.dominantDriver) {
    case 'liquidity':
      return 'Primary driver: liquidity quality is not strong enough to make the setup feel fully reliable.';
    case 'volatility':
      return 'Primary driver: short-term price behavior is active enough to raise reversal and confidence risk.';
    case 'fdv_gap':
      return 'Primary driver: valuation stretch keeps dilution risk in focus.';
    case 'scale':
      return 'Primary driver: smaller scale leaves the setup more exposed to sentiment shifts.';
    case 'trust':
      return 'Primary driver: trust-layer checks add uncertainty beyond the cleaner market metrics.';
    case 'honeypot':
      return 'Primary driver: contract-level exit risk dominates the read.';
    default:
      return null;
  }
}

function getRiskPostureFallbackCopy(risk: RiskAnalysis) {
  if (risk.summaryMode === 'high_risk_fragile') {
    return 'No direct contract-level flag chips were surfaced here, but the broader setup still reads as structurally fragile.';
  }

  if (risk.summaryMode === 'mixed_cautious' || risk.summaryMode === 'stable_watchful') {
    return 'No direct contract-level warning flags were surfaced here, but softer market or trust signals still warrant caution.';
  }

  return 'No direct contract-level warning flags were surfaced from the current dataset.';
}

function getHiddenRiskDrivers(risk: RiskAnalysis) {
  const drivers: string[] = [];

  if (risk.details?.honeypot === true) drivers.push('exit-risk concerns');
  if (risk.details?.liquidityRisk === 'high') drivers.push('very thin liquidity');
  else if (risk.details?.liquidityRisk === 'medium') drivers.push('light liquidity');
  if (risk.details?.volumeAnomaly === true) drivers.push('unusual trading activity');
  if (risk.details?.ageRisk === 'high') drivers.push('very limited market history');
  else if (risk.details?.ageRisk === 'medium') drivers.push('short market history');

  return drivers;
}

function getNoFlagExplainer(tone: VisualRiskTone, risk: RiskAnalysis) {
  const drivers = getHiddenRiskDrivers(risk);
  if (drivers.length === 0 || tone === 'safe' || tone === 'unknown') {
    return null;
  }

  const lead = tone === 'danger' ? 'Why this can still read as high risk:' : 'Why this can still read as elevated risk:';
  return `${lead} ${drivers.join(', ')}.`;
}

export function RiskCard({ response }: RiskCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const risk = response.result?.risk;
  const source = response.result?.identity.source;
  const fallbackUsed = response.result?.fallback.used ?? false;

  if (!risk) {
    return (
      <section className="dashboard-card card" aria-live="polite">
        <div className="dashboard-card-header dashboard-card-header-inline">
          <p className="dashboard-card-kicker">Risk intelligence</p>
          <span className="dashboard-pill risk-visual-unknown">Unavailable</span>
        </div>
        <div className="risk-card-empty-state">
          <p className="risk-card-empty-title">Risk data unavailable</p>
          <p className="dashboard-muted-copy">This result does not currently include enough risk context to render the intelligence panel.</p>
        </div>
      </section>
    );
  }

  const visualTone = getVisualRiskTone(risk);
  const meta = getRiskMeta(visualTone);
  const score = risk.score === null ? null : Math.max(0, Math.min(10, risk.score));
  const normalizedScore = score === null ? 0 : (score / 10) * 100;
  const scoreLabel = score === null ? '—' : score.toFixed(1);
  const flags = (risk.flags ?? []).filter((flag) => !flag.toLowerCase().includes('not financial advice') && !flag.toLowerCase().includes('confirm contract authenticity'));
  const details = buildDetails(risk);
  const detailCount = details.filter((detail) => detail.value !== 'Unknown').length;
  const showDexBanner = source === 'dexscreener';
  const humanSummary = getHumanRiskSummary(risk, showDexBanner);
  const trustDriverLine = getDriverLine(risk);
  const showLimitedVerificationBanner = !showDexBanner && fallbackUsed;
  const riskPostureFallbackCopy = getRiskPostureFallbackCopy(risk);
  const noFlagExplainer = flags.length === 0 ? getNoFlagExplainer(visualTone, risk) : null;

  return (
    <section className={`dashboard-card card risk-card-shell ${meta.className}`} aria-live="polite">
      {showDexBanner ? (
        <div className="risk-source-banner risk-source-banner-dex">⚠ Unverified DEX token — contract authenticity should be confirmed manually.</div>
      ) : null}
      {showLimitedVerificationBanner ? (
        <div className="risk-source-banner risk-source-banner-fallback">⚠ Limited verification context — some live source validation was unavailable for this result.</div>
      ) : null}

      <div className="dashboard-card-header dashboard-card-header-inline">
        <p className="dashboard-card-kicker">Risk intelligence</p>
        <span className={`dashboard-pill risk-card-badge ${meta.className}`}>{meta.badge}</span>
      </div>

      <div className="risk-card-score-row risk-card-score-row-upgraded">
        <div className="risk-card-score-copy">
          <p className="risk-card-score-label">Overall risk score</p>
          <p className="risk-card-score risk-card-score-upgraded">{scoreLabel}<span>/ 10</span></p>
          <p className="risk-card-human-summary">{humanSummary}</p>
          {trustDriverLine ? <p className="risk-card-driver-line">{trustDriverLine}</p> : null}
          <p className="risk-card-summary risk-card-summary-upgraded">{risk.summary}</p>
        </div>

        <div
          className={`risk-card-ring risk-card-ring-upgraded ${meta.className}`}
          style={{ ['--risk-progress' as string]: `${normalizedScore}%` }}
          role="img"
          aria-label={`Risk score ${scoreLabel} out of 10, ${meta.label}`}
        >
          <span>{meta.label}</span>
        </div>
      </div>

      <div className="risk-card-bar-shell" aria-hidden="true">
        <div className={`risk-card-bar ${meta.className}`} style={{ width: `${normalizedScore}%` }} />
      </div>

      {flags.length > 0 ? (
        <div className="risk-flag-list" aria-label="Risk flags">
          {flags.map((flag) => {
            const tone = getFlagTone(flag);
            return (
              <div key={flag} className={`risk-flag-chip risk-flag-${tone}`}>
                <span className="risk-flag-dot" aria-hidden="true" />
                <span>{flag}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="risk-card-no-flags-shell">
          <p className="dashboard-muted-copy risk-card-empty-copy">{riskPostureFallbackCopy}</p>
          {noFlagExplainer ? <p className="risk-card-no-flags-explainer">{noFlagExplainer}</p> : null}
        </div>
      )}

      <div className="risk-details-shell">
        <button
          type="button"
          className="risk-details-toggle"
          onClick={() => setShowDetails((current) => !current)}
          aria-expanded={showDetails}
        >
          <span>{showDetails ? '▼ Hide risk breakdown' : '▶ View risk breakdown'}</span>
          <span className="risk-details-toggle-meta">{detailCount} trust checks available</span>
        </button>

        {showDetails ? (
          <div className="risk-details-grid">
            {details.map((detail) => (
              <div key={detail.label} className="risk-detail-card">
                <p className="risk-detail-label">{detail.label}</p>
                <p className={`risk-detail-value risk-detail-${detail.tone ?? 'neutral'}`}>{detail.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="risk-disclaimer-stack">
        <p className="risk-disclaimer">⚠ Risk signals are heuristic — not financial advice</p>
        {source === 'dexscreener' ? <p className="risk-disclaimer">⚠ Unverified token — always confirm contract authenticity</p> : null}
      </div>
    </section>
  );
}
