import { useState } from 'react';
import type { ResearchNote as ResearchNoteType, ResearchResponse } from '../types/research';
import { MarketCard } from './MarketCard';
import { ResearchCard } from './ResearchCard';
import { RiskCard } from './RiskCard';
import { SectorCard } from './SectorCard';
import { SignalCard } from './SignalCard';
import { StrengthsRisksCard } from './StrengthsRisksCard';
import { GladysInsightCard } from './GladysInsightCard';

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

function buildLinkItems(response?: ResearchResponse | null) {
  if (!response?.result) return [];

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
  const linkItems = buildLinkItems(response);
  const categories = response?.result?.project.categories ?? [];
  const resultName = response?.result?.identity.name ?? note.project;
  const resultSymbol = response?.result?.identity.symbol ?? note.aliases[0] ?? null;
  const sourceLabel = note.isFallback ? 'Fallback Mode' : 'Live Mode';

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
    <section className="dashboard-note-shell">
      <section className={`card dashboard-hero-card ${note.isFallback ? 'dashboard-hero-card-fallback' : ''}`}>
        <div className="dashboard-hero-top">
          <div>
            <p className="dashboard-kicker">Token intelligence dashboard</p>
            <h2 className="dashboard-result-title">{resultName}</h2>
            <p className="dashboard-result-subtitle">
              {resultSymbol ? `${resultSymbol} · ` : ''}
              Matched on {note.matchedOn}
            </p>
          </div>

          <div className="dashboard-hero-actions">
            <span className={`result-status-badge ${note.isFallback ? 'result-status-fallback' : 'result-status-known'}`}>{sourceLabel}</span>
            <button type="button" className="secondary-button dashboard-secondary-button" onClick={handleCopy}>
              {copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy Note'}
            </button>
          </div>
        </div>

        <p className="dashboard-result-copy">
          {note.isFallback ? 'Unable to fetch live data. Showing fallback analysis.' : 'Live market data retrieved successfully and mapped into the full intelligence pipeline.'}
        </p>

        {categories.length > 0 ? (
          <div className="category-row dashboard-category-row">
            {categories.slice(0, 8).map((category) => (
              <span key={category} className="category-chip dashboard-category-chip">
                {category}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {response?.result ? (
        <div className="dashboard-grid">
          <MarketCard response={response} />
          <RiskCard response={response} />
          <SignalCard response={response} />
          <GladysInsightCard response={response} />
          <ResearchCard response={response} />
          <SectorCard response={response} />
          <StrengthsRisksCard response={response} />

          {linkItems.length > 0 ? (
            <section className="dashboard-card card dashboard-card-span-full">
              <div className="dashboard-card-header">
                <p className="dashboard-card-kicker">Official links</p>
              </div>
              <div className="link-grid">
                {linkItems.map((item) => (
                  <a key={`${item.label}-${item.href}`} className="resource-link dashboard-resource-link" href={item.href} target="_blank" rel="noreferrer">
                    <span className="resource-link-label">{item.label}</span>
                    <span className="resource-link-url">{item.href}</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
