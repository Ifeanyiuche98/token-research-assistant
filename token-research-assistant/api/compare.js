import researchHandler from './research.js';
import { calculateRiskAnalysis } from '../src/utils/calculateRiskAnalysis.js';
import { generateSignalInterpretation } from '../src/utils/generateSignalInterpretation.js';

function json(res, statusCode, body) {
  res.status(statusCode);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.json(body);
}

function getQueryValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return '';
}

function buildUnknownRisk() {
  return {
    level: 'unknown',
    score: null,
    summary: 'Market risk is unavailable because live market data could not be loaded for this result.',
    signals: [
      {
        key: 'missing_market_data',
        label: 'Live market data',
        value: 'Unavailable in fallback mode',
        impact: 'medium'
      }
    ]
  };
}

function buildNeutralSignalInterpretation() {
  return {
    summary: 'Signal interpretation is limited because live market data is unavailable for this result.',
    tone: 'neutral',
    signals: [
      {
        key: 'missing_data',
        label: 'Incomplete market data',
        detail: 'Live market fields are unavailable in fallback mode, so only limited interpretation is possible.',
        tone: 'neutral'
      }
    ]
  };
}

function ensureRiskOnResponse(response) {
  if (!response?.result) {
    return response;
  }

  if (response.result.risk) {
    return response;
  }

  const market = response.result.market;
  const hasAnyMarketData = Boolean(
    market &&
      [market.priceUsd, market.marketCapUsd, market.fullyDilutedValuationUsd, market.volume24hUsd, market.change24hPct, market.marketCapRank, market.lastUpdated].some(
        (value) => value !== null
      )
  );

  response.result.risk = hasAnyMarketData ? calculateRiskAnalysis(market) : buildUnknownRisk();
  return response;
}

function ensureSignalInterpretationOnResponse(response) {
  if (!response?.result) {
    return response;
  }

  if (response.result.signalInterpretation) {
    return response;
  }

  const market = response.result.market;
  const risk = response.result.risk ?? buildUnknownRisk();
  const hasAnyMarketData = Boolean(
    market &&
      [market.priceUsd, market.marketCapUsd, market.fullyDilutedValuationUsd, market.volume24hUsd, market.change24hPct, market.marketCapRank, market.lastUpdated].some(
        (value) => value !== null
      )
  );

  response.result.signalInterpretation = hasAnyMarketData ? generateSignalInterpretation(market, risk) : buildNeutralSignalInterpretation();
  return response;
}

async function invokeResearch(query) {
  const result = {
    statusCode: 500,
    body: null
  };

  const req = {
    query: {
      q: query
    }
  };

  const res = {
    status(code) {
      result.statusCode = code;
      return this;
    },
    setHeader() {
      return this;
    },
    json(body) {
      result.body = body;
      return body;
    }
  };

  await researchHandler(req, res);
  return result;
}

export default async function handler(req, res) {
  const leftQuery = getQueryValue(req.query?.a).trim();
  const rightQuery = getQueryValue(req.query?.b).trim();

  try {
    if (!leftQuery || !rightQuery) {
      return json(res, 400, {
        message: 'Please enter both tokens before comparing.'
      });
    }

    if (leftQuery.toLowerCase() === rightQuery.toLowerCase()) {
      return json(res, 400, {
        message: 'Choose two different tokens or projects to compare.'
      });
    }

    const [left, right] = await Promise.all([invokeResearch(leftQuery), invokeResearch(rightQuery)]);

    return json(res, 200, {
      left: ensureSignalInterpretationOnResponse(ensureRiskOnResponse(left.body)),
      right: ensureSignalInterpretationOnResponse(ensureRiskOnResponse(right.body)),
      meta: {
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return json(res, 500, {
      message: 'Unable to compare tokens right now.',
      error: {
        code: 'INTERNAL_ERROR',
        detail: error instanceof Error ? error.message : 'Unexpected server error.'
      },
      left: null,
      right: null,
      meta: {
        generatedAt: new Date().toISOString()
      }
    });
  }
}
