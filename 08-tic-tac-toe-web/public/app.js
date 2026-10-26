import { outcome, turn, canPlay } from './game.js';

const cells = [...document.querySelectorAll('#board button')];
const status = document.querySelector('#status');
let board;

function restart() {
  board = Array(9).fill(null);
  render();
}

function render() {
  cells.forEach((cell, i) => (cell.textContent = board[i] ?? ''));
  const result = outcome(board);
  status.textContent = result === 'draw' ? 'Draw' : result ? `Winner: ${result}` : `Turn: ${turn(board)}`;
}

document.querySelector('#board').addEventListener('click', (e) => {
  const i = e.target.dataset.index;
  if (i === undefined || !canPlay(board, i)) return;
  board[i] = turn(board);
  render();
});
document.querySelector('#restart').addEventListener('click', restart);
restart();
