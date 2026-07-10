// Validações client-side para o tool update_ticket (PATCH /tickets).
//
// Além da validação de `actions` (ver ticketActionsValidation.ts), a API do
// Movidesk exige que `owner` e `ownerTeam` sejam atualizados juntos — enviar
// só um deles causa HTTP 500 genérico em vez de um erro de validação claro.

import { type ValidationResult, validateActions } from './ticketActionsValidation.js';

export type { ValidationResult };

function validateOwner(params: Record<string, unknown>): ValidationResult {
  const hasOwner = 'owner' in params;
  const hasOwnerTeam = 'ownerTeam' in params;

  if (hasOwner !== hasOwnerTeam) {
    return {
      ok: false,
      message: '"owner" e "ownerTeam" devem ser atualizados juntos: envie os dois campos ou nenhum.',
    };
  }

  return { ok: true };
}

export function validateUpdateTicketPayload(params: Record<string, unknown>): ValidationResult {
  if ('actions' in params) {
    const result = validateActions(params.actions);
    if (!result.ok) {
      return result;
    }
  }

  return validateOwner(params);
}
