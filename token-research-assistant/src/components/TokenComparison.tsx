import type { CompareResponse } from '../types/compare';
import type { ResearchResponse } from '../types/research';

type TokenComparisonProps = {
  comparison: CompareResponse;
};

type HighlightSide = 'left' | 'right' | null;

type ComparisonField = {
  label: string;
  left: string;
  right: string;
  leftRaw?: number | null;
  rightRaw?: number | null;
  highlight?: HighlightSide;
};

function formatCurrency(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return '—';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

function formatCompactCurrency(value: number | null) {
  if (value === null) return '—';
  const compact = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);
  return `$${compact}`;
}

function truncate(value: string | null, maxLength = 180) {
  if (!value) return '—';
  return value.length > maxLength ? `${value.slice(0, maxLength - 3).trim()}...` : value;
}

function joinList(values: string[], maxItems = 4) {
  if (!values.length) return '—';
  return values.slice(0, maxItems).join(', ');
}

function getSourceLabel(response: ResearchResponse) {
  switch (response.status) {
    case 'live':
      return 'Live';
    case 'fallback':
      return 'Fallback';
    case 'not_found':
      return 'Not found';
    default:
      return 'Error';
  }
}

function getSourceClass(response: ResearchResponse) {
  switch (response.status) {
    case 'live':
      return 'result-status-known';
    case 'fallback':
      return 'result-status-fallback';
    default:
      return 'result-status-muted';
  }
}

function getDisplayName(response: ResearchResponse) {
  return response.result?.identity.name ?? response.query.raw;
}

function getDisplaySymbol(response: ResearchResponse) {
  return response.result?.identity.symbol ?? '—';
}

function getRank(response: ResearchResponse) {
  const rank = response.result?.market.marketCapRank;
  return rank !== null && rank !== undefined ? `#${rank}` : '—';
}

function getLink(response: ResearchResponse, key: 'homepage' | 'twitter' | 'github') {
  return response.result?.links[key][0] ?? '—';
}

function getHigherValueHighlight(leftValue: number | null, rightValue: number | null): HighlightSide {
  if (leftValue === null || rightValue === null) {
    return null;
  }

  if (leftValue === rightValue) {
    return null;
  }

  return leftValue > rightValue ? 'left' : 'right';
}

function buildNumericField(label: string, leftValue: number | null, rightValue: number | null, formatter: (value: number | null) => string): ComparisonField {
  return {
    label,
    left: formatter(leftValue),
    right: formatter(rightValue),
    leftRaw: leftValue,
    rightRaw: rightValue,
    highlight: getHigherValueHighlight(leftValue, rightValue)
  };
}

function buildFields(left: ResearchResponse, right: ResearchResponse) {
  const leftMarket = left.result?.market;
  const rightMarket = right.result?.market;

  const marketFields: ComparisonField[] = [
    buildNumericField('Price', leftMarket?.priceUsd ?? null, rightMarket?.priceUsd ?? null, formatCurrency),
    buildNumericField('24h Change', leftMarket?.change24hPct ?? null, rightMarket?.change24hPct ?? null, formatPercent),
    buildNumericField('Market Cap', leftMarket?.marketCapUsd ?? null, rightMarket?.marketCapUsd ?? null, formatCompactCurrency),
    buildNumericField('24h Volume', leftMarket?.volume24hUsd ?? null, rightMarket?.volume24hUsd ?? null, formatCompactCurrency),
    buildNumericField(
      'Fully Diluted Valuation',
      leftMarket?.fullyDilutedValuationUsd ?? null,
      rightMarket?.fullyDilutedValuationUsd ?? null,
      formatCompactCurrency
    )
  ];

  const projectFields: ComparisonField[] = [
    { label: 'Summary', left: truncate(left.result?.project.description ?? null), right: truncate(right.result?.project.description ?? null) },
    { label: 'Categories', left: joinList(left.result?.project.categories ?? []), right: joinList(right.result?.project.categories ?? []) }
  ];

  const linkFields: ComparisonField[] = [
    { label: 'Homepage', left: getLink(left, 'homepage'), right: getLink(right, 'homepage') },
    { label: 'Twitter', left: getLink(left, 'twitter'), right: getLink(right, 'twitter') },
    { label: 'GitHub', left: getLink(left, 'github'), right: getLink(right, 'github') }
  ];

  const freshnessFields: ComparisonField[] = [
    {
      label: 'Last Updated',
      left: left.result?.market.lastUpdated ? new Date(left.result.market.lastUpdated).toLocaleString() : '—',
      right: right.result?.market.lastUpdated ? new Date(right.result.market.lastUpdated).toLocaleString() : '—'
    }
  ];

  return { marketFields, projectFields, linkFields, freshnessFields };
}

function getValueClassName(field: ComparisonField, side: 'left' | 'right') {
  const shouldHighlight = field.highlight === side;
  return `comparison-cell comparison-value-cell ${shouldHighlight ? 'comparison-value-stronger' : ''}`.trim();
}

function getValuePrefix(field: ComparisonField, side: 'left' | 'right') {
  return field.highlight === side ? '✓ ' : '';
}

function ComparisonSection({
  title,
  left,
  right,
  fields
}: {
  title: string;
  left: ResearchResponse;
  right: ResearchResponse;
  fields: ComparisonField[];
}) {
  return (
    <section className="comparison-section">
      <div className="note-panel-header">
        <p className="state-kicker">{title}</p>
      </div>
      <div className="comparison-table">
        <div className="comparison-table-head comparison-table-row">
          <span className="comparison-cell comparison-label-cell">Field</span>
          <span className="comparison-cell">{getDisplayName(left)}</span>
          <span className="comparison-cell">{getDisplayName(right)}</span>
        </div>
        {fields.map((field) => (
          <div key={field.label} className="comparison-table-row">
            <span className="comparison-cell comparison-label-cell">{field.label}</span>
            <span className={getValueClassName(field, 'left')}>
              {getValuePrefix(field, 'left')}
              {field.left}
            </span>
            <span className={getValueClassName(field, 'right')}>
              {getValuePrefix(field, 'right')}
              {field.right}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TokenComparison({ comparison }: TokenComparisonProps) {
  const { left, right } = comparison;
  const { marketFields, projectFields, linkFields, freshnessFields } = buildFields(left, right);

  return (
    <section className="card comparison-card">
      <div className="comparison-header">
        <p className="state-kicker">Compare mode</p>
        <h2>Side-by-side token comparison</h2>
        <p className="state-copy comparison-copy">A compact comparison using the existing research resolver for both lookups.</p>
      </div>

      <section className="comparison-section comparison-identity-section">
        <div className="note-panel-header">
          <p className="state-kicker">Identity and source</p>
        </div>
        <div className="comparison-identity-grid">
          {[left, right].map((response, index) => (
            <article key={`${response.query.raw}-${index}`} className="comparison-token-card">
              <div className="comparison-token-top">
                <h3>{getDisplayName(response)}</h3>
                <span className={`result-status-badge ${getSourceClass(response)}`}>{getSourceLabel(response)}</span>
              </div>
              <div className="comparison-token-meta">
                <span className="note-badge">Symbol: {getDisplaySymbol(response)}</span>
                <span className="note-badge">Rank: {getRank(response)}</span>
              </div>
              {(response.status === 'not_found' || response.status === 'error') && <p className="comparison-side-message">{response.message}</p>}
            </article>
          ))}
        </div>
      </section>

      <ComparisonSection title="Core market snapshot" left={left} right={right} fields={marketFields} />
      <ComparisonSection title="Project basics" left={left} right={right} fields={projectFields} />
      <ComparisonSection title="Official links" left={left} right={right} fields={linkFields} />
      <ComparisonSection title="Last updated" left={left} right={right} fields={freshnessFields} />
    </section>
  );
}
