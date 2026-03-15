type TokenFormProps = {
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

export function TokenForm({
  value,
  onChange,
  onSubmit,
  onSelectSample,
  onClear,
  isLoading,
  error,
  samples,
  hasActiveState
}: TokenFormProps) {
  return (
    <div className="card form-card">
      <label className="label" htmlFor="project-name">
        Token or project name
      </label>
      <div className="form-row">
        <input
          id="project-name"
          className={`input ${error ? 'input-error' : ''}`}
          type="text"
          placeholder="e.g. Bitcoin, Ethereum, Solana"
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
        <button className="button" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? (
            <span className="button-content">
              <span className="spinner" aria-hidden="true" />
              Generating...
            </span>
          ) : (
            'Generate note'
          )}
        </button>
        <button type="button" className="secondary-button clear-button" onClick={onClear} disabled={isLoading || !hasActiveState}>
          Clear
        </button>
      </div>

      <div className="sample-row">
        <p className="sample-label">Quick examples</p>
        <div className="chip-list">
          {samples.map((sample) => (
            <button
              key={sample}
              type="button"
              className="chip chip-button"
              onClick={() => onSelectSample(sample)}
              disabled={isLoading}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p id="project-name-error" className="error-text" role="alert">
          {error}
        </p>
      ) : (
        <p className="helper-text">Try a token name, protocol, or crypto project you want to summarize.</p>
      )}
    </div>
  );
}
