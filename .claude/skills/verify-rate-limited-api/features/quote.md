# Quote endpoint

## Sub-features
`GET /api/quote` returns a JSON quote. Any other route → 404 JSON.

## How to get to it (user POV)
HTTP on `localhost:3299` (verify port).

## Driving it with curl
- `curl -si localhost:3299/api/quote` → `200`, `content-type: application/json`, JSON body with the quote.
- `curl -si localhost:3299/nope` → `404` JSON error.

## Gotchas
Each call spends a rate-limit token; drive the quote check on a fresh server or right after a refill.
