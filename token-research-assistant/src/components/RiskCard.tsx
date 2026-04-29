import type { ResearchResponse, RiskAnalysis } from '../types/research';

type RiskCardProps = {
  response: ResearchResponse;
};

function getRiskMeta(level: RiskAnalysis['level']) {
  switch (level) {
    case 'low':
      return { label: 'Low', colorClass: 'risk-meter-low' };
    case 'medium':
      return { label: 'Medium', colorClass: 'risk-meter-medium' };
    case 'high':
      return { label: 'High', colorClass: 'risk-meter-high' };
    default:
      return { label: 'Unknown', colorClass: 'risk-meter-unknown' };
  }
}

export function RiskCard({ response }: RiskCardProps) {
  const risk = response.result?.risk;
  if (!risk) return null;

  const normalizedScore = risk.score === null ? 0 : Math.max(0, Math.min(100, risk.score));
  const tenPointScore = risk.score === null ? '—' : (risk.score / 10).toFixed(1);
  const meta = getRiskMeta(risk.level);

  return (
    <section className="dashboard-card card">
      <div className="dashboard-card-header dashboard-card-header-inline">
        <p className="dashboard-card-kicker">Risk score</p>
        <span className={`dashboard-pill ${meta.colorClass}`}>{meta.label}</span>
      </div>

      <div className="risk-card-score-row">
        <div>
          <p className="risk-card-score">{tenPointScore}<span>/ 10</span></p>
          <p className="risk-card-summary">{risk.summary}</p>
        </div>
        <div className={`risk-card-ring ${meta.colorClass}`} style={{ ['--risk-progress' as string]: `${normalizedScore}%` }}>
          <span>{risk.score ?? '—'}</span>
        </div>
      </div>

      <div className="risk-card-bar-shell" aria-hidden="true">
        <div className={`risk-card-bar ${meta.colorClass}`} style={{ width: `${normalizedScore}%` }} />
      </div>
    </section>
  );
}
