# rate-limited-api

Tiny JSON API (Node 24.2+, `node:http`, zero deps) with a per-client token-bucket rate limiter. Each client IP (`req.socket.remoteAddress`) gets `RATE_LIMIT` tokens, refilled continuously so an empty bucket is full again after `RATE_WINDOW_MS`. Every request, including 404s, costs one token.

## Run

```
npm start      # listens on PORT
npm test       # node --test
```

## Env vars

| var | default | meaning |
|-----|---------|---------|
| `PORT` | 3000 | listen port |
| `RATE_LIMIT` | 5 | bucket size (requests) |
| `RATE_WINDOW_MS` | 10000 | ms to refill an empty bucket |

`RATE_LIMIT` and `RATE_WINDOW_MS` must be positive integers; the server throws at startup otherwise.

## Endpoints

Every response carries `content-type: application/json`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

`GET /api/quote` → 200

```
$ curl -i localhost:3000/api/quote
HTTP/1.1 200 OK
content-type: application/json
x-ratelimit-limit: 5
x-ratelimit-remaining: 4
{"text":"Simplicity is prerequisite for reliability.","author":"Edsger W. Dijkstra"}
```

Any other route → 404

```
$ curl -i localhost:3000/nope
HTTP/1.1 404 Not Found
content-type: application/json
x-ratelimit-limit: 5
x-ratelimit-remaining: 3
{"error":"not found"}
```

Over the limit (any route) → 429 with `Retry-After` in whole seconds

```
$ curl -i localhost:3000/api/quote  # 6th rapid request
HTTP/1.1 429 Too Many Requests
content-type: application/json
x-ratelimit-limit: 5
x-ratelimit-remaining: 0
retry-after: 2
{"error":"rate limit exceeded"}
```
