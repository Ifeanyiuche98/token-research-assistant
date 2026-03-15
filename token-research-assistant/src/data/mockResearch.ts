import type { ResearchNote } from '../types/research';

type ResearchProfile = {
  project: string;
  aliases: string[];
  summary: string;
  useCase: string;
  risks: string;
  ecosystemNotes: string;
};

const researchProfiles: ResearchProfile[] = [
  {
    project: 'Bitcoin',
    aliases: ['bitcoin', 'btc'],
    summary:
      'Bitcoin is the oldest major cryptocurrency and is primarily positioned as a scarce digital asset and decentralized settlement network.',
    useCase:
      'Most commonly used as a store of value, treasury asset, long-term portfolio holding, and base-layer payment rail for simple value transfer.',
    risks:
      'Price volatility, regulation, self-custody mistakes, energy-policy criticism, and macro sentiment can all affect adoption and confidence.',
    ecosystemNotes:
      'Bitcoin has the deepest liquidity in crypto, strong institutional recognition, and a mature ecosystem of wallets, exchanges, custody providers, and infrastructure tools.'
  },
  {
    project: 'Ethereum',
    aliases: ['ethereum', 'eth'],
    summary:
      'Ethereum is a general-purpose blockchain for smart contracts and decentralized applications, making it one of the core platforms in crypto.',
    useCase:
      'Used for DeFi, stablecoins, NFTs, token launches, DAOs, on-chain identity experiments, and broader programmable blockchain activity.',
    risks:
      'Smart contract exploits, network fees during busy periods, shifting regulation, and competition from faster or cheaper chains remain relevant risks.',
    ecosystemNotes:
      'Ethereum has one of the largest developer communities, broad wallet and tooling support, and an active Layer 2 ecosystem that expands scalability.'
  },
  {
    project: 'Solana',
    aliases: ['solana', 'sol'],
    summary:
      'Solana is a high-throughput blockchain designed for fast transactions and lower fees, with a focus on consumer-scale crypto applications.',
    useCase:
      'Often used for payments, DeFi, NFTs, memecoin trading, consumer apps, and experiences that benefit from lower transaction costs.',
    risks:
      'Network stability concerns, ecosystem concentration, speculative activity, and execution risk around decentralization are common discussion points.',
    ecosystemNotes:
      'Solana has a fast-moving builder community, strong retail mindshare, active wallet adoption, and a growing ecosystem of trading and consumer products.'
  },
  {
    project: 'Chainlink',
    aliases: ['chainlink', 'link'],
    summary:
      'Chainlink is a decentralized oracle network focused on bringing off-chain data, computation, and interoperability into blockchain applications.',
    useCase:
      'Used to power price feeds, automation, cross-chain messaging, and external data delivery for DeFi protocols and other smart contract systems.',
    risks:
      'Adoption can depend on protocol integrations, token value capture can be debated, and competition in oracle or interoperability infrastructure remains a factor.',
    ecosystemNotes:
      'Chainlink is deeply integrated across DeFi and is widely recognized as core middleware for many blockchain-based applications.'
  },
  {
    project: 'Uniswap',
    aliases: ['uniswap', 'uni'],
    summary:
      'Uniswap is a decentralized exchange protocol best known for automated market making and permissionless token trading on-chain.',
    useCase:
      'Used for spot token swaps, liquidity provision, price discovery, and serving as trading infrastructure for other crypto applications.',
    risks:
      'Liquidity can move quickly, governance outcomes may affect direction, regulation of token trading venues may matter, and competitors can pressure market share.',
    ecosystemNotes:
      'Uniswap is one of the most recognized DeFi brands and has helped define the user experience for on-chain token trading across Ethereum-related ecosystems.'
  }
];

function normalizeInput(value: string) {
  return value.trim().toLowerCase();
}

function findProfile(query: string) {
  const normalized = normalizeInput(query);

  return researchProfiles.find((profile) =>
    profile.aliases.some((alias) => alias === normalized || profile.project.toLowerCase() === normalized)
  );
}

function buildKnownNote(profile: ResearchProfile, query: string): ResearchNote {
  return {
    project: profile.project,
    summary: profile.summary,
    useCase: profile.useCase,
    risks: profile.risks,
    ecosystemNotes: profile.ecosystemNotes,
    matchedOn: query.trim(),
    aliases: profile.aliases,
    isFallback: false
  };
}

function buildFallbackNote(query: string): ResearchNote {
  const cleaned = query.trim();

  return {
    project: cleaned,
    summary:
      `${cleaned} is not in the built-in research set yet, so this note should be treated as a cautious starting point rather than a confident profile.`,
    useCase:
      'The first thing to confirm is what the project actually does: product utility, target users, token role, and whether the token is essential to the system.',
    risks:
      'Unknown projects can carry elevated risk from thin liquidity, weak documentation, unclear tokenomics, low security maturity, and hype-driven narratives.',
    ecosystemNotes:
      'Before trusting the project, review the official site, docs, social channels, exchange presence, on-chain activity, and whether developers or users appear genuinely active.',
    matchedOn: cleaned,
    aliases: [],
    isFallback: true
  };
}

export function getResearchNote(query: string): ResearchNote {
  const profile = findProfile(query);

  if (profile) {
    return buildKnownNote(profile, query);
  }

  return buildFallbackNote(query);
}

export const supportedProjects = researchProfiles.map((profile) => profile.project);
