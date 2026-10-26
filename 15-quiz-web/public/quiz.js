export function validateQuestions(data) {
  if (!Array.isArray(data) || data.length === 0) throw new Error('questions must be an array with at least one question');
  data.forEach((q, i) => {
    const fail = (problem) => { throw new Error(`question ${i + 1}: ${problem}`); };
    if (typeof q?.question !== 'string' || !q.question) fail('question must be a non-empty string');
    const { choices, answer } = q;
    if (!Array.isArray(choices) || choices.length < 3 || choices.length > 4 || !choices.every((c) => typeof c === 'string' && c)) {
      fail('choices must be 3-4 non-empty strings');
    }
    if (!Number.isInteger(answer) || answer < 0 || answer >= choices.length) fail('answer out of range');
  });
  return data;
}

export function start(questions) {
  return { questions, index: 0, score: 0, picked: null };
}

export function pick(state, choiceIndex) {
  if (state.picked !== null || isFinished(state)) return state;
  const picked = { ...state, picked: choiceIndex };
  return isCorrect(picked) ? { ...picked, score: picked.score + 1 } : picked;
}

export function next(state) {
  return state.picked === null ? state : { ...state, index: state.index + 1, picked: null };
}

export function isCorrect(state) {
  return state.picked === state.questions[state.index].answer;
}

export function isFinished(state) {
  return state.index >= state.questions.length;
}

export function scoreText(state) {
  return `${state.score} / ${state.questions.length}`;
}
