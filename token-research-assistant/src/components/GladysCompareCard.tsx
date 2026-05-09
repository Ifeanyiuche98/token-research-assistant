import type { CompareResponse } from '../types/compare';

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

type GladysCompareCardProps = {
  comparison: CompareResponse;
};

export function GladysCompareCard({ comparison }: GladysCompareCardProps) {
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
