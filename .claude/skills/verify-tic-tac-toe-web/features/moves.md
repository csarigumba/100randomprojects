# Moves

## Sub-features
- Clicking an empty cell places the current player's mark; turns alternate X, O, X…
- Clicking a filled cell changes nothing (mark and turn stay).

## How to get to it (user POV)
Click cells on the board.

## Driving it with drive.mjs
`drive.mjs URL "$E" 'click:[data-index="4"]' board text:#status 'click:[data-index="4"]' board text:#status 'click:[data-index="0"]' board text:#status`
→ center `X`, `Turn: O`; second click on 4 leaves board and `Turn: O`; then 0 is `O`, `Turn: X`.

## Gotchas
- Quote selectors with brackets so the shell does not glob them.
