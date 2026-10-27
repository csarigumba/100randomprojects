---
name: verify-pomodoro-timer-web
description: Drive the 17-pomodoro-timer-web focus timer page (node:http server, pure state machine in public/pomodoro.js) in headless Chromium via python3 Playwright with a fake clock, and capture state JSON + screenshots. Use to prove any change to the work/break timer, Start/Pause/Reset, session counting, long breaks, background-tab timing, server routes, or PORT validation works on the real app.
---

# Verify pomodoro-timer-web

Surface: one HTML page served by `17-pomodoro-timer-web/server.js` (`node:http`, no deps). The page (`public/app.js` + pure `public/pomodoro.js`) shows `#time` (`MM:SS`), `#mode` (`Work` / `Short break` / `Long break`, `data-mode=work|short|long`), `#count` (completed work sessions) and `#start` / `#pause` / `#reset`. No storage, no auth. Second surface: startup `PORT` validation (exit 1).

## Launch
```
lsof -iTCP:3517 -sTCP:LISTEN   # must print nothing; else pick another port and use it everywhere below
PORT=3517 npm --prefix 17-pomodoro-timer-web start > /tmp/pomodoro-verify.log 2>&1 & echo $! > /tmp/pomodoro-verify.pid
```
Ready when `/tmp/pomodoro-verify.log` prints `http://localhost:3517` and `curl -s -o /dev/null -w '%{http_code}' localhost:3517/` prints `200`. The pid file holds npm's pid; `lsof -iTCP:3517 -sTCP:LISTEN -t` gives the node child's.

## Doctor
`kill -0 $(cat /tmp/pomodoro-verify.pid) && curl -s localhost:3517/pomodoro.js | head -c 200` → JS source. Otherwise read `/tmp/pomodoro-verify.log`; never drive an instance you did not start.

## Drive
Needs a `python3` with `playwright` >= 1.45 (`page.clock`); on this machine call `/usr/bin/python3` explicitly (Homebrew python3 on PATH lacks it). It uses the newest cached `chromium_headless_shell`, else Playwright's default.
```
/usr/bin/python3 -I .claude/skills/verify-pomodoro-timer-web/drive.py http://localhost:3517 STEP...
```
Playwright's fake clock is installed before the page loads, so 25 minutes take milliseconds. Steps run in order in one page (fresh browser each run):
- `start`, `pause`, `reset`: click `#start` / `#pause` / `#reset`
- `run <ms>`: advance time firing every timer on schedule (foreground tab)
- `ff <ms>`: jump wall-clock time forward firing due timers at most once (throttled background tab)
- `state`: print JSON: `time`, `mode`, `data_mode`, `count`, `title`, `start_disabled`, `pause_disabled`, `reset_disabled`
- `shot <path>`: full-page screenshot

Exits 1 with `PAGE ERRORS` on any uncaught page error. Durations: work 1500000 ms, short 300000, long 900000. Recipes per feature: `features/README.md`.

## Evidence
One file per done-when check in the caller's evidence dir: `drive.py ... | tee $EVIDENCE/<check>.txt` plus `shot $EVIDENCE/<check>.png`. Drive through clicks on the real page; never import `pomodoro.js` from Python/Node as browser proof (that is what `npm test` covers). Capture `state` before and after each action that matters.

## Cleanup
`kill $(lsof -iTCP:3517 -sTCP:LISTEN -t) $(cat /tmp/pomodoro-verify.pid)` (node child, then npm), then as a separate command delete `/tmp/pomodoro-verify.pid` and `/tmp/pomodoro-verify.log`. Never kill by process name. Evidence stays in the evidence dir.
