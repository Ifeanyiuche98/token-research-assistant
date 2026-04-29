import type { ResearchResponse } from '../types/research';

type StrengthsRisksCardProps = {
  response: ResearchResponse;
};

export function StrengthsRisksCard({ response }: StrengthsRisksCardProps) {
  const result = response.result;
  if (!result) return null;

  const strengths = result.signalInterpretation?.signals.filter((signal) => signal.tone === 'positive').map((signal) => signal.detail) ?? [];
  const cautions = [
    ...(result.signalInterpretation?.signals.filter((signal) => signal.tone === 'negative' || signal.tone === 'caution').map((signal) => signal.detail) ?? []),
    ...(result.risk?.signals.map((signal) => `${signal.label}: ${signal.value}`) ?? []),
    ...(result.sectorIntelligence?.watchouts ?? [])
  ];

  return (
    <section className="dashboard-card card dashboard-card-span-full">
      <div className="dashboard-card-header">
        <p className="dashboard-card-kicker">Strengths & risks</p>
      </div>

      <div className="strengths-risks-grid">
        <div className="strengths-panel">
          <h3>Strengths</h3>
          {strengths.length > 0 ? (
            <ul className="dashboard-list dashboard-list-positive">
              {strengths.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-muted-copy">No clear positive indicators were highlighted in the current signal set.</p>
          )}
        </div>

        <div className="risks-panel">
          <h3>Risks</h3>
          {cautions.length > 0 ? (
            <ul className="dashboard-list dashboard-list-negative">
              {cautions.slice(0, 5).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-muted-copy">No material risk flags were surfaced from the currently available fields.</p>
          )}
        </div>
      </div>
    </section>
  );
}
