---
name: verify-blogging-api
description: Drive the 01-blogging-platform-api Fastify REST API over HTTP with curl and capture response evidence. Use to prove any /articles endpoint change works on the real running server.
---

# Verify blogging-platform-api

Surface: HTTP JSON API (`01-blogging-platform-api/`, Fastify, `node:sqlite`). Drive with curl.

## Launch
```
cd 01-blogging-platform-api && npm install
PORT=3199 DB_PATH=/tmp/blog-verify-3199.db node src/server.js > /tmp/blog-verify.log 2>&1 & echo $! > /tmp/blog-verify.pid
```
Ready when `curl -s localhost:3199/health` returns `{"ok":true}`. Own port 3199 + temp DB, so it never touches a dev instance's data. `DB_PATH` defaults to `blog.db` (`:memory:` also works).

## Doctor
`curl -s localhost:3199/health` and `kill -0 $(cat /tmp/blog-verify.pid)`. Both must succeed; otherwise read `/tmp/blog-verify.log`.

## Drive
`curl -si -X METHOD localhost:3199/articles... -H 'content-type: application/json' -d '{...}'`. Use `-i` so status code is captured. Feature recipes in `features/articles.md`.

## Evidence
Save every request + full response (status line, headers, body) to the evidence dir, one file per done-when check, e.g. `curl -si ... | tee $EVIDENCE/<check>.txt`. Exercise the real HTTP path only; verify side effects with a follow-up GET (e.g. DELETE then GET → 404). Evidence lives outside the cleanup scope.

## Cleanup
Stop only the PID you started: `kill $(cat /tmp/blog-verify.pid)`. Then delete the pid file, log, and `/tmp/blog-verify-*.db` as a separate command. Never kill by process name.
