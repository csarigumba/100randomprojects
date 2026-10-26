# Rate limit

## Sub-features
Per-client-IP token bucket of `RATE_LIMIT` (default 5) tokens refilled every `RATE_WINDOW_MS` (default 10000). Over the limit → `429` with `Retry-After` (seconds) and a JSON error. Every response carries `X-RateLimit-Limit` and `X-RateLimit-Remaining`.

## How to get to it (user POV)
Repeated `GET /api/quote` from one client.

## Driving it with curl
- Exhaust: `for i in $(seq 1 4); do curl -si localhost:3299/api/quote; echo; done` with `RATE_LIMIT=3` → three `200`s with `X-RateLimit-Remaining` 2,1,0, then `429` with `Retry-After` and JSON error.
- Refill: after the 429, `sleep <Retry-After>` then `curl -si localhost:3299/api/quote` → `200` again.
- Defaults: launch without `RATE_LIMIT`/`RATE_WINDOW_MS`; first response shows `X-RateLimit-Limit: 5`, the 6th request is `429`.
- Headers on non-quote routes: `curl -si localhost:3299/nope` also carries `X-RateLimit-*`.

## Gotchas
All local curls share the 127.0.0.1 bucket. Restart the server between scenarios for a clean bucket.
