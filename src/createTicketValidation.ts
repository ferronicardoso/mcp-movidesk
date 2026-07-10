// Validações client-side para o tool create_ticket (POST /tickets).
//
// A API do Movidesk devolve HTTP 400 ("Ref. code is required" / "Customers
// is required") quando `createdBy`/`clients` estão ausentes ou vazios. Essa
// checagem de presença/formato é feita aqui, antes da chamada HTTP — ela NÃO
// garante que o `id` referenciado seja aceito pela API real (ex.: exigência
// de perfil de Cliente), apenas que a estrutura mínima está presente.

import { type ValidationResult, isRecord, validateActions } from './ticketActionsValidation.js';

export type { ValidationResult };

function validateCreatedBy(params: Record<string, unknown>): ValidationResult {
  const createdBy = params.createdBy;
  if (!isRecord(createdBy) || !createdBy.id) {
    return { ok: false, message: '"createdBy.id" é obrigatório para criar um ticket.' };
  }

  return { ok: true };
}

function validateClients(params: Record<string, unknown>): ValidationResult {
  const clients = params.clients;
  if (!Array.isArray(clients) || clients.length === 0) {
    return { ok: false, message: '"clients" deve ser um array com ao menos um item (com "id").' };
  }

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    if (!isRecord(client) || !client.id) {
      return { ok: false, message: `clients[${i}].id é obrigatório.` };
    }
  }

  return { ok: true };
}

export function validateCreateTicketPayload(params: Record<string, unknown>): ValidationResult {
  const createdByResult = validateCreatedBy(params);
  if (!createdByResult.ok) {
    return createdByResult;
  }

  const clientsResult = validateClients(params);
  if (!clientsResult.ok) {
    return clientsResult;
  }

  if ('actions' in params) {
    const actionsResult = validateActions(params.actions);
    if (!actionsResult.ok) {
      return actionsResult;
    }
  }

  return { ok: true };
}
