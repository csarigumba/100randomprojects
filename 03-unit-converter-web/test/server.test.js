import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { server } from '../src/server.js';

server.listen(0);
await once(server, 'listening');
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

test('GET / serves the page with three sections', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/html/);
  const html = await res.text();
  for (const f of ['length', 'weight', 'temperature']) assert.match(html, new RegExp(`<section id="${f}"`));
});

test('GET /convert.js serves the module', async () => {
  const res = await fetch(`${base}/convert.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/javascript/);
});

test('unknown path is 404', async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
});
