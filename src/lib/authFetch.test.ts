import test from 'node:test';
import assert from 'node:assert/strict';
import { extractApiErrorMessage, parseJsonSafe } from './authFetch.ts';

test('parseJsonSafe safely handles HTML responses without throwing SyntaxError', async () => {
  const htmlRes = new Response('<html><head><title>502 Bad Gateway</title></head></html>', {
    status: 502,
    headers: { 'Content-Type': 'text/html' },
  });

  const parsed = await parseJsonSafe<{ error?: string }>(htmlRes);
  assert.equal(parsed.isJson, false);
  assert.equal(parsed.data, null);

  const message = extractApiErrorMessage(htmlRes, parsed, 'Login failed.');
  assert.equal(message, 'Authentication server error (HTTP 502). Please try again shortly.');
});

test('parseJsonSafe parses valid JSON error and success payloads cleanly', async () => {
  const errRes = new Response(JSON.stringify({ error: 'Invalid credentials.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
  const parsedErr = await parseJsonSafe<{ error?: string }>(errRes);
  assert.equal(parsedErr.isJson, true);
  assert.equal(parsedErr.data?.error, 'Invalid credentials.');
  assert.equal(extractApiErrorMessage(errRes, parsedErr, 'Fallback'), 'Invalid credentials.');

  const okRes = new Response(JSON.stringify({ token: 'tok', user: { id: 1 } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  const parsedOk = await parseJsonSafe<{ token: string; user: { id: number } }>(okRes);
  assert.equal(parsedOk.isJson, true);
  assert.equal(parsedOk.data?.token, 'tok');
  assert.equal(parsedOk.data?.user.id, 1);
});

test('extractApiErrorMessage surfaces clear 404 message when HTML 404 is returned', async () => {
  const notFoundHtml = new Response('<html><head><title>404 Not Found</title></head></html>', {
    status: 404,
    headers: { 'Content-Type': 'text/html' },
  });
  const parsed = await parseJsonSafe(notFoundHtml);
  assert.equal(parsed.isJson, false);
  assert.equal(
    extractApiErrorMessage(notFoundHtml, parsed, 'Login failed.'),
    'Authentication endpoint not found (404). Please refresh and try again.'
  );
});
