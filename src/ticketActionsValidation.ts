// Validação client-side do campo `actions`, compartilhada entre create_ticket
// e update_ticket.
//
// A API do Movidesk devolve erros genéricos (500 em PATCH, 400 em POST) em
// vez de uma mensagem de validação clara quando um item de `actions` não
// tem `id` explícito, ou é uma ação nova (id === 0) sem `createdBy.id`.
// Essa regra é checada aqui, antes da chamada HTTP, para falhar cedo com
// uma mensagem acionável.

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateActions(actions: unknown): ValidationResult {
  if (!Array.isArray(actions)) {
    return { ok: false, message: '"actions" deve ser um array de ações.' };
  }

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (!isRecord(action) || typeof action.id !== 'number') {
      return {
        ok: false,
        message: `actions[${i}].id é obrigatório (use 0 para registrar uma ação/nota nova).`,
      };
    }

    if (action.id === 0) {
      const createdBy = action.createdBy;
      if (!isRecord(createdBy) || !createdBy.id) {
        return {
          ok: false,
          message: `actions[${i}].createdBy.id é obrigatório para ações novas (id: 0).`,
        };
      }
    }
  }

  return { ok: true };
}
