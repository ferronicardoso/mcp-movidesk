import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateActions } from '../src/ticketActionsValidation.js';

test('ação sem id é rejeitada', () => {
  const result = validateActions([{ type: 1, description: 'nota' }]);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /actions\[0\]\.id/);
  }
});

test('ação nova (id: 0) sem createdBy é rejeitada', () => {
  const result = validateActions([{ id: 0, type: 1, description: 'nota' }]);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /actions\[0\]\.createdBy\.id/);
  }
});

test('ação nova válida (id: 0 + createdBy.id) é aceita', () => {
  const result = validateActions([{ id: 0, type: 1, description: 'nota', createdBy: { id: '65' } }]);
  assert.deepEqual(result, { ok: true });
});

test('ação existente (id != 0) não exige createdBy', () => {
  const result = validateActions([{ id: 5, status: 'Resolvido' }]);
  assert.deepEqual(result, { ok: true });
});

test('actions que não é array é rejeitado', () => {
  const result = validateActions('não é um array');
  assert.equal(result.ok, false);
});
