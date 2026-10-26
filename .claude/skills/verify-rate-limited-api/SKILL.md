---
name: verify-rate-limited-api
description: Drive the 09-rate-limited-api node:http JSON API over HTTP with curl and capture response evidence. Use to prove /api/quote or the per-IP rate limiter (429, Retry-After, X-RateLimit-* headers) works on the real running server.
---

# Verify rate-limited-api

Surface: HTTP JSON API (`09-rate-limited-api/`, `node:http`, no deps). Drive with curl.

## Launch
```
cd 09-rate-limited-api && npm install
PORT=3299 RATE_LIMIT=3 RATE_WINDOW_MS=4000 node src/server.js > /tmp/ratelimit-verify.log 2>&1 & echo $! > /tmp/ratelimit-verify.pid
```
Ready when `curl -s -o /dev/null -w '%{http_code}' localhost:3299/api/quote` prints a status. Own port 3299. Small `RATE_LIMIT`/`RATE_WINDOW_MS` make exhaustion and refill fast to drive; omit both to check the defaults (5 per 10000 ms). Limiter state is in memory: restart the server for a fresh bucket.

## Doctor
`kill -0 $(cat /tmp/ratelimit-verify.pid)` and the readiness curl above. Both must succeed; otherwise read `/tmp/ratelimit-verify.log`.

## Drive
`curl -si localhost:3299/api/quote`. Use `-i` so status and headers are captured. All curl calls come from 127.0.0.1, so they share one bucket. Feature recipes in `features/`.

## Evidence
Save every request + full response (status line, headers, body) to the evidence dir, one file per done-when check, e.g. `curl -si localhost:3299/api/quote | tee -a $EVIDENCE/<check>.txt`. Exercise the real HTTP path only. For refill, capture the 429, `sleep` the `Retry-After` seconds, then capture the 200.

## Cleanup
Stop only the PID you started: `kill $(cat /tmp/ratelimit-verify.pid)`. Then delete `/tmp/ratelimit-verify.pid` and `/tmp/ratelimit-verify.log` as a separate command. Never kill by process name. Evidence lives outside the cleanup scope.
