import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { secretFromSeed } from '../src/game.js';

const cli = new URL('../src/cli.js', import.meta.url).pathname;
const run = (seed, lines) =>
  spawnSync(process.execPath, [cli], {
    input: lines.map((l) => l + '\n').join(''),
    env: { ...process.env, GUESS_SEED: seed },
    encoding: 'utf8',
  });

const seed = 'demo';
const S = secretFromSeed(seed);
const below = S - 1;
const above = S + 1;

test('fixture seed has room on both sides', () => {
  assert.ok(S > 1 && S < 100, `secret ${S}`);
});

test('welcome, difficulty, hints, win with attempt count', () => {
  const r = run(seed, ['medium', String(below), String(above), String(S)]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Welcome to the Number Guessing Game!\n/);
  assert.match(r.stdout, /I'm thinking of a number between 1 and 100\.\n/);
  assert.match(r.stdout, /Choose a difficulty: easy \(10 chances\), medium \(5 chances\), hard \(3 chances\)\n/);
  assert.match(r.stdout, /Great! You have chosen medium\. You have 5 chances\.\n/);
  assert.match(r.stdout, new RegExp(`Incorrect! The number is greater than ${below}\\.\n`));
  assert.match(r.stdout, new RegExp(`Incorrect! The number is less than ${above}\\.\n`));
  assert.match(r.stdout, /Congratulations! You guessed the correct number in 3 attempts\.\n/);
  assert.equal(r.stderr, '');
});

test('win on first guess still says attempts', () => {
  const r = run(seed, ['easy', String(S)]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Great! You have chosen easy\. You have 10 chances\./);
  assert.match(r.stdout, /in 1 attempts\./);
});

test('loss reveals the number', () => {
  const r = run(seed, ['hard', String(below), String(below), String(below), String(S)]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /You have 3 chances\./);
  assert.match(r.stdout, new RegExp(`Game over! You ran out of chances\\. The number was ${S}\\.\n`));
  assert.doesNotMatch(r.stdout, /Congratulations/);
});

test('invalid guesses do not use a chance', () => {
  const r = run(seed, ['hard', 'abc', '0', '101', '5.5', String(below), String(below), String(S)]);
  assert.equal(r.status, 0);
  assert.equal(r.stderr.match(/^Invalid guess: enter a whole number from 1 to 100\.$/gm).length, 4);
  assert.match(r.stdout, /in 3 attempts\./);
});

test('bad difficulty re-asks', () => {
  const r = run(seed, ['nope', '3', String(S)]);
  assert.equal(r.status, 0);
  assert.equal(r.stderr, 'Invalid difficulty: choose easy, medium, or hard.\n');
  assert.match(r.stdout, /Great! You have chosen hard\. You have 3 chances\./);
  assert.equal(r.stdout.match(/Difficulty: /g).length, 2);
});

test('same seed and input give identical output', () => {
  const lines = ['easy', '50', '25', '75', '10', '90'];
  const a = run('repeat', lines);
  const b = run('repeat', lines);
  assert.equal(a.stdout, b.stdout);
  assert.equal(a.stderr, b.stderr);
  assert.equal(a.status, b.status);
});

test('exits after game over even if stdin stays open', async () => {
  const p = spawn(process.execPath, [cli], { env: { ...process.env, GUESS_SEED: seed } });
  p.stdin.write(`hard\n${S}\n`);
  const code = await Promise.race([once(p, 'exit').then(([c]) => c), setTimeout(3000, 'hung', { ref: false })]);
  p.kill();
  assert.equal(code, 0);
});

test('stdin ends before game over exits 1', () => {
  for (const lines of [[], ['easy', String(below)]]) {
    const r = run(seed, lines);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /No more input\.\n$/);
  }
});
