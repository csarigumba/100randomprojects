import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { connect } from 'node:net';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { server } from '../server.js';

const root = join(import.meta.dirname, '..');
server.listen(0);
await once(server, 'listening');
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

test('routes serve files with content types, query string ignored', async () => {
  for (const [path, type] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/pomodoro.js', 'text/javascript'], ['/?x=1', 'text/html']]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type'), new RegExp(`^${type}; charset=utf-8$`), path);
  }
});

test('unknown path is 404', async () => {
  for (const path of ['/nope', '/index.html', '/server.js']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
});

test('non-GET method is 404 on every route', async () => {
  for (const path of ['/', '/app.js', '/pomodoro.js']) {
    assert.equal((await fetch(base + path, { method: 'POST' })).status, 404, path);
  }
});

test('malformed request URL gets an error response and the server keeps serving', async () => {
  const socket = connect(server.address().port);
  socket.end('GET //% HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n');
  let reply = '';
  for await (const chunk of socket) reply += chunk;
  assert.match(reply, /^HTTP\/1\.1 (400|500)/);
  assert.equal((await fetch(`${base}/`)).status, 200);
});

test('bad PORT exits 1 naming PORT', () => {
  for (const port of ['abc', '0', '70000', '3.5']) {
    const r = spawnSync(process.execPath, [join(root, 'server.js')], { env: { ...process.env, PORT: port }, encoding: 'utf8' });
    assert.equal(r.status, 1, port);
    assert.match(r.stderr, /PORT/, port);
  }
});
