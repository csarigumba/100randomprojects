import { COLUMNS, emptyBoard, addCard, moveCard, deleteCard } from './board.js';

const KEY = 'kanban-board';
let board = JSON.parse(localStorage.getItem(KEY)) ?? emptyBoard();

function update(next) {
  board = next;
  localStorage.setItem(KEY, JSON.stringify(board));
  render();
}

function button(action, text, label, disabled) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.action = action;
  b.textContent = text;
  if (label) b.setAttribute('aria-label', label);
  b.disabled = disabled;
  return b;
}

function render() {
  COLUMNS.forEach((col, i) => {
    const items = board[col].map(card => {
      const li = document.createElement('li');
      li.className = 'card';
      li.dataset.id = card.id;
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = card.title;
      li.append(
        title,
        button('left', '←', 'Move left', i === 0),
        button('right', '→', 'Move right', i === COLUMNS.length - 1),
        button('delete', 'Delete', null, false),
      );
      return li;
    });
    document.querySelector(`[data-column="${col}"] ul`).replaceChildren(...items);
  });
}

document.querySelector('#add-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = e.target.elements.title;
  let next;
  try {
    next = addCard(board, input.value);
  } catch {
    return input.focus();
  }
  update(next);
  input.value = '';
});

document.querySelector('#board').addEventListener('click', e => {
  const action = e.target.closest('button')?.dataset.action;
  if (!action) return;
  const id = e.target.closest('li.card').dataset.id;
  if (action === 'delete') update(deleteCard(board, id));
  else update(moveCard(board, id, action === 'left' ? -1 : 1));
});

render();
