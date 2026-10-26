import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateQuestions, start, pick, next, isCorrect, isFinished, scoreText } from '../public/quiz.js';

const qs = [
  { question: 'A?', choices: ['a', 'b', 'c'], answer: 0 },
  { question: 'B?', choices: ['a', 'b', 'c', 'd'], answer: 3 },
];

test('pick right scores and marks correct', () => {
  const s = pick(start(qs), 0);
  assert.equal(s.picked, 0);
  assert.equal(s.score, 1);
  assert.equal(isCorrect(s), true);
});

test('pick wrong does not score', () => {
  const s = pick(start(qs), 2);
  assert.equal(s.score, 0);
  assert.equal(isCorrect(s), false);
});

test('pick is ignored after a pick', () => {
  const s = pick(start(qs), 2);
  assert.equal(pick(s, 0), s);
});

test('pick does not mutate state', () => {
  const s = start(qs);
  pick(s, 0);
  assert.deepEqual(s, { questions: qs, index: 0, score: 0, picked: null });
});

test('next only after a pick', () => {
  const s = start(qs);
  assert.equal(next(s), s);
  const n = next(pick(s, 0));
  assert.equal(n.index, 1);
  assert.equal(n.picked, null);
  assert.equal(n.score, 1);
});

test('finish, scoreText, pick ignored when finished', () => {
  let s = start(qs);
  assert.equal(scoreText(s), '0 / 2');
  s = next(pick(s, 0));
  assert.equal(isFinished(s), false);
  s = next(pick(s, 0));
  assert.equal(isFinished(s), true);
  assert.equal(scoreText(s), '1 / 2');
  assert.equal(pick(s, 0), s);
});

test('start resets', () => {
  assert.deepEqual(start(qs), { questions: qs, index: 0, score: 0, picked: null });
});

test('validateQuestions returns valid data', () => assert.equal(validateQuestions(qs), qs));

const bad = {
  'not an array': [{ x: 1 }, /array/],
  'empty array': [[], /at least one/],
  'missing question': [[{ choices: ['a', 'b', 'c'], answer: 0 }], /question 1: question/],
  '2 choices': [[{ question: 'Q', choices: ['a', 'b'], answer: 0 }], /question 1: choices/],
  '5 choices': [[{ question: 'Q', choices: ['a', 'b', 'c', 'd', 'e'], answer: 0 }], /question 1: choices/],
  'empty choice': [[{ question: 'Q', choices: ['a', '', 'c'], answer: 0 }], /question 1: choices/],
  'answer out of range': [[qs[0], { question: 'Q', choices: ['a', 'b', 'c'], answer: 3 }], /question 2: answer/],
  'negative answer': [[{ question: 'Q', choices: ['a', 'b', 'c'], answer: -1 }], /question 1: answer/],
  'non-integer answer': [[{ question: 'Q', choices: ['a', 'b', 'c'], answer: 1.5 }], /question 1: answer/],
  'null item': [[null], /question 1/],
};
for (const [name, [data, message]] of Object.entries(bad)) {
  test(`validateQuestions rejects ${name}`, () => assert.throws(() => validateQuestions(data), message));
}

test('malformed questions file fails at JSON.parse', () => {
  const text = readFileSync(join(import.meta.dirname, 'fixtures', 'malformed.json'), 'utf8');
  assert.throws(() => validateQuestions(JSON.parse(text)), SyntaxError);
});
