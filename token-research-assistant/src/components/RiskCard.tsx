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
  const trustLabel = risk.details?.trustLabel ?? null;
  if (trustLabel === 'safe' || trustLabel === 'warning' || trustLabel === 'danger') {
    return trustLabel;
  }

  switch (risk.level) {
    case 'low':
      return 'safe';
    case 'medium':
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
    normalized.includes('trade tax') ||
    normalized.includes('market cap unavailable')
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

function getHumanRiskSummary(tone: VisualRiskTone, isDexSource: boolean) {
  switch (tone) {
    case 'danger':
      return 'High structural risk signals detected. Use extreme caution and verify contract conditions independently.';
    case 'warning':
      return 'Moderate risk signals are present. Review liquidity, trading behavior, and contract history before acting.';
    case 'safe':
      return isDexSource
        ? 'No major structural contract red flags were surfaced from available checks, but market conditions still require independent verification.'
        : 'No major structural red flags were surfaced from available data, but independent verification is still important.';
    default:
      return 'Risk visibility is limited for this asset. Treat the result as incomplete and verify manually.';
  }
}

function getTrustDriverLine(risk: RiskAnalysis, tone: VisualRiskTone) {
  if (!risk.details || risk.details.trustLabel === null || risk.details.trustLabel === undefined) {
    return null;
  }

  if (tone === 'danger') {
    return 'Primary driver: elevated trust-layer risk from liquidity depth, trading behavior, and contract maturity.';
  }

  if (tone === 'warning') {
    return 'Primary driver: trust-layer contract risk signals rather than broad market valuation metrics.';
  }

  if (tone === 'safe') {
    return 'Primary driver: available trust-layer checks did not surface major structural contract warnings.';
  }

  return 'Primary driver: trust-layer visibility is partial, so this view should be treated cautiously.';
}

function shouldHideBackendSummary(summary: string | null | undefined) {
  if (!summary) return true;

  const normalized = summary.trim().toLowerCase();
  return [
    'higher market risk based on current liquidity, size, valuation gap, or short-term price movement.',
    'moderate market risk based on current liquidity, size, valuation gap, or short-term price movement.',
    'lower market risk based on current liquidity, size, valuation gap, and recent price movement.'
  ].includes(normalized);
}

function getRiskPostureFallbackCopy(tone: VisualRiskTone) {
  if (tone === 'danger') {
    return 'Risk posture is being driven by aggregated trust and market conditions, even where explicit flag labels are limited.';
  }

  if (tone === 'warning') {
    return 'Risk posture is being driven primarily by interpreted market or trust signals rather than explicit flag strings.';
  }

  return 'No explicit risk flags were surfaced from the current dataset.';
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
  const humanSummary = getHumanRiskSummary(visualTone, showDexBanner);
  const trustDriverLine = getTrustDriverLine(risk, visualTone);
  const showLimitedVerificationBanner = !showDexBanner && fallbackUsed;
  const backendSummary = shouldHideBackendSummary(risk.summary) || showDexBanner ? null : risk.summary;
  const riskPostureFallbackCopy = getRiskPostureFallbackCopy(visualTone);

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
          {backendSummary ? <p className="risk-card-summary risk-card-summary-upgraded">{backendSummary}</p> : null}
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
        <p className="dashboard-muted-copy risk-card-empty-copy">{riskPostureFallbackCopy}</p>
      )}

      <div className="risk-details-shell">
        <button
          type="button"
          className="risk-details-toggle"
          onClick={() => setShowDetails((current) => !current)}
          aria-expanded={showDetails}
        >
          <span>{showDetails ? '▼ Hide risk breakdown' : '▶ View risk breakdown'}</span>
          <span className="risk-details-toggle-meta">{detailCount} populated fields</span>
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
