# kanban-board-web

Single-page kanban board with three columns: To do, Doing, Done. Add a card, move it left or right, delete it. Cards are kept in the browser's `localStorage`, so they survive a reload. Node 24+, zero dependencies.

## Run

```
npm start
```

Serves the page on `http://localhost:3000`. Set `PORT` to use another port:

```
PORT=8080 npm start
```

## Test

```
npm test
```

Runs every test with `node --test`; no network or browser needed.
