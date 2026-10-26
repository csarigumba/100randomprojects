import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTIES, secretFromSeed, parseDifficulty, parseGuess } from '../src/game.js';

test('DIFFICULTIES', () => {
  assert.deepEqual(DIFFICULTIES, { easy: 10, medium: 5, hard: 3 });
});

test('secretFromSeed is deterministic and in 1..100', () => {
  assert.equal(secretFromSeed('demo'), secretFromSeed('demo'));
  for (let i = 0; i < 500; i++) {
    const n = secretFromSeed(String(i));
    assert.ok(Number.isInteger(n) && n >= 1 && n <= 100, `${i} -> ${n}`);
  }
  // sha256('a') starts ca978112 -> 3398926610 % 100 + 1 = 11
  assert.equal(secretFromSeed('a'), 11);
});

test('parseDifficulty', () => {
  assert.equal(parseDifficulty('easy'), 'easy');
  assert.equal(parseDifficulty(' MEDIUM \n'), 'medium');
  assert.equal(parseDifficulty('Hard'), 'hard');
  assert.equal(parseDifficulty('1'), 'easy');
  assert.equal(parseDifficulty('2'), 'medium');
  assert.equal(parseDifficulty(' 3 '), 'hard');
  for (const bad of ['', '0', '4', 'nope', 'constructor', '__proto__', '1.0', 'easy mode']) {
    assert.equal(parseDifficulty(bad), null, bad);
  }
});

test('parseGuess', () => {
  assert.equal(parseGuess('1'), 1);
  assert.equal(parseGuess(' 100 '), 100);
  assert.equal(parseGuess('050'), 50);
  for (const bad of ['', 'abc', '0', '101', '5.5', '-3', '+3', '1e2', '12a']) {
    assert.equal(parseGuess(bad), null, bad);
  }
});
