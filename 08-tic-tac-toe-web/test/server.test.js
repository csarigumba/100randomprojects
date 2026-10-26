import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
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
