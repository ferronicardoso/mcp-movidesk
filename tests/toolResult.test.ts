import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toText, toError } from '../src/toolResult.js';

test('toText com resultado undefined (ex.: PATCH sem corpo) não quebra o content do MCP', () => {
  const result = toText(undefined);
  assert.equal(typeof result.content[0].text, 'string');
});

test('toText com resultado presente serializa em JSON', () => {
  const result = toText({ id: '1' });
  assert.deepEqual(JSON.parse(result.content[0].text), { id: '1' });
});

test('toError marca isError e inclui a mensagem', () => {
  const result = toError('algo deu errado');
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /algo deu errado/);
});
