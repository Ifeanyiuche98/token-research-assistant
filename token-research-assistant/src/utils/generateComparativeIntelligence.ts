import type { ComparisonInsightItem, ComparativeIntelligence } from '../types/compare';
import type { ResearchResponse } from '../types/research';

type BetterSide = ComparisonInsightItem['betterSide'];

type NumericComparisonConfig = {
  key: ComparisonInsightItem['key'];
  label: string;
  closeRatio?: number;
  closeDifference?: number;
  presentSideSummary: Record<'left' | 'right', string>;
  tieSummary: string;
  unknownSummary: string;
  preferLower?: boolean;
};

function getNumericValue(response: ResearchResponse, selector: (response: ResearchResponse) => number | null): number | null {
  const value = selector(response);
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isFallbackOrUnknown(response: ResearchResponse): boolean {
  return response.status !== 'live' || response.result?.fallback.used === true;
}

function compareNumericValues(leftValue: number | null, rightValue: number | null, config: NumericComparisonConfig, left: ResearchResponse, right: ResearchResponse): ComparisonInsightItem {
  const leftKnown = leftValue !== null;
  const rightKnown = rightValue !== null;

  if (!leftKnown && !rightKnown) {
    return {
      key: config.key,
      label: config.label,
      betterSide: 'unknown',
      summary: config.unknownSummary
    };
  }

  if (!leftKnown || !rightKnown) {
    const presentSide: 'left' | 'right' = leftKnown ? 'left' : 'right';
    const missingResponse = leftKnown ? right : left;

    if (isFallbackOrUnknown(missingResponse)) {
      return {
        key: config.key,
        label: config.label,
        betterSide: presentSide,
        summary: config.presentSideSummary[presentSide]
      };
    }

    return {
      key: config.key,
      label: config.label,
      betterSide: 'unknown',
      summary: config.unknownSummary
    };
  }

  const absoluteDifference = Math.abs(leftValue - rightValue);
  const maxValue = Math.max(Math.abs(leftValue), Math.abs(rightValue));
  const ratioDifference = maxValue === 0 ? 0 : absoluteDifference / maxValue;
  const withinRatio = typeof config.closeRatio === 'number' ? ratioDifference <= config.closeRatio : false;
  const withinAbsoluteDifference = typeof config.closeDifference === 'number' ? absoluteDifference <= config.closeDifference : false;

  if (withinRatio || withinAbsoluteDifference || leftValue === rightValue) {
    return {
      key: config.key,
      label: config.label,
      betterSide: 'tie',
      summary: config.tieSummary
    };
  }

  const betterSide = config.preferLower ? (leftValue < rightValue ? 'left' : 'right') : (leftValue > rightValue ? 'left' : 'right');

  return {
    key: config.key,
    label: config.label,
    betterSide,
    summary: config.presentSideSummary[betterSide]
  };
}

function buildLiquidityInsight(left: ResearchResponse, right: ResearchResponse): ComparisonInsightItem {
  return compareNumericValues(
    getNumericValue(left, (response) => response.result?.market.volume24hUsd ?? null),
    getNumericValue(right, (response) => response.result?.market.volume24hUsd ?? null),
    {
      key: 'liquidity',
      label: 'Liquidity',
      closeRatio: 0.1,
      presentSideSummary: {
        left: 'Left shows stronger liquidity based on higher 24h volume.',
        right: 'Right shows stronger liquidity based on higher 24h volume.'
      },
      tieSummary: 'Both assets show similar liquidity based on current 24h volume.',
      unknownSummary: 'Liquidity comparison is limited because market data is incomplete.'
    },
    left,
    right
  );
}

function buildSizeInsight(left: ResearchResponse, right: ResearchResponse): ComparisonInsightItem {
  return compareNumericValues(
    getNumericValue(left, (response) => response.result?.market.marketCapUsd ?? null),
    getNumericValue(right, (response) => response.result?.market.marketCapUsd ?? null),
    {
      key: 'size',
      label: 'Size',
      closeRatio: 0.1,
      presentSideSummary: {
        left: 'Left is larger by market capitalization.',
        right: 'Right is larger by market capitalization.'
      },
      tieSummary: 'Both assets are similar in size based on market capitalization.',
      unknownSummary: 'Size comparison is limited because market data is incomplete.'
    },
    left,
    right
  );
}

function buildStabilityInsight(left: ResearchResponse, right: ResearchResponse): ComparisonInsightItem {
  const leftMove = getNumericValue(left, (response) => {
    const value = response.result?.market.change24hPct;
    return value === null || value === undefined ? null : Math.abs(value);
  });
  const rightMove = getNumericValue(right, (response) => {
    const value = response.result?.market.change24hPct;
    return value === null || value === undefined ? null : Math.abs(value);
  });

  return compareNumericValues(
    leftMove,
    rightMove,
    {
      key: 'stability',
      label: 'Stability',
      closeDifference: 2,
      preferLower: true,
      presentSideSummary: {
        left: 'Left looks more stable based on smaller 24h price movement.',
        right: 'Right looks more stable based on smaller 24h price movement.'
      },
      tieSummary: 'Both assets show similar short-term price stability.',
      unknownSummary: 'Stability comparison is limited because recent price-move data is incomplete.'
    },
    left,
    right
  );
}

function buildSummary(items: ComparisonInsightItem[]): string {
  const unknownCount = items.filter((item) => item.betterSide === 'unknown').length;

  if (unknownCount >= 2) {
    return 'Comparison insight is limited because one or both assets are missing important market data.';
  }

  const leftWins = items.filter((item) => item.betterSide === 'left');
  const rightWins = items.filter((item) => item.betterSide === 'right');

  if (leftWins.length === 0 && rightWins.length === 0) {
    return 'The two assets look broadly similar across liquidity, size, and recent stability.';
  }

  if (leftWins.length > 0 && rightWins.length > 0) {
    return 'The two assets are mixed across liquidity, size, and recent stability.';
  }

  const winningSide = leftWins.length > 0 ? 'Left' : 'Right';
  const winningItems = (leftWins.length > 0 ? leftWins : rightWins).map((item) => item.key);
  const parts: string[] = [];

  if (winningItems.includes('liquidity') && winningItems.includes('size')) {
    parts.push(`${winningSide} appears stronger on liquidity and size`);
  } else {
    if (winningItems.includes('liquidity')) {
      parts.push(`${winningSide} appears stronger on liquidity`);
    }
    if (winningItems.includes('size')) {
      parts.push(`${winningSide} appears larger in market size`);
    }
  }

  const losingSide = winningSide === 'Left' ? 'right' : 'left';
  const stabilityItem = items.find((item) => item.key === 'stability');

  if (stabilityItem?.betterSide === 'tie') {
    parts.push('both look similar in recent price stability');
  } else if (stabilityItem?.betterSide === losingSide) {
    parts.push(`${losingSide} looks more stable in recent price movement`);
  } else if (stabilityItem?.betterSide === winningSide.toLowerCase()) {
    parts.push(`${winningSide.toLowerCase()} also looks more stable in recent price movement`);
  }

  if (parts.length === 0) {
    return 'The two assets are mixed across liquidity, size, and recent stability.';
  }

  const [first, ...rest] = parts;
  return rest.length ? `${first}, while ${rest.join(', and ')}.` : `${first}.`;
}

export function generateComparativeIntelligence(left: ResearchResponse, right: ResearchResponse): ComparativeIntelligence {
  const items = [buildLiquidityInsight(left, right), buildSizeInsight(left, right), buildStabilityInsight(left, right)];

  return {
    summary: buildSummary(items),
    items
  };
}
