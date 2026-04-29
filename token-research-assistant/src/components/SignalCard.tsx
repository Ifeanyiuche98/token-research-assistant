import type { ResearchResponse, SignalTone } from '../types/research';

type SignalCardProps = {
  response: ResearchResponse;
};

function getToneMeta(tone: SignalTone) {
  switch (tone) {
    case 'positive':
      return { label: 'Positive', className: 'tone-positive' };
    case 'negative':
      return { label: 'Negative', className: 'tone-negative' };
    case 'caution':
      return { label: 'Caution', className: 'tone-caution' };
    default:
      return { label: 'Neutral', className: 'tone-neutral' };
  }
}

export function SignalCard({ response }: SignalCardProps) {
  const signalInterpretation = response.result?.signalInterpretation;
  if (!signalInterpretation) return null;

  const tone = getToneMeta(signalInterpretation.tone);

  return (
    <section className="dashboard-card card">
      <div className="dashboard-card-header dashboard-card-header-inline">
        <p className="dashboard-card-kicker">Signal interpretation</p>
        <span className={`dashboard-pill ${tone.className}`}>{tone.label}</span>
      </div>

      <p className="dashboard-card-copy">{signalInterpretation.summary}</p>

      <ul className="dashboard-list">
        {signalInterpretation.signals.slice(0, 4).map((signal) => (
          <li key={`${signal.key}-${signal.detail}`}>
            <strong>{signal.label}:</strong> {signal.detail}
          </li>
        ))}
      </ul>
    </section>
  );
}
