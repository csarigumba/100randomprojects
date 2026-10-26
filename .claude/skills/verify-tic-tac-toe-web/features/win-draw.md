# Win and draw

## Sub-features
- Three in a row (3 rows, 3 columns, 2 diagonals) shows `Winner: X|O` and stops play: further clicks on empty cells do nothing.
- Full board with no line shows `Draw`.

## How to get to it (user POV)
Play a game to the end.

## Driving it with drive.mjs
Win (top row for X): clicks `0 3 1 4 2` → `Winner: X`; then `click:[data-index="8"]` → cell 8 stays empty.
Draw: clicks `0 1 2 4 3 5 7 6 8` → board `X O X / X O O / O X X`, status `Draw`.

## Gotchas
- Every line is covered by the unit tests; the browser check needs one win, the stop-play click, and one draw. Driving a column and a diagonal win too is cheap and catches wiring bugs.
