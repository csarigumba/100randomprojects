import { createInterface } from 'node:readline';
import { randomInt } from 'node:crypto';
import { DIFFICULTIES, secretFromSeed, parseDifficulty, parseGuess } from './game.js';

const seed = process.env.GUESS_SEED;
const secret = seed === undefined ? randomInt(1, 101) : secretFromSeed(seed);

console.log('Welcome to the Number Guessing Game!');
console.log("I'm thinking of a number between 1 and 100.");
console.log('Choose a difficulty: easy (10 chances), medium (5 chances), hard (3 chances)');
process.stdout.write('Difficulty: ');

let level = null;
let attempts = 0;
let over = false;

for await (const line of createInterface({ input: process.stdin })) {
  if (!level) {
    level = parseDifficulty(line);
    if (level) {
      console.log(`Great! You have chosen ${level}. You have ${DIFFICULTIES[level]} chances.`);
      process.stdout.write('Enter your guess: ');
    } else {
      console.error('Invalid difficulty: choose easy, medium, or hard.');
      process.stdout.write('Difficulty: ');
    }
    continue;
  }
  const guess = parseGuess(line);
  if (guess === null) {
    console.error('Invalid guess: enter a whole number from 1 to 100.');
  } else {
    attempts++;
    if (guess === secret) {
      console.log(`Congratulations! You guessed the correct number in ${attempts} attempts.`);
      over = true;
    } else {
      console.log(`Incorrect! The number is ${secret > guess ? 'greater' : 'less'} than ${guess}.`);
      if (attempts === DIFFICULTIES[level]) {
        console.log(`Game over! You ran out of chances. The number was ${secret}.`);
        over = true;
      }
    }
  }
  if (over) break;
  process.stdout.write('Enter your guess: ');
}
process.stdin.destroy();

if (!over) {
  console.error('No more input.');
  process.exitCode = 1;
}
