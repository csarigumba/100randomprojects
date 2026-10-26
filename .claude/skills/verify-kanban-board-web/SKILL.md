---
name: verify-kanban-board-web
description: Drive the 10-kanban-board-web single-page kanban (To do / Doing / Done, localStorage) in headless Chrome via python3 Playwright and capture state + screenshots. Use to prove any change to the board page, its add/move/delete buttons, or persistence works in a real browser.
---

# Verify kanban-board-web

Surface: one HTML page served by `10-kanban-board-web/server.js` (`node:http`, no deps). State lives in the browser's `localStorage['kanban-board']`. Drive with `drive.py` (python3 Playwright + system Google Chrome, `channel='chrome'`; Playwright's bundled browsers are not installed on this machine, so don't drop `channel`).

## Launch
```
lsof -iTCP:3410 -sTCP:LISTEN   # must print nothing; if it does, pick another port and use it everywhere below
PORT=3410 npm --prefix 10-kanban-board-web start > /tmp/kanban-verify.log 2>&1 & echo $! > /tmp/kanban-verify.pid
```
Ready when `curl -s localhost:3410/ | grep -c 'data-column='` prints `3`. No install step: zero runtime deps. The pid file holds npm's pid; `lsof -iTCP:3410 -sTCP:LISTEN -t` gives the node child's.

## Doctor
`kill -0 $(cat /tmp/kanban-verify.pid) && curl -s -o /dev/null -w '%{http_code}' localhost:3410/` → `200`. Otherwise read `/tmp/kanban-verify.log`.

## Drive
```
/usr/bin/python3 -I .claude/skills/verify-kanban-board-web/drive.py http://localhost:3410 STEP...
```
Steps, run in order in one browser page:
- `add <title>`: fill `#title`, click `#add-form button[type=submit]`
- `move <title> left|right`: click `[data-action=left|right]` on the `li.card` whose `span.title` matches
- `delete <title>`: click `[data-action=delete]` on that card
- `reload`: reload the page (same context, so localStorage survives)
- `state`: print JSON: column headings, each column's cards with which buttons are enabled, and the raw `localStorage['kanban-board']`
- `shot <path>`: full-page screenshot

Each run is a fresh browser profile (empty localStorage), so runs never see each other or a human's browser. Exits 1 and prints `PAGE ERRORS` on any uncaught page error. Per-feature recipes: `features/README.md`.

## Evidence
One file per done-when check in the evidence dir: `drive.py ... | tee $EVIDENCE/<check>.txt` plus `shot $EVIDENCE/<check>.png` for anything visual. Prove through the real user path (typing, clicking, reloading), never by writing localStorage directly. Capture state before and after the action, and check the side effect (the `localStorage` line in `state`) alongside the DOM.

## Cleanup
Stop only what you started: `kill $(lsof -iTCP:3410 -sTCP:LISTEN -t) $(cat /tmp/kanban-verify.pid)` (node child, then npm). Then, as a separate command, delete `/tmp/kanban-verify.pid` and `/tmp/kanban-verify.log`. Never kill by process name. Evidence lives in the evidence dir you passed, outside this cleanup.
