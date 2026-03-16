export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
export function normalizeQuery(value) {
    return value.trim().toLowerCase();
}
export function validateQuery(value) {
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
