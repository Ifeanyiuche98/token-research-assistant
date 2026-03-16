import { resolveResearch } from './endpoint';
import { normalizeQuery } from './query';
export async function resolveComparison(leftQueryValue, rightQueryValue) {
    const leftTrimmed = leftQueryValue.trim();
    const rightTrimmed = rightQueryValue.trim();
    if (!leftTrimmed || !rightTrimmed) {
        return {
            statusCode: 400,
            body: {
                message: 'Please enter both tokens before comparing.'
            }
        };
    }
    if (normalizeQuery(leftTrimmed) === normalizeQuery(rightTrimmed)) {
        return {
            statusCode: 400,
            body: {
                message: 'Choose two different tokens or projects to compare.'
            }
        };
    }
    const [left, right] = await Promise.all([resolveResearch(leftTrimmed), resolveResearch(rightTrimmed)]);
    return {
        statusCode: 200,
        body: {
            left: left.body,
            right: right.body,
            meta: {
                generatedAt: new Date().toISOString()
            }
        }
    };
}
