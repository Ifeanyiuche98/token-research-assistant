import test from 'node:test';
import assert from 'node:assert/strict';
import compareHandler from '../api/compare.js';

async function callCompare(query) {
  const result = {
    statusCode: 500,
    headers: {},
    body: null
  };

  const req = { query };
  const res = {
    status(code) {
      result.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      result.headers[name.toLowerCase()] = value;
      return this;
    },
    json(body) {
      result.body = body;
      return body;
    }
  };

  await compareHandler(req, res);
  return result;
}

test('compare API returns shared compare fields used by the compare UI', async () => {
  const response = await callCompare({ a: 'WKC', b: 'CREPE' });

  assert.equal(response.statusCode, 200);
  assert.ok(response.body);
  assert.equal(typeof response.body.meta?.generatedAt, 'string');
  assert.ok(response.body.left);
  assert.ok(response.body.right);
  assert.ok(response.body.comparativeIntelligence, 'expected comparativeIntelligence in compare API response');
  assert.ok(Array.isArray(response.body.comparativeIntelligence.items));
  assert.ok(response.body.gladysInsight, 'expected gladysInsight in compare API response');
  assert.equal(typeof response.body.gladysInsight.headline, 'string');
  assert.equal(typeof response.body.gladysInsight.verdict, 'string');
});
