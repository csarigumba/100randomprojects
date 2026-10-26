# Unit converter web

A single web page that converts length (mm, cm, m, km, in, ft, yd, mi), weight (mg, g, kg, oz, lb) and temperature (C, F, K). A tiny Node server (`node:http`, zero dependencies) serves the page; conversion runs in the browser via the ES module `public/convert.js`.

## Run

Requires Node 24.2+.

```sh
npm start              # http://localhost:3000
PORT=8080 npm start    # http://localhost:8080
```

## Test

```sh
npm test               # node --test: unit + server integration tests, no network or browser
```

## Routes

- `GET /` returns the page (`text/html`):
  `curl -i http://localhost:3000/` → `200`, `content-type: text/html; charset=utf-8`
- `GET /convert.js` returns the conversion module (`text/javascript`):
  `curl -i http://localhost:3000/convert.js` → `200`, `content-type: text/javascript; charset=utf-8`
- Any other path → `404`.

## Usage

Open the page, go to the Temperature section, enter `100`, choose from `C` to `F`, press Convert: the result shows `212 F`. Non-numeric or empty input shows `Enter a number` instead of a result.
