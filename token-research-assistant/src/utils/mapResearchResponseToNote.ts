import type { ResearchNote, ResearchResponse } from '../types/research';

function formatCurrency(value: number | null): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

function formatPercent(value: number | null): string | null {
  if (value === null) return null;
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function mapResearchResponseToNote(response: ResearchResponse): ResearchNote | null {
  const result = response.result;
  if (!result) {
    return null;
  }

  const marketHighlights = [
    formatCurrency(result.market.priceUsd) ? `Price: ${formatCurrency(result.market.priceUsd)}` : null,
    formatPercent(result.market.change24hPct) ? `24h change: ${formatPercent(result.market.change24hPct)}` : null,
    formatCurrency(result.market.marketCapUsd) ? `Market cap: ${formatCurrency(result.market.marketCapUsd)}` : null,
    formatCurrency(result.market.volume24hUsd) ? `24h volume: ${formatCurrency(result.market.volume24hUsd)}` : null,
    result.market.marketCapRank !== null ? `Rank: #${result.market.marketCapRank}` : null
  ].filter(Boolean);

  const summary = result.project.description ?? response.message;
  const useCase = result.project.categories.length
    ? `Categories: ${result.project.categories.join(', ')}.`
    : response.status === 'live'
      ? 'Live project details were found, but category data is limited in the current response.'
      : 'Local fallback research is being shown because live data was unavailable.';

  const risks =
    response.status === 'fallback'
      ? 'This is fallback research, so verify project details with official documentation and trusted market sources before relying on it.'
      : 'Market data can change quickly. Always verify liquidity, token identity, and official links before making any decision.';

  const ecosystemNotes = [
    marketHighlights.length ? marketHighlights.join(' • ') : null,
    result.links.homepage[0] ? `Homepage: ${result.links.homepage[0]}` : null,
    result.links.github[0] ? `GitHub: ${result.links.github[0]}` : null,
    result.links.twitter[0] ? `Twitter: ${result.links.twitter[0]}` : null,
    result.market.lastUpdated ? `Last updated: ${result.market.lastUpdated}` : null
  ]
    .filter(Boolean)
    .join('\n');

  return {
    project: result.identity.name ?? response.query.raw,
    summary,
    useCase,
    risks,
    ecosystemNotes: ecosystemNotes || 'No extra ecosystem notes are available yet.',
    matchedOn: response.query.raw,
    aliases: result.identity.symbol ? [result.identity.symbol] : [],
    isFallback: response.status === 'fallback'
  };
}
