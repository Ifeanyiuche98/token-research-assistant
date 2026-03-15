import { useState } from 'react';
import { TokenForm } from './components/TokenForm';
import { ResearchNote } from './components/ResearchNote';
import { LoadingState } from './components/LoadingState';
import type { ResearchNote as ResearchNoteType } from './types/research';
import { generateResearchNote } from './utils/generateResearchNote';
import { supportedProjects } from './data/mockResearch';

const quickSamples = ['Bitcoin', 'Ethereum', 'Solana', 'Chainlink', 'Uniswap'];

function App() {
  const [query, setQuery] = useState('');
  const [note, setNote] = useState<ResearchNoteType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (value: string) => {
    setQuery(value);

    if (error && value.trim()) {
      setError('');
    }
  };

  const handleGenerate = async (nextQuery?: string) => {
    const trimmedQuery = (nextQuery ?? query).trim();

    if (!trimmedQuery) {
      setError('Please enter a token or project name before generating a note.');
      setNote(null);
      return;
    }

    if (nextQuery) {
      setQuery(nextQuery);
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await generateResearchNote(trimmedQuery);
      setNote(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = (value: string) => {
    setError('');
    void handleGenerate(value);
  };

  const handleClear = () => {
    setQuery('');
    setNote(null);
    setError('');
  };

  const hasActiveState = Boolean(query.trim() || note || error);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Phase 6</p>
        <h1>Token Research Assistant</h1>
        <p className="subtitle">
          Enter a token or project name and get a short research note in a clean, readable format.
        </p>
      </section>

      <TokenForm
        value={query}
        onChange={handleChange}
        onSubmit={() => void handleGenerate()}
        onSelectSample={handleSelectSample}
        onClear={handleClear}
        isLoading={isLoading}
        error={error}
        samples={quickSamples}
        hasActiveState={hasActiveState}
      />

      {!note && !isLoading ? (
        <section className="card state-card empty-state">
          <div className="empty-state-top">
            <div className="empty-state-icon" aria-hidden="true">
              ✦
            </div>
            <div>
              <p className="state-kicker">Welcome</p>
              <h2>Start your first quick token research note</h2>
            </div>
          </div>

          <p className="state-copy">
            Type any token or project name to generate a short note with a summary, use case, risks, and ecosystem notes.
          </p>

          <div className="empty-state-grid">
            <div className="empty-state-panel">
              <p className="state-list-label">What you will get</p>
              <ul className="state-list">
                <li>Short summary</li>
                <li>Main use case</li>
                <li>Key risks to watch</li>
                <li>Ecosystem context</li>
              </ul>
            </div>

            <div className="empty-state-panel">
              <p className="state-list-label">Built-in examples</p>
              <div className="chip-list">
                {supportedProjects.map((project) => (
                  <span key={project} className="chip">
                    {project}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {isLoading && <LoadingState />}
      {note && !isLoading && <ResearchNote note={note} />}
    </main>
  );
}

export default App;
