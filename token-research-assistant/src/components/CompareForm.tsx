type CompareFormProps = {
  leftValue: string;
  rightValue: string;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading: boolean;
  error: string;
  hasActiveState: boolean;
};

export function CompareForm({
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  onSubmit,
  onClear,
  isLoading,
  error,
  hasActiveState
}: CompareFormProps) {
  return (
    <div className="card form-card">
      <div className="compare-form-header">
        <div>
          <label className="label" htmlFor="compare-token-a">
            Compare two tokens or projects
          </label>
          <p className="helper-text compare-helper-text">Enter two different names to see a compact side-by-side comparison.</p>
        </div>
      </div>

      <div className="compare-form-grid">
        <div>
          <label className="compare-input-label" htmlFor="compare-token-a">
            Token A
          </label>
          <input
            id="compare-token-a"
            className={`input ${error ? 'input-error' : ''}`}
            type="text"
            placeholder="e.g. Bitcoin"
            value={leftValue}
            onChange={(event) => onLeftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSubmit();
              }
            }}
          />
        </div>

        <div>
          <label className="compare-input-label" htmlFor="compare-token-b">
            Token B
          </label>
          <input
            id="compare-token-b"
            className={`input ${error ? 'input-error' : ''}`}
            type="text"
            placeholder="e.g. Ethereum"
            value={rightValue}
            onChange={(event) => onRightChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSubmit();
              }
            }}
          />
        </div>
      </div>

      <div className="form-row compare-form-actions">
        <button className="button" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? (
            <span className="button-content">
              <span className="spinner" aria-hidden="true" />
              Comparing...
            </span>
          ) : (
            'Compare tokens'
          )}
        </button>
        <button type="button" className="secondary-button clear-button" onClick={onClear} disabled={isLoading || !hasActiveState}>
          Clear
        </button>
      </div>

      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </div>
  );
}
