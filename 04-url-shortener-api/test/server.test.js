import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { connect } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { build } from '../src/server.js';

async function start(t) {
  const server = build({ dbPath: ':memory:' }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const { port } = server.address();
  const req = (path, { method = 'GET', body } = {}) =>
    fetch(`http://127.0.0.1:${port}${path}`, { method, body: typeof body === 'object' ? JSON.stringify(body) : body, redirect: 'manual' });
  return { req, port };
}

test('create, read, update, stats, redirect, delete', async (t) => {
  const { req } = await start(t);

  let res = await req('/shorten', { method: 'POST', body: { url: 'https://example.com/a' } });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('content-type'), 'application/json');
  const created = await res.json();
  assert.deepEqual(Object.keys(created), ['id', 'url', 'shortCode', 'createdAt', 'updatedAt']);
  assert.equal(created.url, 'https://example.com/a');
  assert.match(created.shortCode, /^[\w-]{6}$/);
  assert.equal(created.createdAt, new Date(created.createdAt).toISOString());
  const code = created.shortCode;

  res = await req(`/shorten/${code}`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), created);

  await sleep(5);
  res = await req(`/shorten/${code}`, { method: 'PUT', body: { url: 'https://example.com/b' } });
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.url, 'https://example.com/b');
  assert.equal(updated.createdAt, created.createdAt);
  assert.notEqual(updated.updatedAt, created.updatedAt);

  res = await req(`/shorten/${code}/stats`);
  assert.deepEqual(await res.json(), { ...updated, accessCount: 0 });

  for (let i = 0; i < 2; i++) {
    res = await req(`/${code}`);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), 'https://example.com/b');
    await res.body?.cancel();
  }
  res = await req(`/shorten/${code}/stats`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).accessCount, 2);

  res = await req(`/shorten/${code}`, { method: 'DELETE' });
  assert.equal(res.status, 204);
  assert.equal(await res.text(), '');
  for (const [method, path] of [['GET', `/shorten/${code}`], ['GET', `/shorten/${code}/stats`], ['GET', `/${code}`], ['DELETE', `/shorten/${code}`]]) {
    res = await req(path, { method });
    assert.equal(res.status, 404, `${method} ${path}`);
    assert.deepEqual(await res.json(), { error: 'Not found' });
  }
});

test('rejects invalid bodies with 400', async (t) => {
  const { req } = await start(t);
  const res0 = await req('/shorten', { method: 'POST', body: { url: 'https://example.com' } });
  const { shortCode } = await res0.json();
  const bad = [
    'not json',
    '',
    'null',
    {},
    { url: 123 },
    { url: ['https://example.com'] },
    { url: 'example.com' },
    { url: 'ftp://example.com' },
    { url: 'javascript:alert(1)' },
    { url: 'https://example.com/' + 'a'.repeat(9000) },
  ];
  for (const body of bad) {
    for (const [method, path] of [['POST', '/shorten'], ['PUT', `/shorten/${shortCode}`], ['PUT', '/shorten/unknown']]) {
      const res = await req(path, { method, body });
      assert.equal(res.status, 400, `${method} ${path} ${JSON.stringify(body).slice(0, 50)}`);
      assert.equal(typeof (await res.json()).error, 'string');
    }
  }
  const res = await req('/shorten/unknown', { method: 'PUT', body: { url: 'https://example.com' } });
  assert.equal(res.status, 404);
});

test('stores normalized url so newline and non-ASCII still redirect', async (t) => {
  const { req } = await start(t);
  for (const [raw, href] of [
    ['https://example.com/a\r\nb', 'https://example.com/ab'],
    ['https://example.com/über?q=ü', 'https://example.com/%C3%BCber?q=%C3%BC'],
  ]) {
    let res = await req('/shorten', { method: 'POST', body: { url: raw } });
    assert.equal(res.status, 201);
    const { url, shortCode } = await res.json();
    assert.equal(url, href);
    res = await req(`/${shortCode}`);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), href);
  }
});

test('unknown routes return 404', async (t) => {
  const { req } = await start(t);
  for (const [method, path] of [['GET', '/'], ['GET', '/shorten'], ['DELETE', '/shorten'], ['POST', '/abc'], ['GET', '/a/b']]) {
    const res = await req(path, { method });
    assert.equal(res.status, 404, `${method} ${path}`);
    assert.deepEqual(await res.json(), { error: 'Not found' });
  }
});

test('client aborting mid-upload does not crash the server', async (t) => {
  const { req, port } = await start(t);
  const socket = connect(port, '127.0.0.1');
  await once(socket, 'connect');
  socket.write('POST /shorten HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: 100000\r\n\r\n{"url":"https://exa');
  await sleep(20);
  socket.destroy();
  await sleep(50);
  const res = await req('/shorten', { method: 'POST', body: { url: 'https://example.com' } });
  assert.equal(res.status, 201);
});
