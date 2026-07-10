import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MOVIDESK_TOKEN = 'test-token';

const { handleUpdateTicket } = await import('../src/updateTicketHandler.js');

type FakeResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function fakeResponse(status: number, body: unknown): FakeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  };
}

test('payload inválido não chama a API do Movidesk', async () => {
  const originalFetch = global.fetch;
  let called = false;
  global.fetch = (async () => {
    called = true;
    return fakeResponse(200, {});
  }) as unknown as typeof fetch;

  try {
    const result = await handleUpdateTicket({
      id: 1,
      actions: [{ type: 1, description: 'nota sem id' }],
    });

    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /actions\[0\]\.id/);
    assert.equal(called, false, 'a API do Movidesk não deveria ter sido chamada');
  } finally {
    global.fetch = originalFetch;
  }
});

test('payload válido chama a API do Movidesk com os argumentos corretos', async () => {
  const originalFetch = global.fetch;
  let capturedUrl: string | undefined;
  let capturedBody: string | undefined;
  global.fetch = (async (url: string, init?: RequestInit) => {
    capturedUrl = url;
    capturedBody = init?.body as string;
    return fakeResponse(200, { id: '1', subject: 'Novo assunto' });
  }) as unknown as typeof fetch;

  try {
    const result = await handleUpdateTicket({ id: 1, subject: 'Novo assunto' });

    assert.equal(result.isError, undefined);
    assert.match(capturedUrl ?? '', /\/tickets\?/);
    assert.match(capturedUrl ?? '', /id=1(&|$)/);
    assert.deepEqual(JSON.parse(capturedBody ?? '{}'), { subject: 'Novo assunto' });
  } finally {
    global.fetch = originalFetch;
  }
});
