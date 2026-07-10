export function toText(result) {
    const text = result === undefined ? 'OK (resposta sem corpo)' : JSON.stringify(result, null, 2);
    return { content: [{ type: 'text', text }] };
}
export function toError(message) {
    return { content: [{ type: 'text', text: `Erro: ${message}` }], isError: true };
}
//# sourceMappingURL=toolResult.js.map