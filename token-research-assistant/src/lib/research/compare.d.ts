import type { CompareResponse } from '../../types/compare';
export declare function resolveComparison(leftQueryValue: string, rightQueryValue: string): Promise<{
    statusCode: number;
    body: CompareResponse | {
        message: string;
    };
}>;
