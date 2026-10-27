# Pomodoro timer web

A Pomodoro focus timer page. A tiny Node server (`node:http`, zero dependencies) serves the page; the timer alternates work and break sessions. The timer logic lives in the pure ES module `public/pomodoro.js`; `public/app.js` wires it to the page.

## Run

Requires Node 24.2+ (the server uses `import.meta.main`).

```sh
npm start              # http://localhost:3000
PORT=8080 npm start    # http://localhost:8080
```

A `PORT` that is not an integer from 1 to 65535 makes the server exit 1 with a message naming `PORT`.

## Test

```sh
npm test               # node --test: unit + server integration tests, no network or browser
```

## Routes

- `GET /` returns the page (`text/html`):
  `curl -i http://localhost:3000/` → `200`, `content-type: text/html; charset=utf-8`
- `GET /app.js` returns the page script (`text/javascript`):
  `curl -i http://localhost:3000/app.js` → `200`, `content-type: text/javascript; charset=utf-8`
- `GET /pomodoro.js` returns the timer logic module (`text/javascript`):
  `curl -i http://localhost:3000/pomodoro.js` → `200`, `content-type: text/javascript; charset=utf-8`
- Any other path or method → `404`.

## Usage

Open the page: it shows `25:00` and `Work`. Start begins the countdown, Pause stops it, Reset returns to a fresh `25:00` work session. A work session lasts 25:00 and is followed by a 05:00 short break; after every 4th work session the break is a 15:00 long break instead. The page shows the count of completed work sessions. When a session ends the timer continues into the next one on its own. It keeps correct time in a background tab because it counts down from wall-clock time, not from timer ticks.
