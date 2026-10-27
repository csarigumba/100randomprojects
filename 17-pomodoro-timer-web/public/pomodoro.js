export const DURATIONS = { work: 25 * 60_000, short: 5 * 60_000, long: 15 * 60_000 };
export const LABELS = { work: 'Work', short: 'Short break', long: 'Long break' };

export function initial() {
  return { mode: 'work', completed: 0, remaining: DURATIONS.work, startedAt: null };
}

export const reset = initial;

export function start(state, now) {
  return state.startedAt === null ? { ...state, startedAt: now } : state;
}

export function pause(state, now) {
  return state.startedAt === null ? state : { ...tick(state, now), startedAt: null };
}

export function tick(state, now) {
  if (state.startedAt === null) return state;
  let { mode, completed, remaining } = state;
  let elapsed = now - state.startedAt;
  while (elapsed >= remaining) {
    elapsed -= remaining;
    if (mode === 'work') {
      completed += 1;
      mode = completed % 4 === 0 ? 'long' : 'short';
    } else {
      mode = 'work';
    }
    remaining = DURATIONS[mode];
  }
  return { mode, completed, remaining: remaining - elapsed, startedAt: now };
}

export function format(ms) {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
