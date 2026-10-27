import { LABELS, initial, start, pause, reset, tick, format } from '/pomodoro.js';

const $ = (selector) => document.querySelector(selector);
let state = initial();

function render() {
  const time = format(state.remaining);
  $('#time').textContent = time;
  $('#mode').textContent = LABELS[state.mode];
  $('#mode').dataset.mode = state.mode;
  $('#count').textContent = state.completed;
  $('#start').disabled = state.startedAt !== null;
  $('#pause').disabled = state.startedAt === null;
  document.title = `${time} · ${LABELS[state.mode]}`;
}

function update() {
  state = tick(state, Date.now());
  render();
}

let timer = setInterval(update, 250);
$('#start').addEventListener('click', () => {
  state = start(state, Date.now());
  clearInterval(timer);
  timer = setInterval(update, 250); // ticks land on whole seconds after Start, so the display flips on time
  render();
});
$('#pause').addEventListener('click', () => { state = pause(state, Date.now()); render(); });
$('#reset').addEventListener('click', () => { state = reset(); render(); });
document.addEventListener('visibilitychange', update);
render();
