import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connect } from 'node:net';
import { server } from '../src/server.js';

let base;
before(() => new Promise((r) => server.listen(0, () => r(base = `http://localhost:${server.address().port}`))));
after(() => server.close());

test('GET / serves the page', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(await res.text(), /id="board"/);
});

for (const path of ['/app.js', '/game.js']) {
  test(`GET ${path} serves js`, async () => {
    const res = await fetch(base + path);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/javascript/);
  });
}

for (const path of ['/nope', '/../package.json']) {
  test(`GET ${path} is 404`, async () => {
    const res = await fetch(base + path);
    assert.equal(res.status, 404);
  });
}

test('malformed request target gets 4xx and server stays up', async () => {
  const reply = await new Promise((resolve, reject) => {
    let data = '';
    const sock = connect(server.address().port, 'localhost', () => sock.end('GET http://[ HTTP/1.1\r\nHost: x\r\n\r\n'));
    sock.on('data', (d) => (data += d)).on('end', () => resolve(data)).on('error', reject);
  });
  assert.match(reply, /^HTTP\/1\.1 4\d\d/);
  assert.equal((await fetch(`${base}/`)).status, 200);
});
