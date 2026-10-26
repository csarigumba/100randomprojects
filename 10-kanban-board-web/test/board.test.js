import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNS, emptyBoard, addCard, moveCard, deleteCard } from '../public/board.js';

const deepFreeze = (o) => {
  Object.values(o).forEach((v) => typeof v === 'object' && deepFreeze(v));
  return Object.freeze(o);
};
const sample = () => deepFreeze({
  todo: [{ id: 'a', title: 'A' }],
  doing: [{ id: 'b', title: 'B' }],
  done: [{ id: 'c', title: 'C' }],
});

test('COLUMNS and emptyBoard', () => {
  assert.deepEqual(COLUMNS, ['todo', 'doing', 'done']);
  assert.deepEqual(emptyBoard(), { todo: [], doing: [], done: [] });
});

test('addCard trims title and appends to todo', () => {
  const b = sample();
  const before = structuredClone(b);
  const next = addCard(b, '  New  ', 'n');
  assert.deepEqual(next.todo, [{ id: 'a', title: 'A' }, { id: 'n', title: 'New' }]);
  assert.deepEqual(next.doing, b.doing);
  assert.deepEqual(b, before);
});

test('addCard defaults id to a string', () => {
  const [card] = addCard(emptyBoard(), 'x').todo;
  assert.equal(typeof card.id, 'string');
  assert.ok(card.id.length > 0);
});

test('addCard rejects non-string, empty, whitespace titles', () => {
  for (const t of [undefined, null, 42, '', '   ', '\n\t']) {
    assert.throws(() => addCard(sample(), t), { message: 'Title is required' });
  }
});

test('moveCard right across all columns, appended to end', () => {
  let b = deepFreeze({ todo: [{ id: 'a', title: 'A' }], doing: [{ id: 'x', title: 'X' }], done: [{ id: 'y', title: 'Y' }] });
  b = moveCard(b, 'a', 1);
  assert.deepEqual(b, { todo: [], doing: [{ id: 'x', title: 'X' }, { id: 'a', title: 'A' }], done: [{ id: 'y', title: 'Y' }] });
  b = moveCard(deepFreeze(b), 'a', 1);
  assert.deepEqual(b, { todo: [], doing: [{ id: 'x', title: 'X' }], done: [{ id: 'y', title: 'Y' }, { id: 'a', title: 'A' }] });
});

test('moveCard left across all columns, appended to end', () => {
  let b = deepFreeze({ todo: [{ id: 'x', title: 'X' }], doing: [], done: [{ id: 'c', title: 'C' }] });
  b = moveCard(b, 'c', -1);
  assert.deepEqual(b, { todo: [{ id: 'x', title: 'X' }], doing: [{ id: 'c', title: 'C' }], done: [] });
  b = moveCard(deepFreeze(b), 'c', -1);
  assert.deepEqual(b, { todo: [{ id: 'x', title: 'X' }, { id: 'c', title: 'C' }], doing: [], done: [] });
});

test('moveCard no-op at edges and for unknown id', () => {
  const b = sample();
  assert.equal(moveCard(b, 'a', -1), b);
  assert.equal(moveCard(b, 'c', 1), b);
  assert.equal(moveCard(b, 'zzz', 1), b);
});

test('deleteCard removes the card', () => {
  assert.deepEqual(deleteCard(sample(), 'b'), { todo: [{ id: 'a', title: 'A' }], doing: [], done: [{ id: 'c', title: 'C' }] });
});

test('deleteCard with unknown id leaves content unchanged', () => {
  const b = sample();
  assert.deepEqual(deleteCard(b, 'zzz'), structuredClone(b));
});
