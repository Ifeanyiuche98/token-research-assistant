import { resolveResearch } from './endpoint';
import { normalizeQuery } from './query';
import { generateComparativeIntelligence } from '../../utils/generateComparativeIntelligence';
import { generateGladysCompareInsight } from '../../utils/generateGladysCompareInsight';
import { generateGladysCompareInsightV2 } from '../../utils/generateGladysCompareInsightV2';
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
    const comparativeIntelligence = generateComparativeIntelligence(left.body, right.body);
    const baseComparison = {
        left: left.body,
        right: right.body,
        comparativeIntelligence,
        gladysInsight: null,
        gladysV2Insight: null,
        meta: {
            generatedAt: new Date().toISOString()
        }
    };
    const gladysInsight = generateGladysCompareInsight(baseComparison);
    const comparisonWithGladys = {
        ...baseComparison,
        gladysInsight
    };
    const gladysV2Insight = await generateGladysCompareInsightV2(comparisonWithGladys);
    return {
        statusCode: 200,
        body: {
            ...comparisonWithGladys,
            gladysV2Insight
        }
    };
}
