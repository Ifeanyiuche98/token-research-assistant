import { useState } from 'react';
import { TokenForm } from './components/TokenForm';
import { ResearchNote } from './components/ResearchNote';
import { LoadingState } from './components/LoadingState';
import type { ResearchNote as ResearchNoteType, ResearchUiState } from './types/research';
import { supportedProjects } from './data/mockResearch';
import { fetchResearch } from './utils/researchApi';
import { mapResearchResponseToNote } from './utils/mapResearchResponseToNote';

const quickSamples = ['Bitcoin', 'Ethereum', 'Solana', 'Chainlink', 'Uniswap'];

function App() {
  const [query, setQuery] = useState('');
  const [note, setNote] = useState<ResearchNoteType | null>(null);
  const [uiState, setUiState] = useState<ResearchUiState | null>(null);
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
      setError('Please enter a token or project name before researching.');
      setNote(null);
      setUiState({ type: 'error', query: '', message: 'Please enter a token or project name before researching.' });
      return;
    }

    if (nextQuery) {
      setQuery(nextQuery);
    }

    setError('');
    setUiState({ type: 'loading', query: trimmedQuery });

    try {
      const response = await fetchResearch(trimmedQuery);
      const mappedNote = mapResearchResponseToNote(response);

      if (response.status === 'live' && mappedNote) {
        setNote(mappedNote);
        setUiState({ type: 'live_result', data: response });
        return;
      }

      if (response.status === 'fallback' && mappedNote) {
        setNote(mappedNote);
        setUiState({ type: 'fallback_result', data: response });
        return;
      }

      if (response.status === 'not_found') {
        setNote(null);
        setUiState({ type: 'not_found', query: trimmedQuery, message: response.message });
        return;
      }

      setNote(null);
      setError(response.message);
      setUiState({ type: 'error', query: trimmedQuery, message: response.message });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to fetch research right now.';
      setNote(null);
      setError(message);
      setUiState({ type: 'error', query: trimmedQuery, message });
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
    setUiState(null);
  };

  const hasActiveState = Boolean(query.trim() || note || error || uiState);
  const isLoading = uiState?.type === 'loading';
  const isNotFound = uiState?.type === 'not_found';
  const isErrorState = uiState?.type === 'error' && !isLoading;
  const activeResponse = uiState?.type === 'live_result' || uiState?.type === 'fallback_result' ? uiState.data : null;

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Phase 7B</p>
        <h1>Token Research Assistant</h1>
        <p className="subtitle">
          Enter a token or project name and get a short research note with live CoinGecko data when available and local fallback support when it is not.
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

      {!note && !isLoading && !isNotFound && !isErrorState ? (
        <section className="card state-card empty-state">
          <div className="empty-state-top">
            <div className="empty-state-icon" aria-hidden="true">
              ✦
            </div>
            <div>
              <p className="state-kicker">Welcome</p>
              <h2>Start your first live token research lookup</h2>
            </div>
          </div>

          <p className="state-copy">
            Search any token or project to try a live CoinGecko lookup first. If live data is unavailable, the app will preserve the local fallback research flow.
          </p>

          <div className="empty-state-grid">
            <div className="empty-state-panel">
              <p className="state-list-label">What you will get</p>
              <ul className="state-list">
                <li>Live market snapshot when available</li>
                <li>Short summary and category context</li>
                <li>Official links when available</li>
                <li>Local fallback research if live lookup fails</li>
              </ul>
            </div>

            <div className="empty-state-panel">
              <p className="state-list-label">Quick examples</p>
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

      {isLoading && <LoadingState query={uiState.query} />}

      {isNotFound ? (
        <section className="card state-card empty-state">
          <div className="empty-state-top">
            <div className="empty-state-icon" aria-hidden="true">
              ?
            </div>
            <div>
              <p className="state-kicker">Not found</p>
              <h2>No token or project found</h2>
            </div>
          </div>
          <p className="state-copy">{uiState.message} Try the full project name, token symbol, or a different spelling.</p>
        </section>
      ) : null}

      {isErrorState ? (
        <section className="card state-card empty-state">
          <div className="empty-state-top">
            <div className="empty-state-icon" aria-hidden="true">
              !
            </div>
            <div>
              <p className="state-kicker">Error</p>
              <h2>Unable to fetch research right now</h2>
            </div>
          </div>
          <p className="state-copy">{uiState.message}</p>
        </section>
      ) : null}

      {note && !isLoading && <ResearchNote note={note} response={activeResponse} />}
    </main>
  );
}

export default App;
