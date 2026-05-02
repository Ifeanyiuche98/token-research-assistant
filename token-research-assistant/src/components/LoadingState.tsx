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

function RiskSkeletonCard() {
  return (
    <div className="dashboard-skeleton-card risk-skeleton-card" aria-hidden="true">
      <div className="risk-skeleton-top">
        <div className="dashboard-skeleton-line dashboard-skeleton-line-short" />
        <div className="risk-skeleton-badge" />
      </div>
      <div className="risk-skeleton-main">
        <div className="risk-skeleton-ring" />
        <div className="risk-skeleton-copy">
          <div className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          <div className="dashboard-skeleton-line" />
          <div className="dashboard-skeleton-line dashboard-skeleton-line-medium" />
        </div>
      </div>
      <div className="risk-skeleton-flags">
        <div className="dashboard-skeleton-line" />
        <div className="dashboard-skeleton-line dashboard-skeleton-line-medium" />
        <div className="dashboard-skeleton-line dashboard-skeleton-line-short" />
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
        <RiskSkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}
