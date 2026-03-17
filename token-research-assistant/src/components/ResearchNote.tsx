import { useState } from 'react';
import type { ResearchNote as ResearchNoteType, ResearchResponse, RiskAnalysis } from '../types/research';

type ResearchNoteProps = {
  note: ResearchNoteType;
  response?: ResearchResponse | null;
};

const sections = [
  { title: 'Summary', content: (note: ResearchNoteType) => note.summary },
  { title: 'Use Case', content: (note: ResearchNoteType) => note.useCase },
  { title: 'Risks', content: (note: ResearchNoteType) => note.risks },
  { title: 'Ecosystem Notes', content: (note: ResearchNoteType) => note.ecosystemNotes }
];

function buildCopyText(note: ResearchNoteType) {
  return [`# ${note.project}`, '', ...sections.flatMap((section) => [`## ${section.title}`, section.content(note), ''])].join('\n').trim();
}

function formatCurrency(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return null;
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

function formatCompactNumber(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);
}

function buildMarketItems(response?: ResearchResponse | null) {
  if (!response?.result || response.status !== 'live') {
    return [];
  }

  const { market } = response.result;

  return [
    { label: 'Price', value: formatCurrency(market.priceUsd) },
    { label: '24h Change', value: formatPercent(market.change24hPct) },
    { label: 'Market Cap', value: formatCompactNumber(market.marketCapUsd) ? `$${formatCompactNumber(market.marketCapUsd)}` : null },
    { label: '24h Volume', value: formatCompactNumber(market.volume24hUsd) ? `$${formatCompactNumber(market.volume24hUsd)}` : null },
    { label: 'Rank', value: market.marketCapRank !== null ? `#${market.marketCapRank}` : null },
    { label: 'Last Updated', value: market.lastUpdated ? new Date(market.lastUpdated).toLocaleString() : null }
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
}

function buildLinkItems(response?: ResearchResponse | null) {
  if (!response?.result) {
    return [];
  }

  const { links } = response.result;
  return [
    { label: 'Homepage', href: links.homepage[0] ?? null },
    { label: 'Explorer', href: links.blockchainSite[0] ?? null },
    { label: 'Twitter', href: links.twitter[0] ?? null },
    { label: 'GitHub', href: links.github[0] ?? null },
    { label: 'Telegram', href: links.telegram[0] ?? null },
    { label: 'Subreddit', href: links.subreddit[0] ?? null }
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));
}

function getRiskBadgeClass(level: RiskAnalysis['level']) {
  switch (level) {
    case 'low':
      return 'result-status-known';
    case 'medium':
      return 'result-status-fallback';
    case 'high':
      return 'risk-badge-high';
    default:
      return 'result-status-muted';
  }
}

function formatRiskLevel(level: RiskAnalysis['level']) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function ResearchNote({ note, response }: ResearchNoteProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const marketItems = buildMarketItems(response);
  const linkItems = buildLinkItems(response);
  const risk = response?.result?.risk ?? null;
  const liveResult = response?.status === 'live';
  const logoUrl = response?.result?.media.smallUrl ?? response?.result?.media.thumbUrl ?? null;
  const categories = response?.result?.project.categories ?? [];
  const visibleCategories = categories.slice(0, 8);
  const sourceCopy = note.isFallback
    ? {
        kicker: 'Fallback research result',
        badge: 'Local fallback',
        intro: 'Live CoinGecko data was unavailable for this lookup, so you are seeing the app’s local fallback research instead.'
      }
    : {
        kicker: 'Live research result',
        badge: 'Live · CoinGecko',
        intro: 'This result includes live CoinGecko project data, with market fields and official links separated for easier scanning.'
      };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(note));
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('failed');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <section className={`card note-card ${note.isFallback ? 'note-card-fallback' : ''}`}>
      <div className="note-header">
        <div className="note-header-top">
          <div className="note-header-main">
            {logoUrl ? (
              <div className="note-logo-shell">
                <img src={logoUrl} alt={`${note.project} logo`} className="note-logo" loading="lazy" />
              </div>
            ) : null}

            <div className="note-header-copy">
              <div className="note-title-row">
                <p className="note-kicker">{sourceCopy.kicker}</p>
                <span className={`result-status-badge ${note.isFallback ? 'result-status-fallback' : 'result-status-known'}`}>
                  {sourceCopy.badge}
                </span>
              </div>
              <h2>{note.project}</h2>
            </div>
          </div>

          <button type="button" className="secondary-button" onClick={handleCopy}>
            {copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy Note'}
          </button>
        </div>

        <p className="note-intro">{sourceCopy.intro}</p>

        <div className="note-meta">
          <span className="note-badge">Matched on: {note.matchedOn}</span>
          {!note.isFallback && note.aliases.length > 0 ? <span className="note-badge">Symbol: {note.aliases.join(', ')}</span> : null}
        </div>

        {visibleCategories.length > 0 ? (
          <div className="category-row" aria-label="Project categories">
            {visibleCategories.map((category) => (
              <span key={category} className="category-chip">
                {category}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {marketItems.length > 0 ? (
        <section className="note-data-panel">
          <div className="note-panel-header">
            <p className="state-kicker">Live market snapshot</p>
          </div>
          <div className="market-grid">
            {marketItems.map((item) => (
              <div key={item.label} className="market-stat">
                <span className="market-stat-label">{item.label}</span>
                <strong className={`market-stat-value ${item.label === '24h Change' && item.value.startsWith('+') ? 'market-stat-positive' : item.label === '24h Change' && item.value.startsWith('-') ? 'market-stat-negative' : ''}`}>
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {risk ? (
        <section className="note-data-panel note-data-panel-risk">
          <div className="note-panel-header note-panel-header-inline">
            <p className="state-kicker">Market risk snapshot</p>
            <span className={`result-status-badge ${getRiskBadgeClass(risk.level)}`}>{formatRiskLevel(risk.level)}</span>
          </div>
          <div className="risk-summary-row">
            <p className="risk-summary-text">{risk.summary}</p>
            {risk.score !== null ? <span className="note-badge">Risk score: {risk.score}/100</span> : null}
          </div>
          {risk.signals.length > 0 ? (
            <ul className="risk-signal-list">
              {risk.signals.slice(0, 4).map((signal) => (
                <li key={`${signal.key}-${signal.value}`}>
                  <strong>{signal.label}:</strong> {signal.value}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="risk-footnote">Market risk only — not investment advice or a full project audit.</p>
        </section>
      ) : null}

      {linkItems.length > 0 ? (
        <section className="note-data-panel note-data-panel-links">
          <div className="note-panel-header">
            <p className="state-kicker">Official links</p>
          </div>
          <div className="link-grid">
            {linkItems.map((item) => (
              <a key={`${item.label}-${item.href}`} className="resource-link" href={item.href} target="_blank" rel="noreferrer">
                <span className="resource-link-label">{item.label}</span>
                <span className="resource-link-url">{item.href}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <div className="note-markdown">
        {sections.map((section) => (
          <article key={section.title} className="note-section">
            <h3>## {section.title}</h3>
            <p>{section.content(note)}</p>
          </article>
        ))}

        {!liveResult && categories.length > 0 ? (
          <article className="note-section">
            <h3>## Categories</h3>
            <div className="category-row">
              {categories.map((category) => (
                <span key={category} className="category-chip">
                  {category}
                </span>
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
