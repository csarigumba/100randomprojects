import { start, pick, next, isCorrect, isFinished, scoreText, progressText, feedbackText } from './quiz.js';

const $ = (selector) => document.querySelector(selector);
let state;

function render() {
  const done = isFinished(state);
  $('#quiz').hidden = done;
  $('#result').hidden = !done;
  $('#score').textContent = scoreText(state);
  if (done) return;
  const q = state.questions[state.index];
  const picked = state.picked !== null;
  $('#progress').textContent = progressText(state);
  $('#question').textContent = q.question;
  $('#choices').replaceChildren(...q.choices.map((text, i) => {
    const button = document.createElement('button');
    button.className = 'choice';
    button.dataset.index = i;
    button.textContent = text;
    button.disabled = picked;
    if (picked && i === state.picked) button.dataset.result = isCorrect(state) ? 'right' : 'wrong';
    if (picked && i === q.answer) button.dataset.correct = '';
    return button;
  }));
  $('#feedback').textContent = feedbackText(state);
  $('#next').hidden = !picked;
}

$('#choices').addEventListener('click', (e) => {
  if (e.target.dataset.index === undefined) return;
  state = pick(state, Number(e.target.dataset.index));
  render();
});
$('#next').addEventListener('click', () => {
  state = next(state);
  render();
});
$('#restart').addEventListener('click', () => {
  state = start(state.questions);
  render();
});

try {
  const res = await fetch('/questions.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  state = start(await res.json());
  render();
} catch (err) {
  $('#error').textContent = `Could not load questions: ${err.message}`;
  $('#error').hidden = false;
}
