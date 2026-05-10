import type { CompareResponse, GladysV2Insight } from '../types/compare';
export type GladysV2ValidationResult = {
    ok: true;
    insight: GladysV2Insight;
} | {
    ok: false;
    reason: string;
};
export declare function validateGladysV2Insight(candidate: unknown, comparison: CompareResponse): GladysV2ValidationResult;
