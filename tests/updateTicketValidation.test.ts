import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateUpdateTicketPayload } from '../src/updateTicketValidation.js';

test('ação nova sem id é rejeitada', () => {
  const result = validateUpdateTicketPayload({
    actions: [{ type: 1, description: 'nota' }],
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /actions\[0\]\.id/);
  }
});

test('ação nova (id: 0) sem createdBy é rejeitada', () => {
  const result = validateUpdateTicketPayload({
    actions: [{ id: 0, type: 1, description: 'nota' }],
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /actions\[0\]\.createdBy\.id/);
  }
});

test('ação nova válida (id: 0 + createdBy.id) é aceita', () => {
  const result = validateUpdateTicketPayload({
    actions: [{ id: 0, type: 1, description: 'nota', createdBy: { id: '65' } }],
  });
  assert.deepEqual(result, { ok: true });
});

test('ação existente (id != 0) não exige createdBy', () => {
  const result = validateUpdateTicketPayload({
    actions: [{ id: 5, status: 'Resolvido' }],
  });
  assert.deepEqual(result, { ok: true });
});

test('owner sem ownerTeam é rejeitado', () => {
  const result = validateUpdateTicketPayload({ owner: { id: '1364669101' } });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /owner.*ownerTeam/);
  }
});

test('ownerTeam sem owner é rejeitado', () => {
  const result = validateUpdateTicketPayload({ ownerTeam: 'Suporte ao Comprador' });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /owner.*ownerTeam/);
  }
});

test('owner e ownerTeam juntos são aceitos', () => {
  const result = validateUpdateTicketPayload({
    owner: { id: '1364669101' },
    ownerTeam: 'Suporte ao Comprador',
  });
  assert.deepEqual(result, { ok: true });
});

test('payload simples (subject) sem actions/owner/ownerTeam é aceito', () => {
  const result = validateUpdateTicketPayload({ subject: 'Novo assunto' });
  assert.deepEqual(result, { ok: true });
});
