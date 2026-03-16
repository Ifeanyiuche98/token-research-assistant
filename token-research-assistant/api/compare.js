import researchHandler from './research.js';

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
      left: left.body,
      right: right.body,
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
