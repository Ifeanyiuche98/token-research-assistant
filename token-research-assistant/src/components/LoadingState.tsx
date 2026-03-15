type LoadingStateProps = {
  query?: string;
};

export function LoadingState({ query }: LoadingStateProps) {
  return (
    <div className="card loading-state" aria-live="polite">
      <div className="loading-inline">
        <span className="spinner spinner-large" aria-hidden="true" />
        <div>
          <p className="loading-title">Researching {query ? `“${query}”` : 'token or project'}</p>
          <p className="loading-copy">Checking CoinGecko first, then falling back to local research if needed.</p>
        </div>
      </div>
    </div>
  );
}
