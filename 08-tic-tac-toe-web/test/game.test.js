import { test } from 'node:test';
import assert from 'node:assert/strict';
import { outcome } from '../public/game.js';

const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const b = (s) => [...s].map((c) => (c === '.' ? null : c));

for (const line of lines) {
  for (const mark of ['X', 'O']) {
    test(`${mark} wins on ${line}`, () => {
      const board = Array(9).fill(null);
      for (const i of line) board[i] = mark;
      assert.equal(outcome(board), mark);
    });
  }
}

test('draw on full board with no line', () => assert.equal(outcome(b('XOXXOOOXX')), 'draw'));
test('full board with a line returns winner', () => assert.equal(outcome(b('XXXOOXXOO')), 'X'));
test('empty board continues', () => assert.equal(outcome(Array(9).fill(null)), null));
test('partial board continues', () => assert.equal(outcome(b('XO..X..O.')), null));
