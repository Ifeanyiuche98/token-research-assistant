import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/research.js';

const CONTRACT_CHAINS = ['ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 'avalanche'];

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    }
  };
}

function withMockFetch(router, fn) {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => router(String(url), options);
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      global.fetch = originalFetch;
    });
}

async function callResearch(query) {
  let statusCode = 200;
  let payload = null;

  await handler(
    { query: { q: query } },
    {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader() {},
      json(body) {
        payload = body;
        return body;
      }
    }
  );

  return { statusCode, body: payload };
}

test('symbol lookup stays on CoinGecko', async () => {
  await withMockFetch((url) => {
    if (url.includes('/search?query=BTC')) {
      return jsonResponse(200, {
        coins: [{ id: 'bitcoin', name: 'Bitcoin', symbol: 'btc' }]
      });
    }

    if (url.endsWith('/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false')) {
      return jsonResponse(200, {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
        categories: ['store of value'],
        description: { en: 'Bitcoin description' },
        market_data: {
          current_price: { usd: 100000 },
          market_cap: { usd: 1000000000 },
          fully_diluted_valuation: { usd: 1000000000 },
          total_volume: { usd: 25000000 },
          price_change_percentage_24h: 1.2
        },
        market_cap_rank: 1,
        links: { homepage: ['https://bitcoin.org'] },
        image: {}
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  }, async () => {
    const response = await callResearch('BTC');
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.result?.identity.source, 'coingecko');
    assert.equal(response.body.result?.fallback.used, false);
  });
});

test('supported contract stays on CoinGecko and gets low trust risk signals', async () => {
  const contract = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

  await withMockFetch((url) => {
    if (url.includes(`/coins/ethereum/contract/${encodeURIComponent(contract.toLowerCase())}`)) {
      return jsonResponse(200, {
        id: 'tether',
        name: 'Tether',
        symbol: 'usdt',
        categories: ['stablecoin'],
        description: { en: 'Tether description' },
        genesis_date: '2014-10-06',
        market_data: {
          current_price: { usd: 1 },
          market_cap: { usd: 100000000000 },
          fully_diluted_valuation: { usd: 100000000000 },
          total_volume: { usd: 50000000000 },
          price_change_percentage_24h: 0
        },
        market_cap_rank: 3,
        links: { homepage: ['https://tether.to'] },
        image: {}
      });
    }

    if (url.includes(`https://api.honeypot.is/v2/IsHoneypot?address=${encodeURIComponent(contract)}`)) {
      return jsonResponse(200, {
        honeypotResult: { isHoneypot: false },
        simulationResult: { buyTax: 0, sellTax: 0 }
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  }, async () => {
    const response = await callResearch(contract);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.result?.identity.source, 'coingecko');
    assert.equal(response.body.result?.identity.symbol, 'USDT');
    assert.equal(response.body.result?.fallback.used, false);
    assert.equal(response.body.result?.risk?.details?.honeypot, false);
    assert.equal(response.body.result?.risk?.details?.trustLabel, 'safe');
  });
});

test('DEX-only contract falls back to DEXScreener and adds trust-layer warnings', async () => {
  const contract = '0x5B5dee44552546ECEA05EDeA01DCD7Be7aa6144A';

  await withMockFetch((url) => {
    if (CONTRACT_CHAINS.some((chain) => url.includes(`/coins/${chain}/contract/${encodeURIComponent(contract.toLowerCase())}`))) {
      return jsonResponse(404, { error: 'coin not found' });
    }

    if (url.includes(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(contract.toLowerCase())}`)) {
      return jsonResponse(200, {
        pairs: [
          {
            pairAddress: '0xpair-low',
            priceUsd: '0.01',
            fdv: 123456,
            liquidity: { usd: 50 },
            volume: { h24: 1000 },
            priceChange: { h24: 5 },
            baseToken: { name: 'Test Dex Token', symbol: 'tdt' }
          },
          {
            pairAddress: '0xpair-best',
            priceUsd: '0.02',
            fdv: 654321,
            liquidity: { usd: 5000 },
            volume: { h24: 20000 },
            priceChange: { h24: 8 },
            pairCreatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            baseToken: { name: 'Test Dex Token', symbol: 'tdt' },
            info: {
              websites: [{ url: 'https://example.com' }],
              socials: [{ type: 'twitter', url: 'https://twitter.com/testdex' }]
            }
          }
        ]
      });
    }

    if (url.includes(`https://api.honeypot.is/v2/IsHoneypot?address=${encodeURIComponent(contract)}`)) {
      return jsonResponse(200, {
        honeypotResult: { isHoneypot: false },
        simulationResult: { buyTax: 2, sellTax: 4 }
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  }, async () => {
    const response = await callResearch(contract);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.result?.identity.source, 'dexscreener');
    assert.equal(response.body.result?.fallback.used, false);
    assert.equal(response.body.result?.market.marketCapUsd, null);
    assert.equal(response.body.result?.market.fullyDilutedValuationUsd, 654321);
    assert.equal(response.body.result?.market.liquidityUsd, 5000);
    assert.equal(response.body.result?.risk?.details?.liquidityRisk, 'high');
    assert.equal(response.body.result?.risk?.details?.volumeAnomaly, true);
    assert.equal(response.body.result?.risk?.details?.ageRisk, 'high');
    assert.equal(response.body.result?.risk?.details?.trustLabel, 'danger');
  });
});

test('honeypot-positive contract is marked as danger without breaking the response', async () => {
  const contract = '0x0000000000000000000000000000000000000009';

  await withMockFetch((url) => {
    if (CONTRACT_CHAINS.some((chain) => url.includes(`/coins/${chain}/contract/${encodeURIComponent(contract.toLowerCase())}`))) {
      return jsonResponse(404, { error: 'coin not found' });
    }

    if (url.includes(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(contract.toLowerCase())}`)) {
      return jsonResponse(200, {
        pairs: [
          {
            pairAddress: '0xpair-honey',
            priceUsd: '0.0001',
            fdv: 100000,
            liquidity: { usd: 1500 },
            volume: { h24: 9000 },
            pairCreatedAt: Date.now() - 24 * 60 * 60 * 1000,
            baseToken: { name: 'Honey Trap', symbol: 'HNY' }
          }
        ]
      });
    }

    if (url.includes(`https://api.honeypot.is/v2/IsHoneypot?address=${encodeURIComponent(contract)}`)) {
      return jsonResponse(200, {
        honeypotResult: { isHoneypot: true },
        simulationResult: { buyTax: 15, sellTax: 35 }
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  }, async () => {
    const response = await callResearch(contract);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.result?.identity.source, 'dexscreener');
    assert.equal(response.body.result?.risk?.details?.honeypot, true);
    assert.equal(response.body.result?.risk?.details?.trustLabel, 'danger');
    assert.equal(response.body.result?.risk?.level, 'high');
    assert.match(response.body.result?.risk?.summary ?? '', /Honeypot risk detected/);
  });
});

test('invalid contract falls back cleanly as not found', async () => {
  const contract = '0x0000000000000000000000000000000000000001';

  await withMockFetch((url) => {
    if (CONTRACT_CHAINS.some((chain) => url.includes(`/coins/${chain}/contract/${encodeURIComponent(contract.toLowerCase())}`))) {
      return jsonResponse(404, { error: 'coin not found' });
    }

    if (url.includes(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(contract.toLowerCase())}`)) {
      return jsonResponse(200, { pairs: [] });
    }

    if (url.includes(`/search?query=${contract}`)) {
      return jsonResponse(200, { coins: [] });
    }

    throw new Error(`Unexpected URL: ${url}`);
  }, async () => {
    const response = await callResearch(contract);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'fallback');
    assert.equal(response.body.result?.identity.source, 'local');
    assert.equal(response.body.result?.fallback.used, true);
    assert.equal(response.body.result?.fallback.reason, 'not_found');
    assert.match(response.body.message, /Contract was not found on CoinGecko or DEXScreener/);
    assert.equal(response.body.error?.code, 'NOT_FOUND');
  });
});

test('rate-limited contract lookup falls back with rate-limited classification', async () => {
  const contract = '0x0000000000000000000000000000000000000002';

  await withMockFetch((url) => {
    if (CONTRACT_CHAINS.some((chain) => url.includes(`/coins/${chain}/contract/${encodeURIComponent(contract.toLowerCase())}`))) {
      return jsonResponse(429, { status: { error_code: 429, error_message: 'rate limited' } });
    }

    if (url.includes(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(contract.toLowerCase())}`)) {
      return jsonResponse(200, { pairs: [] });
    }

    if (url.includes(`/search?query=${contract}`)) {
      return jsonResponse(200, { coins: [] });
    }

    throw new Error(`Unexpected URL: ${url}`);
  }, async () => {
    const response = await callResearch(contract);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'fallback');
    assert.equal(response.body.result?.fallback.reason, 'rate_limited');
    assert.match(response.body.message, /CoinGecko rate limit reached/);
    assert.equal(response.body.error?.code, 'RATE_LIMITED');
  });
});
