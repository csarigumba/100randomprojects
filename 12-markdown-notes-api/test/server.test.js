import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { connect } from 'node:net';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { build } from '../src/server.js';

async function start(t) {
  const server = build({ dbPath: ':memory:' }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const { port } = server.address();
  const req = (path, { method = 'GET', body } = {}) =>
    fetch(`http://127.0.0.1:${port}${path}`, { method, body: typeof body === 'object' ? JSON.stringify(body) : body });
  return { req, port };
}

test('create, list, read, html, delete', async (t) => {
  const { req } = await start(t);

  let res = await req('/notes');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);

  res = await req('/notes', { method: 'POST', body: { title: 'First', markdown: 'hello' } });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('content-type'), 'application/json');
  const first = await res.json();
  assert.deepEqual(Object.keys(first), ['id', 'title', 'createdAt']);
  assert.equal(first.title, 'First');
  assert.equal(first.createdAt, new Date(first.createdAt).toISOString());

  res = await req('/notes', { method: 'POST', body: { title: 'Second', markdown: 'world' } });
  const second = await res.json();

  res = await req('/notes?x=1');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [second, first]);

  res = await req(`/notes/${first.id}`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ...first, markdown: 'hello' });

  res = await req(`/notes/${first.id}/html`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.match(await res.text(), /hello/);

  res = await req(`/notes/${first.id}`, { method: 'DELETE' });
  assert.equal(res.status, 204);
  assert.equal(await res.text(), '');
  for (const [method, path] of [['GET', `/notes/${first.id}`], ['GET', `/notes/${first.id}/html`], ['DELETE', `/notes/${first.id}`], ['GET', '/notes/999']]) {
    res = await req(path, { method });
    assert.equal(res.status, 404, `${method} ${path}`);
    assert.deepEqual(await res.json(), { error: 'Not found' });
  }
  res = await req('/notes');
  assert.deepEqual(await res.json(), [second]);
});

test('rejects invalid bodies with 400', async (t) => {
  const { req } = await start(t);
  const bad = [
    'not json',
    '',
    'null',
    '[]',
    {},
    { title: 'a' },
    { markdown: 'a' },
    { title: '', markdown: 'a' },
    { title: 'a', markdown: '   ' },
    { title: 1, markdown: 'a' },
    { title: 'a', markdown: ['a'] },
    { title: 'a', markdown: 'a'.repeat(1024 * 1024 + 1) },
  ];
  for (const body of bad) {
    const res = await req('/notes', { method: 'POST', body });
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 50));
    assert.equal(typeof (await res.json()).error, 'string');
  }
  assert.deepEqual(await (await req('/notes')).json(), []);
});

test('unknown routes return 404', async (t) => {
  const { req } = await start(t);
  for (const [method, path] of [['GET', '/'], ['PUT', '/notes'], ['DELETE', '/notes'], ['GET', '/notes/abc'], ['POST', '/notes/1'], ['GET', '/notes/1/html/x']]) {
    const res = await req(path, { method });
    assert.equal(res.status, 404, `${method} ${path}`);
    assert.deepEqual(await res.json(), { error: 'Not found' });
  }
});

test('client aborting mid-upload does not crash the server', async (t) => {
  const { req, port } = await start(t);
  const socket = connect(port, '127.0.0.1');
  await once(socket, 'connect');
  socket.write('POST /notes HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: 100000\r\n\r\n{"title":"a');
  await sleep(20);
  socket.destroy();
  await sleep(50);
  const res = await req('/notes', { method: 'POST', body: { title: 'a', markdown: 'b' } });
  assert.equal(res.status, 201);
});

test('invalid PORT exits 1 naming PORT', () => {
  const server = join(import.meta.dirname, '..', 'src', 'server.js');
  for (const port of ['abc', '-1', '65536', '1.5']) {
    const r = spawnSync(process.execPath, [server], { env: { ...process.env, PORT: port }, encoding: 'utf8' });
    assert.equal(r.status, 1, port);
    assert.match(r.stderr, new RegExp(`Invalid PORT: ${port.replace('.', '\\.')}`));
  }
});
