# Feature map: kanban-board-web

| feature | file | proves |
|---|---|---|
| Board loads with three columns | `board-load.md` | page served by `npm start`, headings To do / Doing / Done |
| Add a card | `add-card.md` | card lands in To do; empty/whitespace title rejected |
| Move and delete a card | `move-delete.md` | left/right one column; Delete takes it off the board |
| Persistence | `persistence.md` | reload keeps every card in its column |
