import type { ResearchResponse } from '../types/research';

type ResearchCardProps = {
  response: ResearchResponse;
};

export function ResearchCard({ response }: ResearchCardProps) {
  const researchBrief = response.result?.researchBrief;
  if (!researchBrief) return null;

  return (
    <section className="dashboard-card card">
      <div className="dashboard-card-header">
        <p className="dashboard-card-kicker">Research brief</p>
      </div>
      <h3 className="dashboard-headline">{researchBrief.headline}</h3>
      <p className="dashboard-card-copy">{researchBrief.body}</p>
    </section>
  );
}
