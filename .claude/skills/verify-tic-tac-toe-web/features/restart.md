# Restart

## Sub-features
- `#restart` clears the board and sets `Turn: X`, from mid-game or after a win/draw.

## How to get to it (user POV)
Click the Restart button.

## Driving it with drive.mjs
`drive.mjs URL "$E" 'click:[data-index="0"]' 'click:[data-index="1"]' board click:#restart board text:#status 'click:[data-index="4"]' board`
→ board empty, `Turn: X`, next click places `X`.

## Gotchas
- Restart after a win too, to prove play resumes.
