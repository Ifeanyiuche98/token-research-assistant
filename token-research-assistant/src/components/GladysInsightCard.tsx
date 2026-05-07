import type { ResearchResponse, SignalTone } from '../types/research';
import { buildGladysInput, generateGladysInsight } from '../utils/generateGladysInsight';

type GladysInsightCardProps = {
  response: ResearchResponse;
};

function getToneMeta(tone: SignalTone) {
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

export function GladysInsightCard({ response }: GladysInsightCardProps) {
  const input = buildGladysInput(response);
  if (!input) return null;

  const insight = generateGladysInsight(input);
  const tone = getToneMeta(insight.tone);

  return (
    <section className="dashboard-card card dashboard-card-span-full gladys-card">
      <div className="dashboard-card-header dashboard-card-header-inline">
        <p className="dashboard-card-kicker">GLADYS insight</p>
        <span className={`dashboard-pill ${tone.className}`}>{tone.label}</span>
      </div>

      <h3 className="dashboard-headline">{insight.headline}</h3>
      <p className="dashboard-card-copy gladys-copy">{insight.summary}</p>

      <div className="gladys-grid">
        <div className="gladys-panel">
          <p className="gladys-label">Biggest concern</p>
          <p className="dashboard-card-copy">{insight.riskCall}</p>
        </div>

        <div className="gladys-panel">
          <p className="gladys-label">Confidence</p>
          <p className="dashboard-card-copy">{insight.confidenceNote}</p>
        </div>
      </div>

      <div className="gladys-panel gladys-panel-action">
        <p className="gladys-label">Next move</p>
        <p className="dashboard-card-copy">{insight.actionNote}</p>
      </div>

      {insight.bullets.length > 0 ? (
        <ul className="dashboard-list gladys-list">
          {insight.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
