import type { InterpretedSignal, ResearchResponse } from '../types/research';

type StrengthsRisksCardProps = {
  response: ResearchResponse;
};

type RiskItem = {
  text: string;
  family: 'volume' | 'market_cap' | 'volatility' | 'liquidity' | 'valuation_gap' | 'rank' | 'trust' | 'other';
  priority: number;
};

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function isMarketActivityPositive(signal: InterpretedSignal) {
  const normalized = `${signal.label} ${signal.detail}`.toLowerCase();
  return normalized.includes('volume') || normalized.includes('activity') || normalized.includes('momentum') || normalized.includes('liquidity');
}

function getRiskFamily(text: string): RiskItem['family'] {
  const normalized = normalizeText(text);

  if (normalized.includes('honeypot') || normalized.includes('contract risk') || normalized.includes('trading behavior') || normalized.includes('new contract') || normalized.includes('young contract')) {
    return 'trust';
  }
  if (normalized.includes('liquidity')) return 'liquidity';
  if (normalized.includes('volume')) return 'volume';
  if (normalized.includes('market cap')) return 'market_cap';
  if (normalized.includes('fdv') || normalized.includes('valuation gap') || normalized.includes('dilution')) return 'valuation_gap';
  if (normalized.includes('rank')) return 'rank';
  if (normalized.includes('volatility') || normalized.includes('price moved') || normalized.includes('sharp short-term swing')) return 'volatility';
  return 'other';
}

function getRiskPriority(text: string) {
  const normalized = normalizeText(text);

  if (normalized.includes('honeypot') || normalized.includes('structural contract risk')) return 5;
  if (normalized.includes('low liquidity') || normalized.includes('liquidity is below') || normalized.includes('volume anomaly')) return 4;
  if (normalized.includes('sharp short-term swing') || normalized.includes('elevated short-term volatility')) return 3;
  if (normalized.includes('market cap') || normalized.includes('rank') || normalized.includes('fdv') || normalized.includes('valuation gap')) return 2;
  return 1;
}

function dedupeRiskItems(items: string[]) {
  const families = new Map<RiskItem['family'], RiskItem>();
  const orderedOthers: string[] = [];

  items.forEach((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const family = getRiskFamily(trimmed);
    if (family === 'other') {
      if (!orderedOthers.includes(trimmed)) {
        orderedOthers.push(trimmed);
      }
      return;
    }

    const candidate: RiskItem = {
      text: trimmed,
      family,
      priority: getRiskPriority(trimmed)
    };
    const existing = families.get(family);

    if (!existing || candidate.priority > existing.priority || (candidate.priority === existing.priority && candidate.text.length > existing.text.length)) {
      families.set(family, candidate);
    }
  });

  return [...families.values()].sort((left, right) => right.priority - left.priority).map((item) => item.text).concat(orderedOthers);
}

function shouldSuppressVolatilityConflict(text: string, change24hPct: number | null) {
  if (change24hPct === null || Math.abs(change24hPct) >= 5) {
    return false;
  }

  const normalized = normalizeText(text);
  return normalized.includes('sharp volatility') || normalized.includes('sharp short-term swing') || normalized.includes('elevated short-term volatility');
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
    return '⚠ Mixed signals: participation is present, but liquidity quality and trading behavior still raise caution.';
  }

  return '⚠ Mixed signals: some positive indicators are present, but the broader risk picture still warrants caution.';
}

export function StrengthsRisksCard({ response }: StrengthsRisksCardProps) {
  const result = response.result;
  if (!result) return null;

  const trustLabel = result.risk?.details?.trustLabel ?? null;
  const liquidityRisk = result.risk?.details?.liquidityRisk ?? null;
  const volumeAnomaly = result.risk?.details?.volumeAnomaly ?? null;
  const change24hPct = result.market.change24hPct;

  const positiveSignals = result.signalInterpretation?.signals.filter((signal) => signal.tone === 'positive') ?? [];
  const positiveDetails = positiveSignals.map((signal) => signal.detail);
  const suppressMarketActivityPositives = trustLabel === 'danger' || liquidityRisk === 'high' || volumeAnomaly === true;

  const strengths = unique(
    positiveSignals
      .filter((signal) => !(suppressMarketActivityPositives && isMarketActivityPositive(signal)))
      .map((signal) => signal.detail)
  );

  const contextualSignals = positiveDetails.filter((detail) => !strengths.includes(detail));
  const hadSuppressedPositives = contextualSignals.length > 0;

  const rawRisks = [
    ...(result.signalInterpretation?.signals
      .filter((signal) => signal.tone === 'negative' || signal.tone === 'caution')
      .map((signal) => signal.detail) ?? []),
    ...(result.risk?.signals.map((signal) => `${signal.label}: ${signal.value}`) ?? []),
    ...(contextualSignals.length > 0 ? contextualSignals.map((detail) => `Context note: ${detail}`) : []),
    ...(result.sectorIntelligence?.watchouts ?? [])
  ];

  const risks = dedupeRiskItems(unique(rawRisks).filter((item) => !shouldSuppressVolatilityConflict(item, change24hPct))).slice(0, 6);
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
            <p className="dashboard-muted-copy">
              {hadSuppressedPositives
                ? 'Positive market signals were present, but they were not strong enough to offset the current risk picture.'
                : 'No clear positive indicators were highlighted in the current signal set.'}
            </p>
          )}
        </div>

        <div className="risks-panel">
          <h3>Risks</h3>
          {risks.length > 0 ? (
            <ul className="dashboard-list dashboard-list-negative">
              {risks.map((item) => (
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
