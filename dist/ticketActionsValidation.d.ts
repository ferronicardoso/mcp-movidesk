export type ValidationResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function validateActions(actions: unknown): ValidationResult;
//# sourceMappingURL=ticketActionsValidation.d.ts.map