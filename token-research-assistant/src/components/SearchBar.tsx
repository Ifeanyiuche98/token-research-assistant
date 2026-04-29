type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSelectSample: (value: string) => void;
  onClear: () => void;
  isLoading: boolean;
  error: string;
  samples: string[];
  hasActiveState: boolean;
};

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onSelectSample,
  onClear,
  isLoading,
  error,
  samples,
  hasActiveState
}: SearchBarProps) {
  return (
    <section className="dashboard-search card">
      <div className="dashboard-search-copy">
        <p className="dashboard-kicker">Crypto intelligence terminal</p>
        <h2 className="dashboard-search-title">Search token intelligence</h2>
        <p className="dashboard-search-subtitle">Live market context, risk interpretation, sector mapping, and fallback-safe research in one view.</p>
      </div>

      <div className="dashboard-search-row">
        <input
          id="project-name"
          className={`dashboard-search-input ${error ? 'dashboard-search-input-error' : ''}`}
          type="text"
          placeholder="Search token (e.g. BTC, Ethereum, or contract address)"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSubmit();
            }
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'project-name-error' : undefined}
        />

        <button className="button dashboard-primary-button" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? (
            <span className="button-content">
              <span className="spinner" aria-hidden="true" />
              Analyzing...
            </span>
          ) : (
            'Analyze'
          )}
        </button>

        <button type="button" className="secondary-button dashboard-secondary-button" onClick={onClear} disabled={isLoading || !hasActiveState}>
          Clear
        </button>
      </div>

      <div className="dashboard-search-footer">
        <div className="dashboard-sample-row">
          {samples.map((sample) => (
            <button key={sample} type="button" className="chip chip-button dashboard-chip" onClick={() => onSelectSample(sample)} disabled={isLoading}>
              {sample}
            </button>
          ))}
        </div>

        {error ? (
          <p id="project-name-error" className="error-text dashboard-error-text" role="alert">
            {error}
          </p>
        ) : (
          <p className="helper-text dashboard-helper-text">Supports token names, symbols, and EVM contract addresses.</p>
        )}
      </div>
    </section>
  );
}
