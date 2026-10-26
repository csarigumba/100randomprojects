# Game

## Sub-features
Difficulty pick (easy 10 / medium 5 / hard 3), higher/lower hints, win with attempt count, loss reveals number, input validation, `GUESS_SEED` determinism.

## Driving it
Let `S` = secret for the seed (see SKILL.md Drive). Pick guesses relative to `S`.
- Difficulty: `printf 'hard\n...'` → `Great! You have chosen hard. You have 3 chances.` Bad level (`printf 'nope\nhard\n...'`) → stderr `Invalid difficulty...`, re-asks.
- Hints: guess below S → `greater than <guess>`; above → `less than <guess>`.
- Win: guesses ending in S → `Congratulations! You guessed the correct number in <k> attempts.`, exit 0.
- Loss: `hard` + 3 wrong guesses → `Game over! You ran out of chances. The number was <S>.`, exit 0.
- Invalid guess: `abc`, `0`, `101`, `5.5` → stderr `Invalid guess...`; chance count unchanged (e.g. `hard` + `abc` + 3 wrong guesses still reaches 3 hints before game over).
- Determinism: same seed + same stdin twice → identical output (`diff` the two runs).

## Gotchas
Out of input before the game ends → `No more input.` exit 1; always script enough lines. Prompts have no trailing newline, so lines may join with the next output.
