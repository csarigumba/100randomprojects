import { outcome } from './game.js';

const cells = [...document.querySelectorAll('#board button')];
const status = document.querySelector('#status');
let board, turn;

function restart() {
  board = Array(9).fill(null);
  turn = 'X';
  render();
}

function render() {
  cells.forEach((cell, i) => (cell.textContent = board[i] ?? ''));
  const result = outcome(board);
  status.textContent = result === 'draw' ? 'Draw' : result ? `Winner: ${result}` : `Turn: ${turn}`;
}

document.querySelector('#board').addEventListener('click', (e) => {
  const i = e.target.dataset.index;
  if (i === undefined || board[i] || outcome(board)) return;
  board[i] = turn;
  turn = turn === 'X' ? 'O' : 'X';
  render();
});
document.querySelector('#restart').addEventListener('click', restart);
restart();
