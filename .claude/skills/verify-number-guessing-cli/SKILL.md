---
name: verify-number-guessing-cli
description: Drive the 06-number-guessing-cli terminal game over piped stdin with GUESS_SEED and capture stdout, stderr, and exit code as evidence. Use to prove any change to the number guessing CLI works on the real program.
---

# Verify number-guessing-cli

Surface: interactive Node CLI (`06-number-guessing-cli/`, `node src/cli.js`), stdin lines in, text out. No server, no network.

## Launch
`cd 06-number-guessing-cli && npm install` (no runtime deps; creates nothing outside the folder). Each session is one process; nothing to keep running.

## Doctor
`node --version` is 24+ and `printf 'easy\n' | GUESS_SEED=x node src/cli.js` prints `Welcome to the Number Guessing Game!`.

## Drive
Script a session by piping lines: first the difficulty, then guesses.
```
printf 'medium\n50\n25\n' | GUESS_SEED=demo node src/cli.js > out.txt 2> err.txt; echo "exit=$?"
```
Learn the secret for a seed without playing (so a win can be scripted):
`node -e "import('./src/game.js').then(m=>console.log(m.secretFromSeed('demo')))"`.
Recipes per behavior in `features/game.md`.

## Evidence
One file per done-when check in `$EVIDENCE`: the exact command, stdout, stderr, and `exit=<code>`. Pattern:
```
{ echo '$ printf ... | GUESS_SEED=demo node src/cli.js'; printf '...' | GUESS_SEED=demo node src/cli.js 2>&1; echo "exit=$?"; } > $EVIDENCE/<check>.txt
```
Use `2>&1` so error lines show in order. Drive the real CLI only; do not import internals except to read the seed's secret.

## Cleanup
Nothing persists. Delete only temp files you created.
