type LoadingStateProps = {
  query?: string;
};

function SkeletonCard() {
  return (
    <div className="dashboard-skeleton-card">
      <div className="dashboard-skeleton-line dashboard-skeleton-line-short" />
      <div className="dashboard-skeleton-line dashboard-skeleton-line-medium" />
      <div className="dashboard-skeleton-line" />
      <div className="dashboard-skeleton-grid">
        <div className="dashboard-skeleton-block" />
        <div className="dashboard-skeleton-block" />
      </div>
    </div>
  );
}

export function LoadingState({ query }: LoadingStateProps) {
  return (
    <section className="dashboard-loading card" aria-live="polite">
      <div className="loading-inline dashboard-loading-header">
        <span className="spinner spinner-large" aria-hidden="true" />
        <div>
          <p className="loading-title">Analyzing {query ? `“${query}”` : 'token or project'}</p>
          <p className="loading-copy">Building market context, risk view, signal interpretation, and fallback-safe research.</p>
        </div>
      </div>

      <div className="dashboard-loading-grid">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}
