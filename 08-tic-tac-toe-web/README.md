# Tic-tac-toe Web

Two-player tic-tac-toe in the browser, served by a tiny `node:http` server. No dependencies. Needs Node 24+.

## Run

```
npm start          # listens on PORT (default 3000), open http://localhost:3000
PORT=8080 npm start
npm test           # unit (game.js) + server tests via node --test
```

## Endpoints

Static files only; anything else is 404.

```
curl localhost:3000/            # the game page
curl localhost:3000/index.html  # same page
curl localhost:3000/app.js      # UI script
curl localhost:3000/game.js     # pure outcome(board) -> 'X' | 'O' | 'draw' | null
```
