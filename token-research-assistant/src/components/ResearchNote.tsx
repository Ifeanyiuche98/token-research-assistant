import { useState } from 'react';
import type { ResearchNote as ResearchNoteType, ResearchResponse } from '../types/research';

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

export function ResearchNote({ note, response }: ResearchNoteProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const marketItems = buildMarketItems(response);
  const linkItems = buildLinkItems(response);
  const liveResult = response?.status === 'live';

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
          <div>
            <div className="note-title-row">
              <p className="note-kicker">{note.isFallback ? 'Fallback research note' : 'Live research note'}</p>
              <span className={`result-status-badge ${note.isFallback ? 'result-status-fallback' : 'result-status-known'}`}>
                {note.isFallback ? 'Fallback result' : 'Live result'}
              </span>
            </div>
            <h2>{note.project}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={handleCopy}>
            {copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy Note'}
          </button>
        </div>

        <p className="note-intro">
          {note.isFallback
            ? 'Live lookup did not return a usable result, so the app is showing local fallback research.'
            : 'Live CoinGecko data is available for this project, with the main market fields shown separately below.'}
        </p>

        <div className="note-meta">
          <span className="note-badge">Matched on: {note.matchedOn}</span>
          {!note.isFallback && note.aliases.length > 0 ? <span className="note-badge">Symbol: {note.aliases.join(', ')}</span> : null}
        </div>
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

        {!liveResult && response?.result?.project.categories.length ? (
          <article className="note-section">
            <h3>## Categories</h3>
            <p>{response.result.project.categories.join(', ')}</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
