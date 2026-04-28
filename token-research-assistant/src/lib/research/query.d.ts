export declare const MIN_QUERY_LENGTH = 2;
export declare const MAX_QUERY_LENGTH = 100;
export declare const ETHEREUM_CONTRACT_ADDRESS_PATTERN: RegExp;
export type QueryValidationResult = {
    ok: true;
    raw: string;
    normalized: string;
} | {
    ok: false;
    raw: string;
    normalized: string;
    message: string;
    detail: string;
};
export declare function normalizeQuery(value: string): string;
export declare function isEthereumContractAddress(value: string): boolean;
export declare function validateQuery(value: string): QueryValidationResult;
