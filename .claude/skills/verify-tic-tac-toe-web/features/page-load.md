# Page load

## Sub-features
- `npm start` serves the page at `/`; a 3x3 board and the current turn are visible. First turn is X.

## How to get to it (user POV)
Open `http://localhost:<PORT>/`.

## Driving it with drive.mjs
`drive.mjs URL "$E" text:#status board shot:page-load` → `text #status = "Turn: X"`, board all `.`.

## Gotchas
- Launch with `npm start` (as in SKILL.md), since the done-when check names it.
