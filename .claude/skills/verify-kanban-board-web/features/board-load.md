# Board loads

## Sub-features
- `npm start` serves `/`, `/app.js`, `/board.js`; anything else 404.
- Three `section[data-column]`: `todo` "To do", `doing` "Doing", `done` "Done".

## How to get to it (user POV)
`cd 10-kanban-board-web && npm start`, open `http://localhost:3000`.

## Driving it with drive.py
`curl -si localhost:3410/` for the served HTML, then `drive.py http://localhost:3410 state shot $EVIDENCE/1-columns.png` → `headings` is `["To do","Doing","Done"]`.

## Gotchas
- The skill launches with `PORT=3410 npm start`, so a passing launch already proves `npm start` serves the page.
