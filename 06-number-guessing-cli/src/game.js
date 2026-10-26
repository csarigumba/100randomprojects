import { createHash } from 'node:crypto';

export const DIFFICULTIES = { easy: 10, medium: 5, hard: 3 };
const levels = Object.keys(DIFFICULTIES);

export function secretFromSeed(seed) {
  return (createHash('sha256').update(seed).digest().readUInt32BE(0) % 100) + 1;
}

export function parseDifficulty(input) {
  const s = input.trim().toLowerCase();
  if (/^[123]$/.test(s)) return levels[s - 1];
  return levels.includes(s) ? s : null;
}

export function parseGuess(input) {
  const s = input.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 100 ? n : null;
}
