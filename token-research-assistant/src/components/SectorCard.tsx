import type { ResearchResponse, Sector } from '../types/research';

type SectorCardProps = {
  response: ResearchResponse;
};

function getSectorExplanation(sector: Sector) {
  switch (sector) {
    case 'Layer 1':
      return 'Foundational blockchain infrastructure with network adoption, liquidity depth, and ecosystem expansion as key watchpoints.';
    case 'DeFi':
      return 'Driven by on-chain financial activity, protocol trust, liquidity durability, and smart contract execution quality.';
    case 'NFT / Gaming':
      return 'More sensitive to user growth, narrative cycles, creator demand, and sustained product engagement.';
    case 'AI':
      return 'Often narrative-heavy, so investors should separate real utility and data infrastructure from pure thematic momentum.';
    case 'Infrastructure':
      return 'Usually judged by integrations, developer adoption, reliability, and long-term positioning in the broader stack.';
    case 'Meme':
      return 'Community attention and momentum can dominate fundamentals, which raises volatility and sentiment dependence.';
    case 'Stablecoin':
      return 'Stability, reserves, redemption mechanics, and trust in collateral design matter most here.';
    case 'Exchange':
      return 'Exchange-linked assets are sensitive to platform growth, regulation, token utility, and trading activity.';
    default:
      return 'Sector classification is limited because category or metadata coverage is incomplete.';
  }
}

export function SectorCard({ response }: SectorCardProps) {
  const sector = response.result?.sector ?? 'Unknown';
  const sectorIntelligence = response.result?.sectorIntelligence;

  return (
    <section className="dashboard-card card">
      <div className="dashboard-card-header dashboard-card-header-inline">
        <p className="dashboard-card-kicker">Sector intelligence</p>
        <span className="sector-badge dashboard-sector-badge">{sector}</span>
      </div>

      <p className="dashboard-card-copy">{sectorIntelligence?.profile ?? getSectorExplanation(sector)}</p>
    </section>
  );
}
