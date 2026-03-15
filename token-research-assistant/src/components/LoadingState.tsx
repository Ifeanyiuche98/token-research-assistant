export function LoadingState() {
  return (
    <div className="card loading-state" aria-live="polite">
      <div className="loading-inline">
        <span className="spinner spinner-large" aria-hidden="true" />
        <div>
          <p className="loading-title">Generating research note</p>
          <p className="loading-copy">Preparing a short summary, use case, risks, and ecosystem notes.</p>
        </div>
      </div>
    </div>
  );
}
