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
  return { req, port };
}

test('create, update, delete', async (t) => {
  const { req } = await start(t);

  let res = await req('/todos', { method: 'POST', body: { title: 'buy milk' } });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('content-type'), 'application/json');
  const created = await res.json();
  assert.deepEqual(Object.keys(created), ['id', 'title', 'done', 'createdAt']);
  assert.equal(created.title, 'buy milk');
  assert.equal(created.done, false);
  assert.equal(created.createdAt, new Date(created.createdAt).toISOString());

  res = await req(`/todos/${created.id}`, { method: 'PATCH', body: { done: true } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ...created, done: true });

  res = await req(`/todos/${created.id}`, { method: 'PATCH', body: { title: 'buy oat milk', extra: 1 } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ...created, title: 'buy oat milk', done: true });

  res = await req(`/todos/${created.id}`, { method: 'PATCH', body: { done: false } });
  assert.deepEqual(await res.json(), { ...created, title: 'buy oat milk' });

  res = await req(`/todos/${created.id}`, { method: 'DELETE' });
  assert.equal(res.status, 204);
  assert.equal(await res.text(), '');
  for (const method of ['DELETE', 'PATCH']) {
    res = await req(`/todos/${created.id}`, { method, body: method === 'PATCH' ? { done: true } : undefined });
    assert.equal(res.status, 404, method);
    assert.deepEqual(await res.json(), { error: 'Not found' });
  }
});

test('rejects invalid bodies with 400', async (t) => {
  const { req } = await start(t);
  const { id } = await (await req('/todos', { method: 'POST', body: { title: 'a' } })).json();
  for (const body of ['not json', '', 'null', '[]', '"x"', {}, { title: '' }, { title: '   ' }, { title: 1 }, { title: ['a'] }, { title: 'a'.repeat(9000) }]) {
    const res = await req('/todos', { method: 'POST', body });
    assert.equal(res.status, 400, `POST ${JSON.stringify(body).slice(0, 50)}`);
    assert.equal(typeof (await res.json()).error, 'string');
  }
  for (const body of ['not json', 'null', '[]', {}, { other: 1 }, { title: '' }, { title: ' ' }, { title: 1 }, { done: 'yes' }, { done: 1 }, { done: null }, { title: 'ok', done: 'true' }]) {
    for (const path of [`/todos/${id}`, '/todos/999']) {
      const res = await req(path, { method: 'PATCH', body });
      assert.equal(res.status, 400, `PATCH ${path} ${JSON.stringify(body)}`);
      assert.equal(typeof (await res.json()).error, 'string');
    }
  }
  const res = await req('/todos/999', { method: 'PATCH', body: { done: true } });
  assert.equal(res.status, 404);
});

test('list filters by done and paginates', async (t) => {
  const { req } = await start(t);
  for (let i = 1; i <= 12; i++) {
    const { id } = await (await req('/todos', { method: 'POST', body: { title: `t${i}` } })).json();
    if (i % 3 === 0) await req(`/todos/${id}`, { method: 'PATCH', body: { done: true } });
  }
  const list = async (q) => {
    const res = await req(`/todos${q}`);
    assert.equal(res.status, 200, q);
    assert.equal(res.headers.get('content-type'), 'application/json');
    const body = await res.json();
    return { ...body, titles: body.data.map((t) => t.title) };
  };

  let r = await list('');
  assert.deepEqual([r.page, r.limit, r.total], [1, 10, 12]);
  assert.deepEqual(r.titles, ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10']);
  assert.deepEqual(Object.keys(r.data[0]), ['id', 'title', 'done', 'createdAt']);

  r = await list('?done=true');
  assert.deepEqual(r.titles, ['t3', 't6', 't9', 't12']);
  assert.equal(r.total, 4);
  assert.ok(r.data.every((t) => t.done === true));

  r = await list('?done=false&page=2&limit=5');
  assert.deepEqual(r.titles, ['t8', 't10', 't11']);
  assert.deepEqual([r.page, r.limit, r.total], [2, 5, 8]);
  assert.ok(r.data.every((t) => t.done === false));

  r = await list('?page=3&limit=5');
  assert.deepEqual(r.titles, ['t11', 't12']);
  r = await list('?page=9&limit=100');
  assert.deepEqual([r.titles, r.total], [[], 12]);

  for (const q of ['?page=0', '?page=-1', '?page=1.5', '?page=abc', '?page=', '?limit=0', '?limit=101', '?limit=2.0', '?limit=x', '?done=1', '?done=True', '?done=', '?page=99999999999999999999']) {
    const res = await req(`/todos${q}`);
    assert.equal(res.status, 400, q);
    assert.equal(typeof (await res.json()).error, 'string');
  }
});

test('unknown routes and non-integer ids return 404', async (t) => {
  const { req } = await start(t);
  for (const [method, path] of [['GET', '/'], ['GET', '/todos/1'], ['PUT', '/todos'], ['DELETE', '/todos'], ['PATCH', '/todos/abc'], ['DELETE', '/todos/1.5'], ['DELETE', '/todos/0'], ['POST', '/todos/1'], ['GET', '/todos/x/y']]) {
    const res = await req(path, { method, body: method === 'PATCH' ? { done: true } : undefined });
    assert.equal(res.status, 404, `${method} ${path}`);
    assert.deepEqual(await res.json(), { error: 'Not found' });
  }
});

test('client aborting mid-upload does not crash the server', async (t) => {
  const { req, port } = await start(t);
  const socket = connect(port, '127.0.0.1');
  await once(socket, 'connect');
  socket.write('POST /todos HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: 100000\r\n\r\n{"title":"bu');
  await sleep(20);
  socket.destroy();
  await sleep(50);
  const res = await req('/todos', { method: 'POST', body: { title: 'still up' } });
  assert.equal(res.status, 201);
});

test('bad PORT exits 1 naming PORT', () => {
  for (const PORT of ['abc', '-1', '65536', '1.5', '']) {
    const r = spawnSync(process.execPath, [join(import.meta.dirname, '../src/server.js')], { env: { ...process.env, PORT }, encoding: 'utf8', timeout: 5000 });
    assert.equal(r.status, 1, `PORT=${PORT}`);
    assert.match(r.stderr, /PORT/);
  }
});
