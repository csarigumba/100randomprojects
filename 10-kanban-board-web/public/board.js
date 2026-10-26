export const COLUMNS = ['todo', 'doing', 'done'];

export function emptyBoard() {
  return { todo: [], doing: [], done: [] };
}

export function addCard(board, title, id = crypto.randomUUID()) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('Title is required');
  return { ...board, todo: [...board.todo, { id, title: title.trim() }] };
}

export function moveCard(board, id, dir) {
  const from = COLUMNS.find((c) => board[c].some((card) => card.id === id));
  const to = COLUMNS[COLUMNS.indexOf(from) + dir];
  if (!from || !to) return board;
  const card = board[from].find((c) => c.id === id);
  return { ...board, [from]: board[from].filter((c) => c.id !== id), [to]: [...board[to], card] };
}

export function deleteCard(board, id) {
  return Object.fromEntries(COLUMNS.map((c) => [c, board[c].filter((card) => card.id !== id)]));
}
