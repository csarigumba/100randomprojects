# Number Guessing CLI

Terminal game: the computer picks a number from 1 to 100, you guess it with higher/lower hints. Node 24+, stdlib only.

## Run

```
npm install
npm start
npm test
```

Difficulty: `easy` (10 chances), `medium` (5), `hard` (3); `1`/`2`/`3` also work. Invalid guesses don't use a chance. Exits 0 on win or loss, 1 if stdin ends mid-game.

Env: `GUESS_SEED` makes the secret deterministic (default: random), so sessions can be scripted:

```
printf 'medium\n50\n75\n53\n' | GUESS_SEED=demo npm start --silent
```

## Example session

```
$ GUESS_SEED=demo npm start --silent
Welcome to the Number Guessing Game!
I'm thinking of a number between 1 and 100.
Choose a difficulty: easy (10 chances), medium (5 chances), hard (3 chances)
Difficulty: medium
Great! You have chosen medium. You have 5 chances.
Enter your guess: 50
Incorrect! The number is greater than 50.
Enter your guess: 75
Incorrect! The number is less than 75.
Enter your guess: 53
Congratulations! You guessed the correct number in 3 attempts.
```
