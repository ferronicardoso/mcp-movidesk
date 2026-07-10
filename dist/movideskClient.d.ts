export type ODataParams = {
    $filter?: string;
    $select?: string;
    $expand?: string;
    $orderby?: string;
    $top?: number;
    $skip?: number;
};
export type QueryParams = ODataParams & Record<string, unknown>;
export declare class MovideskApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
export declare function get<T>(path: string, params?: QueryParams): Promise<T>;
export declare function post<T>(path: string, body: unknown, params?: QueryParams): Promise<T>;
export declare function patch<T>(path: string, body: unknown, params?: QueryParams): Promise<T>;
export declare function uploadFile<T>(path: string, filePath: string, params: QueryParams): Promise<T>;
//# sourceMappingURL=movideskClient.d.ts.map