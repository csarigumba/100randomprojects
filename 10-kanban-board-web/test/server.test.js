import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { connect } from 'node:net';
import { server } from '../server.js';

let base;
before(async () => {
  server.listen(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test('GET / serves the page with three columns and the add form', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
  const html = await res.text();
  for (const h of ['<h2>To do</h2>', '<h2>Doing</h2>', '<h2>Done</h2>']) assert.ok(html.includes(h), h);
  for (const c of ['todo', 'doing', 'done']) assert.ok(html.includes(`data-column="${c}"`), c);
  assert.ok(html.includes('id="add-form"'));
  assert.ok(html.includes('<script type="module" src="/app.js">'));
});

for (const path of ['/app.js', '/board.js']) {
  test(`GET ${path} serves javascript`, async () => {
    const res = await fetch(base + path);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/javascript; charset=utf-8');
    await res.text();
  });
}

test('unknown path is 404', async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
  await res.text();
});

test('malformed absolute request target is 404 and server keeps serving', async () => {
  const sock = connect(server.address().port);
  sock.end('GET http://a:b:c/ HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n');
  let raw = '';
  for await (const chunk of sock) raw += chunk;
  assert.match(raw, /^HTTP\/1\.1 404/);
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  await res.text();
});
