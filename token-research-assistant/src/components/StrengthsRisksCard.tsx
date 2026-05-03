import type { InterpretedSignal, ResearchResponse } from '../types/research';

type StrengthsRisksCardProps = {
  response: ResearchResponse;
};

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function isMarketActivityPositive(signal: InterpretedSignal) {
  const normalized = `${signal.label} ${signal.detail}`.toLowerCase();
  return normalized.includes('volume') || normalized.includes('activity') || normalized.includes('momentum') || normalized.includes('liquidity');
}

function buildMixedSignalSummary(response: ResearchResponse, strengths: string[], risks: string[]) {
  const trustLabel = response.result?.risk?.details?.trustLabel ?? null;
  const liquidityRisk = response.result?.risk?.details?.liquidityRisk ?? null;
  const volumeAnomaly = response.result?.risk?.details?.volumeAnomaly ?? null;

  if (strengths.length === 0 || risks.length === 0) {
    return null;
  }

  if (trustLabel === 'danger') {
    return '⚠ Mixed signals: some activity looks constructive, but structural contract risk remains elevated.';
  }

  if (liquidityRisk === 'high' || volumeAnomaly === true) {
    return '⚠ Mixed signals: market activity is present, but elevated volatility and liquidity concerns outweigh simple momentum positives.';
  }

  return '⚠ Mixed signals: some positive indicators are present, but the broader risk picture still warrants caution.';
}

export function StrengthsRisksCard({ response }: StrengthsRisksCardProps) {
  const result = response.result;
  if (!result) return null;

  const trustLabel = result.risk?.details?.trustLabel ?? null;
  const liquidityRisk = result.risk?.details?.liquidityRisk ?? null;
  const volumeAnomaly = result.risk?.details?.volumeAnomaly ?? null;

  const positiveSignals = result.signalInterpretation?.signals.filter((signal) => signal.tone === 'positive') ?? [];
  const positiveDetails = positiveSignals.map((signal) => signal.detail);
  const suppressMarketActivityPositives = trustLabel === 'danger' || liquidityRisk === 'high' || volumeAnomaly === true;

  const strengths = unique(
    positiveSignals
      .filter((signal) => !(suppressMarketActivityPositives && isMarketActivityPositive(signal)))
      .map((signal) => signal.detail)
  );

  const contextualSignals = positiveDetails.filter((detail) => !strengths.includes(detail));

  const risks = unique([
    ...(result.signalInterpretation?.signals
      .filter((signal) => signal.tone === 'negative' || signal.tone === 'caution')
      .map((signal) => signal.detail) ?? []),
    ...(result.risk?.signals.map((signal) => `${signal.label}: ${signal.value}`) ?? []),
    ...(contextualSignals.length > 0 ? contextualSignals.map((detail) => `Context note: ${detail}`) : []),
    ...(result.sectorIntelligence?.watchouts ?? [])
  ]);

  const mixedSignalSummary = buildMixedSignalSummary(response, strengths, risks);

  return (
    <section className="dashboard-card card dashboard-card-span-full">
      <div className="dashboard-card-header">
        <p className="dashboard-card-kicker">Strengths & risks</p>
      </div>

      {mixedSignalSummary ? <p className="strengths-risks-summary">{mixedSignalSummary}</p> : null}

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
            <p className="dashboard-muted-copy">No clear positive indicators were strong enough to outweigh the current caution layer.</p>
          )}
        </div>

        <div className="risks-panel">
          <h3>Risks</h3>
          {risks.length > 0 ? (
            <ul className="dashboard-list dashboard-list-negative">
              {risks.slice(0, 6).map((item) => (
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
