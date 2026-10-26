import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLimiter } from '../src/limiter.js';

const setup = () => {
  let t = 0;
  const take = createLimiter({ limit: 5, windowMs: 10000, now: () => t });
  return { take, tick: (ms) => (t += ms) };
};

test('allows limit requests then exhausts', () => {
  const { take } = setup();
  for (let i = 4; i >= 0; i--) assert.deepEqual(take('a'), { allowed: true, limit: 5, remaining: i, retryAfterMs: 0 });
  assert.deepEqual(take('a'), { allowed: false, limit: 5, remaining: 0, retryAfterMs: 2000 });
});

test('partial refill gives one token after windowMs/limit', () => {
  const { take, tick } = setup();
  for (let i = 0; i < 5; i++) take('a');
  tick(1500);
  assert.equal(take('a').retryAfterMs, 500);
  tick(500);
  assert.deepEqual(take('a'), { allowed: true, limit: 5, remaining: 0, retryAfterMs: 0 });
});

test('empty bucket is full after windowMs and caps at limit', () => {
  const { take, tick } = setup();
  for (let i = 0; i < 5; i++) take('a');
  tick(10000 * 3);
  assert.equal(take('a').remaining, 4);
});

test('keys have separate buckets', () => {
  const { take } = setup();
  for (let i = 0; i < 5; i++) take('a');
  assert.equal(take('a').allowed, false);
  assert.equal(take('b').remaining, 4);
});
