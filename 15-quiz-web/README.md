# Quiz web

A multiple-choice quiz page. A tiny Node server (`node:http`, zero dependencies) validates `questions.json` at startup and serves it; the page shows one question at a time, marks each answer right or wrong, shows the score at the end and can restart. Scoring and validation live in the pure ES module `public/quiz.js`, shared by the browser and the server.

## Run

Requires Node 24.2+ (the server uses `import.meta.main`).

```sh
npm start              # http://localhost:3000
PORT=8080 npm start    # http://localhost:8080
```

A `PORT` that is not an integer from 1 to 65535, or a malformed `questions.json`, makes the server exit 1 with a message naming the problem.

## Test

```sh
npm test               # node --test: unit + server integration tests, no network or browser
```

## Questions

`questions.json` is an array of `{ "question": string, "choices": [3 or 4 strings], "answer": index of the correct choice }`.

## Routes

- `GET /` returns the page (`text/html`):
  `curl -i http://localhost:3000/` → `200`, `content-type: text/html; charset=utf-8`
- `GET /app.js` returns the page script (`text/javascript`):
  `curl -i http://localhost:3000/app.js` → `200`, `content-type: text/javascript; charset=utf-8`
- `GET /quiz.js` returns the scoring and validation module (`text/javascript`):
  `curl -i http://localhost:3000/quiz.js` → `200`, `content-type: text/javascript; charset=utf-8`
- `GET /questions.json` returns the validated questions (`application/json`):
  `curl -s http://localhost:3000/questions.json` → `[{"question":"What is the capital of France?","choices":["Berlin","Paris","Madrid","Rome"],"answer":1},...]`
- Any other path or method → `404`.

## Usage

Open the page: it shows `Question 1 of 6`. Click a choice: it is marked right or wrong, the feedback reads `Correct!` or `Wrong — answer: <correct choice>`, and a Next button appears. After the last question the page shows the score, e.g. `4 / 6`, and a Restart button that starts again at question 1 with the score at 0.
