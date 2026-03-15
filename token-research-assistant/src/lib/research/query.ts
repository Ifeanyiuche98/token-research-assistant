export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;

export type QueryValidationResult =
  | {
      ok: true;
      raw: string;
      normalized: string;
    }
  | {
      ok: false;
      raw: string;
      normalized: string;
      message: string;
      detail: string;
    };

export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function validateQuery(value: string): QueryValidationResult {
  const raw = value ?? '';
  const trimmed = raw.trim();
  const normalized = normalizeQuery(raw);

  if (!trimmed) {
    return {
      ok: false,
      raw,
      normalized,
      message: 'Please enter a token or project name before researching.',
      detail: `The q parameter must be a non-empty string between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`
    };
  }

  if (trimmed.length < MIN_QUERY_LENGTH || trimmed.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      raw,
      normalized,
      message: `Please enter between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`,
      detail: `The q parameter must be a non-empty string between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`
    };
  }

  return {
    ok: true,
    raw: trimmed,
    normalized
  };
}
