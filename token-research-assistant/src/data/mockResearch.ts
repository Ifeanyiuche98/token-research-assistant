import type { ResearchNote } from '../types/research';

const mockNotes: Record<string, ResearchNote> = {
  bitcoin: {
    project: 'Bitcoin',
    summary: 'Bitcoin is the earliest and best-known cryptocurrency, focused on digital scarcity and peer-to-peer value transfer.',
    useCase: 'Used as a store of value, settlement asset, and censorship-resistant payment network.',
    risks: 'Volatility, regulatory pressure, custody mistakes, and market sentiment shifts remain key risks.',
    ecosystemNotes: 'Bitcoin has the largest brand recognition in crypto and a strong ecosystem of wallets, exchanges, and infrastructure.'
  },
  ethereum: {
    project: 'Ethereum',
    summary: 'Ethereum is a smart contract platform that supports decentralized applications and on-chain assets.',
    useCase: 'Used for DeFi, NFTs, DAOs, token issuance, and broader programmable blockchain applications.',
    risks: 'Smart contract bugs, network congestion, protocol competition, and regulation can affect adoption.',
    ecosystemNotes: 'Ethereum has one of the deepest developer ecosystems and a wide range of Layer 2 and tooling support.'
  }
};

export function getMockResearchNote(query: string): ResearchNote {
  const normalized = query.trim().toLowerCase();

  return (
    mockNotes[normalized] ?? {
      project: query.trim(),
      summary: `${query.trim()} appears to be a token or project worth researching further before any decision-making.`,
      useCase: 'Its main use case should be validated by checking the official docs, product utility, and token design.',
      risks: 'Common risks include low liquidity, unclear token utility, weak governance, security issues, and hype-driven price action.',
      ecosystemNotes: 'Review the project website, community activity, exchange listings, partnerships, and developer traction for more context.'
    }
  );
}
