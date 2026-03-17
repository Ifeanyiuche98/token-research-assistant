import type { Sector } from '../types/research';

function includesAny(values: string[], keywords: string[]) {
  return values.some((value) => keywords.some((keyword) => value.includes(keyword)));
}

export function mapToSector(categories: string[], name?: string | null, description?: string | null): Sector {
  const categoryValues = categories.map((category) => category.toLowerCase());
  const fallbackText = `${name ?? ''} ${description ?? ''}`.toLowerCase();
  const allValues = [...categoryValues, fallbackText];

  if (includesAny(allValues, ['smart contract platform', 'layer 1', 'blockchain'])) {
    return 'Layer 1';
  }

  if (includesAny(allValues, ['decentralized exchange', 'defi', 'dex', 'lending', 'yield'])) {
    return 'DeFi';
  }

  if (includesAny(allValues, ['gaming', 'gamefi', 'nft', 'metaverse'])) {
    return 'NFT / Gaming';
  }

  if (includesAny(allValues, ['artificial intelligence', ' ai ', 'ai,', 'ai.', 'ai/'])) {
    return 'AI';
  }

  if (includesAny(allValues, ['infrastructure', 'oracle', 'interoperability', 'data'])) {
    return 'Infrastructure';
  }

  if (includesAny(allValues, ['meme'])) {
    return 'Meme';
  }

  if (includesAny(allValues, ['stablecoin'])) {
    return 'Stablecoin';
  }

  if (includesAny(allValues, ['exchange', 'cex', 'trading'])) {
    return 'Exchange';
  }

  return 'Unknown';
}
