import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { connect } from 'node:net';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { build } from '../src/server.js';

async function start(t) {
  const server = build({ dbPath: ':memory:' }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const { port } = server.address();
  const req = (path, { method = 'GET', body } = {}) =>
    fetch(`http://127.0.0.1:${port}${path}`, { method, body: typeof body === 'object' ? JSON.stringify(body) : body });
  const post = async (body) => (await req('/bookmarks', { method: 'POST', body })).json();
  return { req, post, port };
}

test('create, duplicate, update, delete', async (t) => {
  const { req } = await start(t);

  let res = await req('/bookmarks', { method: 'POST', body: { url: 'HTTPS://Nodejs.org', title: 'Node.js', tags: [' js', 'docs', 'js'] } });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('content-type'), 'application/json');
  const created = await res.json();
  assert.deepEqual(Object.keys(created), ['id', 'url', 'title', 'tags', 'createdAt']);
  assert.equal(typeof created.id, 'number');
  assert.equal(created.url, 'https://nodejs.org/');
  assert.deepEqual(created.tags, ['js', 'docs']);
  assert.equal(created.createdAt, new Date(created.createdAt).toISOString());

  res = await req('/bookmarks', { method: 'POST', body: { url: 'http://a.com/', title: 'A' } });
  assert.equal(res.status, 201);
  const a = await res.json();
  assert.deepEqual(a.tags, []);

  for (const url of ['https://nodejs.org/', 'HTTP://A.com']) {
    res = await req('/bookmarks', { method: 'POST', body: { url, title: 'dup' } });
    assert.equal(res.status, 409, url);
    assert.equal(typeof (await res.json()).error, 'string');
  }

  res = await req(`/bookmarks/${created.id}`, { method: 'PATCH', body: { title: 'Node' } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ...created, title: 'Node' });

  res = await req(`/bookmarks/${created.id}`, { method: 'PATCH', body: { tags: ['runtime'], extra: 1 } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ...created, title: 'Node', tags: ['runtime'] });

  res = await req('/bookmarks');
  assert.deepEqual(await res.json(), [{ ...created, title: 'Node', tags: ['runtime'] }, a]);

  res = await req(`/bookmarks/${created.id}`, { method: 'DELETE' });
  assert.equal(res.status, 204);
  assert.equal(await res.text(), '');
  for (const method of ['DELETE', 'PATCH']) {
    res = await req(`/bookmarks/${created.id}`, { method, body: method === 'PATCH' ? { title: 'x' } : undefined });
    assert.equal(res.status, 404, method);
    assert.deepEqual(await res.json(), { error: 'Not found' });
  }
});

test('rejects invalid bodies with 400', async (t) => {
  const { req, post } = await start(t);
  const { id } = await post({ url: 'https://a.com', title: 'a' });
  const ok = { url: 'https://b.com', title: 'b' };
  for (const body of ['not json', '', 'null', '[]', '"x"', {}, { title: 'a' }, { url: 'https://b.com' },
    { ...ok, url: 'ftp://x.com' }, { ...ok, url: 'not a url' }, { ...ok, url: 'javascript:alert(1)' }, { ...ok, url: 1 },
    { ...ok, title: '' }, { ...ok, title: '   ' }, { ...ok, title: 1 },
    { ...ok, tags: 'js' }, { ...ok, tags: [''] }, { ...ok, tags: [' '] }, { ...ok, tags: [1] }, { ...ok, tags: null },
    { ...ok, title: 'a'.repeat(9000) }]) {
    const res = await req('/bookmarks', { method: 'POST', body });
    assert.equal(res.status, 400, `POST ${JSON.stringify(body).slice(0, 60)}`);
    assert.equal(typeof (await res.json()).error, 'string');
  }
  for (const body of ['not json', 'null', '[]', {}, { other: 1 }, { title: '' }, { title: 1 }, { tags: 'x' }, { tags: [''] }, { tags: null }, { title: 'ok', tags: [2] }]) {
    for (const path of [`/bookmarks/${id}`, '/bookmarks/999']) {
      const res = await req(path, { method: 'PATCH', body });
      assert.equal(res.status, 400, `PATCH ${path} ${JSON.stringify(body)}`);
      assert.equal(typeof (await res.json()).error, 'string');
    }
  }
  const res = await req('/bookmarks/999', { method: 'PATCH', body: { title: 'x' } });
  assert.equal(res.status, 404);
  assert.equal((await (await req('/bookmarks')).json()).length, 1);
});

test('list filters by tag and text, tags counts usage', async (t) => {
  const { req, post } = await start(t);
  await post({ url: 'https://nodejs.org', title: 'Node.js', tags: ['js', 'docs'] });
  await post({ url: 'https://deno.land', title: 'Deno', tags: ['js'] });
  await post({ url: 'https://example.com/NODE-guide', title: 'Guide', tags: ['docs', 'python'] });
  await post({ url: 'https://a.com', title: 'Untagged' });
  const titles = async (q) => {
    const res = await req(`/bookmarks${q}`);
    assert.equal(res.status, 200, q);
    assert.equal(res.headers.get('content-type'), 'application/json');
    return (await res.json()).map((b) => b.title);
  };
  assert.deepEqual(await titles(''), ['Node.js', 'Deno', 'Guide', 'Untagged']);
  assert.deepEqual(await titles('?tag=js'), ['Node.js', 'Deno']);
  assert.deepEqual(await titles('?tag=JS'), []);
  assert.deepEqual(await titles('?tag=nope'), []);
  assert.deepEqual(await titles('?q=NODE'), ['Node.js', 'Guide']);
  assert.deepEqual(await titles('?q=deno.LAND'), ['Deno']);
  assert.deepEqual(await titles('?q=%25'), []);
  assert.deepEqual(await titles('?q=node&tag=docs'), ['Node.js', 'Guide']);
  assert.deepEqual(await titles('?q=node&tag=js'), ['Node.js']);

  const res = await req('/tags');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [{ tag: 'docs', count: 2 }, { tag: 'js', count: 2 }, { tag: 'python', count: 1 }]);
});

test('unknown routes and non-integer ids return 404', async (t) => {
  const { req } = await start(t);
  for (const [method, path] of [['GET', '/'], ['GET', '/bookmarks/1'], ['PUT', '/bookmarks'], ['DELETE', '/bookmarks'], ['POST', '/tags'], ['PATCH', '/bookmarks/abc'], ['DELETE', '/bookmarks/1.5'], ['DELETE', '/bookmarks/0'], ['POST', '/bookmarks/1'], ['GET', '/%E0%A4%A']]) {
    const res = await req(path, { method, body: method === 'PATCH' ? { title: 'x' } : undefined });
    assert.equal(res.status, 404, `${method} ${path}`);
    assert.deepEqual(await res.json(), { error: 'Not found' });
  }
});

test('malformed request URL answers 500 and server stays up', async (t) => {
  const { req, port } = await start(t);
  const socket = connect(port, '127.0.0.1');
  await once(socket, 'connect');
  socket.end('GET // HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n');
  let raw = '';
  for await (const chunk of socket) raw += chunk;
  assert.match(raw, /^HTTP\/1\.1 500/);
  assert.match(raw, /"error"/);
  assert.equal((await req('/tags')).status, 200);
});

test('client aborting mid-upload does not crash the server', async (t) => {
  const { req, port } = await start(t);
  const socket = connect(port, '127.0.0.1');
  await once(socket, 'connect');
  socket.write('POST /bookmarks HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: 100000\r\n\r\n{"url":"http');
  await sleep(20);
  socket.destroy();
  await sleep(50);
  const res = await req('/bookmarks', { method: 'POST', body: { url: 'https://still.up', title: 'still up' } });
  assert.equal(res.status, 201);
});

test('bad PORT exits 1 naming PORT', () => {
  for (const PORT of ['abc', '-1', '65536', '1.5', '']) {
    const r = spawnSync(process.execPath, [join(import.meta.dirname, '../src/server.js')], { env: { ...process.env, PORT }, encoding: 'utf8', timeout: 5000 });
    assert.equal(r.status, 1, `PORT=${PORT}`);
    assert.match(r.stderr, /PORT/);
  }
});
