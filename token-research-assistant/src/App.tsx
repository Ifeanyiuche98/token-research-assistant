import { useEffect, useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { ResearchNote } from './components/ResearchNote';
import { LoadingState } from './components/LoadingState';
import { ModeToggle } from './components/ModeToggle';
import { CompareForm } from './components/CompareForm';
import { TokenComparison } from './components/TokenComparison';
import type { CompareResponse, CompareUiState } from './types/compare';
import type { ResearchNote as ResearchNoteType, ResearchUiState } from './types/research';
import { supportedProjects } from './data/mockResearch';
import { fetchResearch } from './utils/researchApi';
import { fetchComparison } from './utils/compareApi';
import { mapResearchResponseToNote } from './utils/mapResearchResponseToNote';

const quickSamples = ['Bitcoin', 'Ethereum', 'Solana', 'Chainlink', 'Uniswap'];

function App() {
  const [mode, setMode] = useState<'single' | 'compare'>('single');
  const [query, setQuery] = useState('');
  const [note, setNote] = useState<ResearchNoteType | null>(null);
  const [uiState, setUiState] = useState<ResearchUiState | null>(null);
  const [error, setError] = useState('');
  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [compareUiState, setCompareUiState] = useState<CompareUiState | null>(null);
  const [compareError, setCompareError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('theme');
    return stored === 'light' ? 'light' : 'dark';
  });

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

  const handleCompare = async () => {
    const leftTrimmed = leftQuery.trim();
    const rightTrimmed = rightQuery.trim();

    if (!leftTrimmed || !rightTrimmed) {
      setCompareError('Please enter both tokens or projects before comparing.');
      setCompareResult(null);
      setCompareUiState({ type: 'error', message: 'Please enter both tokens or projects before comparing.' });
      return;
    }

    if (leftTrimmed.toLowerCase() === rightTrimmed.toLowerCase()) {
      setCompareError('Choose two different tokens or projects to compare.');
      setCompareResult(null);
      setCompareUiState({ type: 'error', message: 'Choose two different tokens or projects to compare.' });
      return;
    }

    setCompareError('');
    setCompareUiState({ type: 'loading', leftQuery: leftTrimmed, rightQuery: rightTrimmed });

    try {
      const response = await fetchComparison(leftTrimmed, rightTrimmed);
      setCompareResult(response);
      setCompareUiState({ type: 'result', data: response });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to compare tokens right now.';
      setCompareResult(null);
      setCompareError(message);
      setCompareUiState({ type: 'error', message });
    }
  };

  const handleClearCompare = () => {
    setLeftQuery('');
    setRightQuery('');
    setCompareResult(null);
    setCompareError('');
    setCompareUiState(null);
  };

  const handleSwapCompareTokens = () => {
    setLeftQuery(rightQuery);
    setRightQuery(leftQuery);

    if (compareError) {
      setCompareError('');
    }
  };

  const handleModeChange = (nextMode: 'single' | 'compare') => {
    setMode(nextMode);
  };

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const hasActiveState = Boolean(query.trim() || note || error || uiState);
  const isLoading = uiState?.type === 'loading';
  const isNotFound = uiState?.type === 'not_found';
  const isErrorState = uiState?.type === 'error' && !isLoading;
  const activeResponse = uiState?.type === 'live_result' || uiState?.type === 'fallback_result' ? uiState.data : null;
  const isCompareLoading = compareUiState?.type === 'loading';
  const hasCompareState = Boolean(leftQuery.trim() || rightQuery.trim() || compareResult || compareError || compareUiState);

  return (
    <main className="page">
      <section className="hero dashboard-hero-shell">
        <div className="hero-top dashboard-hero-shell-top">
          <div>
            <h1>Token Intel</h1>
          </div>

          <button type="button" className="theme-toggle-fancy" onClick={toggleTheme} aria-label="Toggle color theme">
            <span className="theme-toggle-track">
              <span className={`theme-toggle-thumb theme-toggle-thumb-${theme}`} />
              <span className={`theme-toggle-label ${theme === 'dark' ? 'theme-toggle-label-active' : ''}`}>🌙 Dark</span>
              <span className={`theme-toggle-label ${theme === 'light' ? 'theme-toggle-label-active' : ''}`}>☀️ Light</span>
            </span>
          </button>
        </div>
        <p className="subtitle dashboard-subtitle">
          Search a token, symbol, or supported contract address to see live market context, risk framing, research synthesis, and sector intelligence in one clean dashboard.
        </p>
      </section>

      <ModeToggle mode={mode} onChange={handleModeChange} />

      {mode === 'single' ? (
        <>
          <SearchBar
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
              <p className="state-copy">Unable to fetch live data. Showing fallback analysis.</p>
            </section>
          ) : null}

          {note && !isLoading && <ResearchNote note={note} response={activeResponse} />}
        </>
      ) : (
        <>
          <CompareForm
            leftValue={leftQuery}
            rightValue={rightQuery}
            onLeftChange={(value) => {
              setLeftQuery(value);
              if (compareError && value.trim()) setCompareError('');
            }}
            onRightChange={(value) => {
              setRightQuery(value);
              if (compareError && value.trim()) setCompareError('');
            }}
            onSwap={handleSwapCompareTokens}
            onSubmit={() => void handleCompare()}
            onClear={handleClearCompare}
            isLoading={Boolean(isCompareLoading)}
            error={compareError}
            hasActiveState={hasCompareState}
          />

          {!compareResult && !isCompareLoading && compareUiState?.type !== 'error' ? (
            <section className="card state-card empty-state">
              <div className="empty-state-top">
                <div className="empty-state-icon" aria-hidden="true">
                  ⇄
                </div>
                <div>
                  <p className="state-kicker">Compare mode</p>
                  <h2>Compare two crypto tokens side by side</h2>
                </div>
              </div>
              <p className="state-copy">
                Enter two different token or project names to compare identity, market snapshot, project basics, official links, and freshness in one lightweight view.
              </p>
            </section>
          ) : null}

          {isCompareLoading && <LoadingState query={`${compareUiState.leftQuery} vs ${compareUiState.rightQuery}`} />}

          {compareUiState?.type === 'error' && !isCompareLoading ? (
            <section className="card state-card empty-state">
              <div className="empty-state-top">
                <div className="empty-state-icon" aria-hidden="true">
                  !
                </div>
                <div>
                  <p className="state-kicker">Compare error</p>
                  <h2>Unable to compare tokens right now</h2>
                </div>
              </div>
              <p className="state-copy">{compareUiState.message}</p>
            </section>
          ) : null}

          {compareResult && !isCompareLoading ? <TokenComparison comparison={compareResult} /> : null}
        </>
      )}
    </main>
  );
}

export default App;
