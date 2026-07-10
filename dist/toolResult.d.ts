export type ToolResult = {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
};
export declare function toText(result: unknown): ToolResult;
export declare function toError(message: string): ToolResult;
//# sourceMappingURL=toolResult.d.ts.map