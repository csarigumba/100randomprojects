---
name: verify-url-shortener-api
description: Drive the 04-url-shortener-api REST API over HTTP with curl and capture response evidence. Use to prove any /shorten or /:code redirect change works on the real running server.
---

# Verify url-shortener-api

Surface: HTTP JSON API (`04-url-shortener-api/`, `node:http`, `node:sqlite`, no deps). Drive with curl. Needs Node 24.2+.

## Launch
```
cd 04-url-shortener-api
PORT=3299 DB_PATH=/tmp/short-verify-3299.db node src/server.js > /tmp/short-verify.log 2>&1 & echo $! > /tmp/short-verify.pid
```
Ready when `curl -s -o /dev/null -w '%{http_code}' localhost:3299/shorten/nope` prints `404`. Own port 3299 + temp DB, so it never touches a dev instance's data. `DB_PATH` defaults to `urls.db`.

## Doctor
The readiness curl above and `kill -0 $(cat /tmp/short-verify.pid)`. Both must succeed; otherwise read `/tmp/short-verify.log`.

## Drive
- Create: `curl -si -X POST localhost:3299/shorten -H 'content-type: application/json' -d '{"url":"https://example.com/a"}'` → 201, note `shortCode`.
- Read / update / delete: `curl -si [-X PUT|-X DELETE] localhost:3299/shorten/<code> [-H ... -d '{"url":"..."}']`.
- Stats: `curl -si localhost:3299/shorten/<code>/stats`.
- Redirect: `curl -si localhost:3299/<code>` (no `-L`) → 302 with `location:` header; then stats shows `accessCount` up by one.

## Evidence
Save every request + full response (status line, headers, body) to the evidence dir, one file per done-when check, e.g. `curl -si ... | tee $EVIDENCE/<check>.txt`. Exercise the real HTTP path only; verify side effects with a follow-up request (DELETE then GET → 404; redirect then stats). After the run, `kill -0` the PID again: the server must still be alive.

## Cleanup
Stop only the PID you started: `kill $(cat /tmp/short-verify.pid)`. Then delete the pid file, log, and `/tmp/short-verify-*.db` as a separate command. Never kill by process name.
