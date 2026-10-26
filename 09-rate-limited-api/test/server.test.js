import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/server.js';

test('quote, 404, 429 with headers, then refill', async (t) => {
  let now = 0;
  const server = createApp({ limit: 2, windowMs: 4000, now: () => now }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const url = `http://127.0.0.1:${server.address().port}`;

  let res = await fetch(`${url}/api/quote`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/json');
  assert.equal(res.headers.get('x-ratelimit-limit'), '2');
  assert.equal(res.headers.get('x-ratelimit-remaining'), '1');
  const quote = await res.json();
  assert.equal(typeof quote.text, 'string');
  assert.equal(typeof quote.author, 'string');

  res = await fetch(`${url}/nope`);
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('x-ratelimit-remaining'), '0');
  assert.deepEqual(await res.json(), { error: 'not found' });

  res = await fetch(`${url}/api/quote`);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '2');
  assert.equal(res.headers.get('x-ratelimit-limit'), '2');
  assert.equal(res.headers.get('x-ratelimit-remaining'), '0');
  assert.equal(res.headers.get('content-type'), 'application/json');
  assert.deepEqual(await res.json(), { error: 'rate limit exceeded' });

  now += 1999;
  res = await fetch(`${url}/api/quote`);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '1');
  await res.body.cancel();

  now += 1;
  res = await fetch(`${url}/api/quote`);
  assert.equal(res.status, 200);
  await res.body.cancel();
});
