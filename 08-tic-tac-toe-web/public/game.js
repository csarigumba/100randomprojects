const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export function outcome(board) {
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : null;
}

export function turn(board) {
  return board.filter(Boolean).length % 2 ? 'O' : 'X';
}

export function canPlay(board, i) {
  return !board[i] && outcome(board) === null;
}
