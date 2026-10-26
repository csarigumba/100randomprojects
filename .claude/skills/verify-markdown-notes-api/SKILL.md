---
name: verify-markdown-notes-api
description: Drive the 12-markdown-notes-api REST API over HTTP with curl and capture response evidence. Use to prove any /notes endpoint or markdown-to-HTML rendering change works on the real running server.
---

# Verify markdown-notes-api

Surface: HTTP API (`12-markdown-notes-api/`, `node:http`, `node:sqlite`, no deps). Drive with curl. Needs Node 24.2+.

## Launch
```
cd 12-markdown-notes-api
PORT=3312 DB_PATH=/tmp/notes-verify-3312.db node src/server.js > /tmp/notes-verify.log 2>&1 & echo $! > /tmp/notes-verify.pid
```
Ready when `curl -s -o /dev/null -w '%{http_code}' localhost:3312/notes` prints `200`. Own port 3312 + temp DB, so it never touches a dev instance's data. `DB_PATH` defaults to `notes.db`.

## Doctor
The readiness curl above and `kill -0 $(cat /tmp/notes-verify.pid)`. Both must succeed; otherwise read `/tmp/notes-verify.log`. A bad `PORT` (e.g. `PORT=abc`) must exit 1 naming `PORT`.

## Drive
- Create: `curl -si -X POST localhost:3312/notes -H 'content-type: application/json' -d '{"title":"Hi","markdown":"# Hello\n\n**bold**"}'` → 201 with `id`, `title`, `createdAt`; note `id`. Missing/empty `title` or `markdown`, or non-JSON → 400.
- List: `curl -si localhost:3312/notes` → 200 array, newest first.
- Read: `curl -si localhost:3312/notes/<id>` → 200 with `markdown`; unknown id → 404.
- HTML: `curl -si localhost:3312/notes/<id>/html` → 200 `content-type: text/html; charset=utf-8`. Post a note using every feature (headings, paragraph, `**bold**`, `*italic*`, `` `code` ``, `[link](https://x)`, `- list`) plus raw `<script>alert(1)</script>`; the body must contain the tags and `&lt;script&gt;`, never `<script>`.
- Delete: `curl -si -X DELETE localhost:3312/notes/<id>` → 204, then GET → 404.

## Evidence
Save every request + full response (status line, headers, body) to the evidence dir, one file per done-when check, e.g. `curl -si ... | tee $EVIDENCE/<check>.txt`. Exercise the real HTTP path only; verify side effects with a follow-up request (DELETE then GET → 404). After the run, `kill -0` the PID again: the server must still be alive.

## Cleanup
Stop only the PID you started: `kill $(cat /tmp/notes-verify.pid)`. Then delete the pid file, log, and `/tmp/notes-verify-*.db` as a separate command. Never kill by process name.
