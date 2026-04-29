import type { ResearchResponse } from '../types/research';

type MarketCardProps = {
  response: ResearchResponse;
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
  return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`;
}

export function MarketCard({ response }: MarketCardProps) {
  const result = response.result;
  if (!result) return null;

  const { identity, market, media } = result;
  const logoUrl = media.smallUrl ?? media.thumbUrl ?? null;
  const change = formatPercent(market.change24hPct);
  const changeClass = change.startsWith('+') ? 'market-stat-positive' : change.startsWith('-') ? 'market-stat-negative' : '';

  return (
    <section className="dashboard-card dashboard-card-market card">
      <div className="dashboard-card-header">
        <p className="dashboard-card-kicker">Market snapshot</p>
      </div>

      <div className="market-card-identity">
        {logoUrl ? (
          <div className="market-card-logo-shell">
            <img src={logoUrl} alt={`${identity.name ?? response.query.raw} logo`} className="market-card-logo" loading="lazy" />
          </div>
        ) : null}

        <div>
          <h3>{identity.name ?? response.query.raw}</h3>
          <p className="market-card-symbol">{identity.symbol ?? 'Unknown symbol'}</p>
        </div>
      </div>

      <div className="market-card-price-row">
        <div>
          <p className="market-card-price-label">Price</p>
          <p className="market-card-price">{formatCurrency(market.priceUsd)}</p>
        </div>
        <span className={`market-card-change ${changeClass}`}>{change}</span>
      </div>

      <div className="market-card-grid">
        <div className="market-card-stat">
          <span>Market cap</span>
          <strong>{formatCompactCurrency(market.marketCapUsd)}</strong>
        </div>
        <div className="market-card-stat">
          <span>24h volume</span>
          <strong>{formatCompactCurrency(market.volume24hUsd)}</strong>
        </div>
        <div className="market-card-stat">
          <span>Rank</span>
          <strong>{market.marketCapRank !== null ? `#${market.marketCapRank}` : '—'}</strong>
        </div>
      </div>
    </section>
  );
}
