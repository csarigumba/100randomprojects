import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DURATIONS, LABELS, initial, start, pause, reset, tick, format } from '../public/pomodoro.js';

const MIN = 60_000;

test('initial is 25:00 work, count 0, paused', () => {
  assert.deepEqual(initial(), { mode: 'work', completed: 0, remaining: 25 * MIN, startedAt: null });
  assert.deepEqual(reset(), initial());
  assert.equal(LABELS.work, 'Work');
});

test('start on running and pause on paused are no-ops', () => {
  const paused = initial();
  assert.equal(pause(paused, 1000), paused);
  assert.equal(tick(paused, 1000), paused);
  const running = start(paused, 0);
  assert.equal(running.startedAt, 0);
  assert.equal(start(running, 5000), running);
});

test('pause freezes remaining; resume continues from it', () => {
  let s = pause(start(initial(), 0), MIN);
  assert.deepEqual(s, { mode: 'work', completed: 0, remaining: 24 * MIN, startedAt: null });
  assert.equal(tick(s, 100 * MIN), s);
  s = tick(start(s, 200 * MIN), 200 * MIN + 1000);
  assert.equal(s.remaining, 24 * MIN - 1000);
});

test('work ends into short break with count 1', () => {
  const s = tick(start(initial(), 0), 25 * MIN);
  assert.deepEqual(s, { mode: 'short', completed: 1, remaining: DURATIONS.short, startedAt: 25 * MIN });
});

test('4th work ends into long break, long ends into work', () => {
  let s = { mode: 'work', completed: 3, remaining: 1000, startedAt: 0 };
  s = tick(s, 1000);
  assert.equal(s.mode, 'long');
  assert.equal(s.completed, 4);
  assert.equal(s.remaining, 15 * MIN);
  s = tick(s, 1000 + 15 * MIN);
  assert.deepEqual(s, { mode: 'work', completed: 4, remaining: 25 * MIN, startedAt: 1000 + 15 * MIN });
});

test('a jump past several sessions lands in the right one', () => {
  // 4 work + 3 short = 115 min, then 10 min into the long break
  const s = tick(start(initial(), 0), 125 * MIN);
  assert.deepEqual(s, { mode: 'long', completed: 4, remaining: 5 * MIN, startedAt: 125 * MIN });
});

test('one big jump equals many small ticks (wall clock, not tick counting)', () => {
  let small = start(initial(), 0);
  for (let t = 250; t <= 40 * MIN; t += 250) small = tick(small, t);
  const big = tick(start(initial(), 0), 40 * MIN);
  assert.deepEqual(big, small);
  assert.deepEqual(big, { mode: 'work', completed: 1, remaining: 15 * MIN, startedAt: 40 * MIN });
});

test('does not mutate input', () => {
  const s = Object.freeze(start(initial(), 0));
  tick(s, 30 * MIN);
  pause(s, 10);
  start(Object.freeze(initial()), 0);
  assert.deepEqual(s, { mode: 'work', completed: 0, remaining: 25 * MIN, startedAt: 0 });
});

test('format rounds seconds up', () => {
  assert.equal(format(1_500_000), '25:00');
  assert.equal(format(1), '00:01');
  assert.equal(format(0), '00:00');
  assert.equal(format(59_001), '01:00');
  assert.equal(format(24 * MIN + 59_999), '25:00');
});

test('page has the DOM handles and loads app.js as a module', () => {
  const html = readFileSync(join(import.meta.dirname, '..', 'public', 'index.html'), 'utf8');
  for (const id of ['time', 'mode', 'count', 'start', 'pause', 'reset']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /<script type="module" src="\/app.js"><\/script>/);
});
