import test from 'node:test';
import assert from 'node:assert/strict';
import { requestJSON, RequestError } from '../lib/client-request.ts';

test('successful save returns confirmed state', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ revision: 2 }));
  assert.deepEqual(await requestJSON('/api/state', { method: 'POST' }), { revision: 2 });
});
test('a stalled save is bounded and aborted without retrying', async t => {
  let calls = 0;
  let signal: AbortSignal | undefined;
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    calls++;
    signal = init.signal!;
    return new Promise(() => {});
  });
  await assert.rejects(requestJSON('/api/state', { method: 'POST' }, 20), /too long to confirm/);
  assert.equal(signal?.aborted, true);
  assert.equal(calls, 1);
});
test('a stalled response body also stops loading', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({
    status: 200, ok: true, headers: new Headers({ 'content-type': 'application/json' }),
    json: () => new Promise(() => {}),
  }));
  await assert.rejects(requestJSON('/api/state', {}, 20), /too long/);
});
test('expired sessions produce an actionable authentication error even with an HTML body', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Sign in', { status: 401 }));
  await assert.rejects(requestJSON('/api/state'), e => e instanceof RequestError && e.status === 401 && /Sign in/.test(e.message));
});
test('revision conflicts retain the server error without retrying the mutation', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Newer progress exists' }, { status: 409 }));
  await assert.rejects(requestJSON('/api/state', { method: 'POST' }), /Newer progress/);
  assert.equal(fetch.mock.callCount(), 1);
});
test('HTML gateway errors do not surface JSON parse errors', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Unavailable</html>', { status: 503 }));
  await assert.rejects(requestJSON('/api/state'), /server could not confirm/);
});
