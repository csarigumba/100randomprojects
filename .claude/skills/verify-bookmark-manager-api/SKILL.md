---
name: verify-bookmark-manager-api
description: Drive the 18-bookmark-manager-api REST API over HTTP with curl and capture response evidence. Use to prove any /bookmarks or /tags change (create, duplicate, filter by tag or text, patch, tag counts, delete) works on the real running server.
---

# Verify bookmark-manager-api

Surface: HTTP JSON API (`18-bookmark-manager-api/`, `node:http`, `node:sqlite`, no deps). Drive with curl. Needs Node 24.2+.

## Launch
Start from a fresh DB so counts are predictable: `rm -f /tmp/bookmark-verify-3318.db` (run it alone), then:
```
cd 18-bookmark-manager-api
PORT=3318 DB_PATH=/tmp/bookmark-verify-3318.db node src/server.js > /tmp/bookmark-verify.log 2>&1 & echo $! > /tmp/bookmark-verify.pid
```
Ready when `curl -s -o /dev/null -w '%{http_code}' -X DELETE localhost:3318/bookmarks/0` prints `404`. Own port 3318 + temp DB, so it never touches a dev instance's data. `DB_PATH` defaults to `bookmarks.db`.

## Doctor
The readiness curl above and `kill -0 $(cat /tmp/bookmark-verify.pid)`. Both must succeed; otherwise read `/tmp/bookmark-verify.log`.

## Drive
Send `-H 'content-type: application/json'` with every body.
- Create: `curl -si -X POST localhost:3318/bookmarks -d '{"url":"https://nodejs.org","title":"Node.js","tags":["js","docs"]}'` → 201 `{id, url, title, tags, createdAt}`, note `id`. Same `url` again → 409. `{"url":"ftp://x.com","title":"a"}`, `{"url":"not a url","title":"a"}`, `{"url":"https://a.com","title":""}` → 400.
- Filter: add a second bookmark tagged `js` and a third without it. `curl -si 'localhost:3318/bookmarks?tag=js'` → only the two tagged. `curl -si 'localhost:3318/bookmarks?q=NODE'` → matches title or url regardless of case.
- Update: `curl -si -X PATCH localhost:3318/bookmarks/<id> -d '{"title":"Node"}'` → 200, `tags` unchanged; `-d '{"tags":["runtime"]}'` → 200, `title` unchanged. Unknown id → 404.
- Tags: `curl -si localhost:3318/tags` → `[{tag, count}]`, highest count first.
- Delete: `curl -si -X DELETE localhost:3318/bookmarks/<id>` → 204, repeat → 404.
- Robustness: `curl -si 'localhost:3318/%E0%A4%A'` → JSON error, server still alive.

## Evidence
Save every request + full response (status line, headers, body) to the evidence dir, one file per done-when check, e.g. `curl -si ... | tee $EVIDENCE/<check>.txt`. Exercise the real HTTP path only; verify side effects with a follow-up request (PATCH then GET list shows the change; DELETE then DELETE → 404). After the run, `kill -0` the PID again: the server must still be alive.

## Cleanup
Stop only the PID you started: `kill $(cat /tmp/bookmark-verify.pid)`. Then delete the pid file, log, and `/tmp/bookmark-verify-*.db` as a separate command. Never kill by process name. Evidence lives in the evidence dir and is never deleted.
