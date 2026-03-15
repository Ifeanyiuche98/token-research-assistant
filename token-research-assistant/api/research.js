import { resolveResearch } from '../src/lib/research/endpoint';

export default async function handler(req, res) {
  const queryValue = typeof req.query?.q === 'string' ? req.query.q : '';
  const { statusCode, body } = await resolveResearch(queryValue);

  res.status(statusCode).json(body);
}
