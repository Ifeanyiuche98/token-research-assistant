import type { Sector } from '../types/research';

function includesAny(values: string[], keywords: string[]) {
  return values.some((value) => keywords.some((keyword) => value.includes(keyword)));
}

function buildValues(categories: string[], name?: string | null, description?: string | null) {
  const categoryValues = categories.map((category) => category.toLowerCase());
  const fallbackText = `${name ?? ''} ${description ?? ''}`.toLowerCase();
  return {
    categoryValues,
    fallbackText,
    allValues: [...categoryValues, fallbackText]
  };
}

function hasDexOnlyMarker(categoryValues: string[]) {
  return includesAny(categoryValues, ['dex / unverified']);
}

function isLayer1Category(categoryValues: string[]) {
  return includesAny(categoryValues, [
    'smart contract platform',
    'layer 1',
    'layer 1 (l1)',
    'proof of work',
    'proof of stake',
    'bitcoin ecosystem',
    'solana ecosystem'
  ]);
}

export function mapToSector(categories: string[], name?: string | null, description?: string | null): Sector {
  const { categoryValues, fallbackText, allValues } = buildValues(categories, name, description);
  const dexOnly = hasDexOnlyMarker(categoryValues);

  if (includesAny(allValues, ['oracle', 'interoperability', 'cross-chain', 'data availability', 'middleware', 'infrastructure'])) {
    return 'Infrastructure';
  }

  if (includesAny(allValues, ['payments', 'payment network', 'cross-border payments', 'remittance', 'transfer of value', 'currencies and assets'])) {
    return 'Payments';
  }

  if (!dexOnly && includesAny(allValues, ['decentralized exchange', 'defi', 'dex', 'lending', 'yield', 'amm', 'automated market maker', 'swap'])) {
    return 'DeFi';
  }

  if (includesAny(allValues, ['gaming', 'gamefi', 'nft', 'metaverse'])) {
    return 'NFT / Gaming';
  }

  if (includesAny(allValues, ['artificial intelligence', ' ai ', 'ai,', 'ai.', 'ai/'])) {
    return 'AI';
  }

  if (includesAny(allValues, ['meme'])) {
    return 'Meme';
  }

  if (includesAny(allValues, ['stablecoin'])) {
    return 'Stablecoin';
  }

  if (!dexOnly && includesAny(allValues, ['exchange', 'cex', 'trading'])) {
    return 'Exchange';
  }

  if (isLayer1Category(categoryValues)) {
    return 'Layer 1';
  }

  if (includesAny([fallbackText], ['layer 1 blockchain', 'l1 blockchain', 'foundational blockchain network'])) {
    return 'Layer 1';
  }

  if (dexOnly) {
    return 'Unknown';
  }

  return 'Unknown';
}
