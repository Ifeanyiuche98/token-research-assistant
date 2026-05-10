import type { CompareResponse, GladysV2Insight } from '../types/compare';

function getToneMeta(tone: 'positive' | 'negative' | 'caution' | 'neutral') {
  switch (tone) {
    case 'positive':
      return { label: 'Constructive', className: 'tone-positive' };
    case 'negative':
      return { label: 'Strong caution', className: 'tone-negative' };
    case 'caution':
      return { label: 'Watchful', className: 'tone-caution' };
    default:
      return { label: 'Limited', className: 'tone-neutral' };
  }
}

function getConfidenceClass(level: GladysV2Insight['dataConfidence'] | GladysV2Insight['decisionConfidence']) {
  switch (level) {
    case 'high':
      return 'tone-positive';
    case 'moderate':
      return 'tone-caution';
    case 'limited':
    case 'low':
      return 'tone-neutral';
    default:
      return 'tone-neutral';
  }
}

type GladysCompareCardProps = {
  comparison: CompareResponse;
};

function GladysCompareCardV2({ insight }: { insight: GladysV2Insight }) {
  return (
    <section className="comparison-section">
      <section className="gladys-card card">
        <div className="dashboard-card-header dashboard-card-header-inline">
          <p className="dashboard-card-kicker">GLADYS v2 compare verdict</p>
          <span className="dashboard-pill tone-positive">AI interpretation</span>
        </div>

        <div className="gladys-grid">
          <div className="gladys-panel">
            <p className="gladys-label">Data confidence</p>
            <p className={`dashboard-card-copy ${getConfidenceClass(insight.dataConfidence)}`}>{insight.dataConfidence}</p>
          </div>
          <div className="gladys-panel">
            <p className="gladys-label">Decision confidence</p>
            <p className={`dashboard-card-copy ${getConfidenceClass(insight.decisionConfidence)}`}>{insight.decisionConfidence}</p>
          </div>
        </div>

        <h3 className="dashboard-headline">{insight.headline}</h3>
        <p className="dashboard-card-copy gladys-copy">{insight.shortVerdict}</p>

        <div className="gladys-grid">
          <div className="gladys-panel">
            <p className="gladys-label">Stronger side</p>
            <p className="dashboard-card-copy">{insight.strongerSideLabel}</p>
          </div>

          <div className="gladys-panel">
            <p className="gladys-label">Needs more caution</p>
            <p className="dashboard-card-copy">{insight.weakerSideLabel ?? '—'}</p>
          </div>
        </div>

        <div className="gladys-panel gladys-panel-action">
          <p className="gladys-label">Decisive trade-off</p>
          <p className="dashboard-card-copy">{insight.decisiveTradeoff}</p>
        </div>

        <div className="gladys-panel gladys-panel-action">
          <p className="gladys-label">Main watchout</p>
          <p className="dashboard-card-copy">{insight.watchout}</p>
        </div>

        <div className="gladys-panel gladys-panel-action">
          <p className="gladys-label">Confidence rationale</p>
          <p className="dashboard-card-copy">{insight.confidenceRationale}</p>
        </div>

        {insight.reasons.length > 0 ? (
          <ul className="dashboard-list gladys-list">
            {insight.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}

        {insight.priorityAngles.length > 0 ? (
          <div className="gladys-grid">
            {insight.priorityAngles.map((angle) => (
              <div key={`${angle.label}-${angle.recommendation}`} className="gladys-panel">
                <p className="gladys-label">{angle.label}</p>
                <p className="dashboard-card-copy">{angle.recommendation}</p>
                <p className="comparison-side-message comparison-side-message-tight">{angle.reason}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}

export function GladysCompareCard({ comparison }: GladysCompareCardProps) {
  const v2Insight = comparison.gladysV2Insight;
  if (v2Insight) {
    return <GladysCompareCardV2 insight={v2Insight} />;
  }

  const insight = comparison.gladysInsight;
  if (!insight) return null;

  const tone = getToneMeta(insight.tone);

  return (
    <section className="comparison-section">
      <section className="gladys-card card">
        <div className="dashboard-card-header dashboard-card-header-inline">
          <p className="dashboard-card-kicker">GLADYS compare verdict</p>
          <span className={`dashboard-pill ${tone.className}`}>{tone.label}</span>
        </div>

        <h3 className="dashboard-headline">{insight.headline}</h3>
        <p className="dashboard-card-copy gladys-copy">{insight.verdict}</p>

        <div className="gladys-grid">
          <div className="gladys-panel">
            <p className="gladys-label">Stronger side</p>
            <p className="dashboard-card-copy">{insight.strongerSideLabel}</p>
          </div>

          <div className="gladys-panel">
            <p className="gladys-label">Needs more caution</p>
            <p className="dashboard-card-copy">{insight.weakerSideLabel}</p>
          </div>
        </div>

        <div className="gladys-panel gladys-panel-action">
          <p className="gladys-label">Confidence</p>
          <p className="dashboard-card-copy">{insight.confidenceNote}</p>
        </div>

        <div className="gladys-panel gladys-panel-action">
          <p className="gladys-label">Main caution</p>
          <p className="dashboard-card-copy">{insight.caution}</p>
        </div>

        {insight.reasons.length > 0 ? (
          <ul className="dashboard-list gladys-list">
            {insight.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  );
}
