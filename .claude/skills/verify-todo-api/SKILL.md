---
name: verify-todo-api
description: Drive the 14-todo-api REST API over HTTP with curl and capture response evidence. Use to prove any /todos change (create, update, filter, paginate, delete) works on the real running server.
---

# Verify todo-api

Surface: HTTP JSON API (`14-todo-api/`, `node:http`, `node:sqlite`, no deps). Drive with curl. Needs Node 24.2+.

## Launch
Start from a fresh DB so `total` counts are predictable: `rm -f /tmp/todo-verify-3314.db` (run it alone), then:
```
cd 14-todo-api
PORT=3314 DB_PATH=/tmp/todo-verify-3314.db node src/server.js > /tmp/todo-verify.log 2>&1 & echo $! > /tmp/todo-verify.pid
```
Ready when `curl -s -o /dev/null -w '%{http_code}' localhost:3314/todos/0` prints `404`. Own port 3314 + temp DB, so it never touches a dev instance's data. `DB_PATH` defaults to `todos.db`.

## Doctor
The readiness curl above and `kill -0 $(cat /tmp/todo-verify.pid)`. Both must succeed; otherwise read `/tmp/todo-verify.log`.

## Drive
- Create: `curl -si -X POST localhost:3314/todos -H 'content-type: application/json' -d '{"title":"buy milk"}'` → 201 `{id, title, done:false, createdAt}`, note `id`. Empty title (`{"title":""}`) → 400.
- Update: `curl -si -X PATCH localhost:3314/todos/<id> -H 'content-type: application/json' -d '{"done":true}'` → 200; fields not sent keep their values. Unknown id → 404; wrong types (`{"done":"yes"}`, `{"title":1}`) → 400.
- Filter: `curl -si 'localhost:3314/todos?done=true'` and `?done=false` → only matching todos in `data`.
- Paginate: `curl -si 'localhost:3314/todos?page=2&limit=2'` → `{data, page, limit, total}`; default limit 10, max 100. `limit=101`, `limit=0`, `page=0`, `page=abc` → 400.
- Delete: `curl -si -X DELETE localhost:3314/todos/<id>` → 204, repeat → 404.

## Evidence
Save every request + full response (status line, headers, body) to the evidence dir, one file per done-when check, e.g. `curl -si ... | tee $EVIDENCE/<check>.txt`. Exercise the real HTTP path only; verify side effects with a follow-up request (PATCH then GET list shows the change; DELETE then DELETE → 404). After the run, `kill -0` the PID again: the server must still be alive.

## Cleanup
Stop only the PID you started: `kill $(cat /tmp/todo-verify.pid)`. Then delete the pid file, log, and `/tmp/todo-verify-*.db` as a separate command. Never kill by process name. Evidence lives in the evidence dir and is never deleted.
