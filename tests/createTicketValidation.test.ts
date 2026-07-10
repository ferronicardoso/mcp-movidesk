import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCreateTicketPayload } from '../src/createTicketValidation.js';

test('sem createdBy é rejeitado', () => {
  const result = validateCreateTicketPayload({
    type: 1,
    subject: 'Assunto',
    clients: [{ id: '1' }],
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /createdBy\.id/);
  }
});

test('sem clients é rejeitado', () => {
  const result = validateCreateTicketPayload({
    type: 1,
    subject: 'Assunto',
    createdBy: { id: '65' },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /clients/);
  }
});

test('clients vazio é rejeitado', () => {
  const result = validateCreateTicketPayload({
    type: 1,
    subject: 'Assunto',
    createdBy: { id: '65' },
    clients: [],
  });
  assert.equal(result.ok, false);
});

test('clients com item sem id é rejeitado', () => {
  const result = validateCreateTicketPayload({
    type: 1,
    subject: 'Assunto',
    createdBy: { id: '65' },
    clients: [{ businessName: 'Sem id' }],
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /clients\[0\]\.id/);
  }
});

test('actions inválido no create_ticket também é rejeitado', () => {
  const result = validateCreateTicketPayload({
    type: 1,
    subject: 'Assunto',
    createdBy: { id: '65' },
    clients: [{ id: '1' }],
    actions: [{ type: 1, description: 'nota sem id' }],
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /actions\[0\]\.id/);
  }
});

test('payload estruturalmente válido é aceito', () => {
  const result = validateCreateTicketPayload({
    type: 1,
    subject: 'Assunto',
    createdBy: { id: '65' },
    clients: [{ id: '1' }],
    actions: [{ id: 0, type: 1, description: 'nota', createdBy: { id: '65' } }],
  });
  assert.deepEqual(result, { ok: true });
});
