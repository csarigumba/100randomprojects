---
name: verify-quiz-web
description: Drive the 15-quiz-web multiple-choice quiz page (node:http server, questions from questions.json) in headless Chromium via python3 Playwright and capture state JSON + screenshots. Use to prove any change to the quiz page, its scoring, Next/Restart flow, server routes, or questions.json validation works on the real app.
---

# Verify quiz-web

Surface: one HTML page served by `15-quiz-web/server.js` (`node:http`, no deps). The server validates `questions.json` at startup and serves it at `/questions.json`; the page (`public/app.js` + pure `public/quiz.js`) shows one question at a time. No storage, no auth. Second surface: startup validation (bad `PORT` or malformed `questions.json` exits 1).

## Launch
```
lsof -iTCP:3515 -sTCP:LISTEN   # must print nothing; else pick another port and use it everywhere below
PORT=3515 npm --prefix 15-quiz-web start > /tmp/quiz-verify.log 2>&1 & echo $! > /tmp/quiz-verify.pid
```
Ready when `/tmp/quiz-verify.log` prints `http://localhost:3515` and `curl -s -o /dev/null -w '%{http_code}' localhost:3515/` prints `200`. The pid file holds npm's pid; `lsof -iTCP:3515 -sTCP:LISTEN -t` gives the node child's.

## Doctor
`kill -0 $(cat /tmp/quiz-verify.pid) && curl -s localhost:3515/questions.json | head -c 200` → JSON array. Otherwise read `/tmp/quiz-verify.log`; never drive an instance you did not start.

## Drive
Needs a `python3` with `playwright`; on this machine call `/usr/bin/python3` explicitly (Homebrew python3 on PATH lacks it). It uses the newest cached `chromium_headless_shell`, else Playwright's default.
```
/usr/bin/python3 -I .claude/skills/verify-quiz-web/drive.py http://localhost:3515 STEP...
```
Steps run in order in one page (fresh browser each run):
- `pick <i>`: click `#choices .choice[data-index=i]`
- `right` / `wrong`: pick the correct / a wrong choice of the current question (answer read from `/questions.json`)
- `next`, `restart`: click `#next` / `#restart`
- `state`: print JSON: visibility of `#quiz`/`#result`/`#error`/`#next`/`#restart`, `#progress`, `#question`, each choice (`text`, `disabled`, `data-result`, `data-correct`), `#feedback`, `#score`
- `shot <path>`: full-page screenshot

First output line is `{"questions_json_count": N}`. Exits 1 with `PAGE ERRORS` on any uncaught page error. Recipes per feature: `features/README.md`.

## Evidence
One file per done-when check in the caller's evidence dir: `drive.py ... | tee $EVIDENCE/<check>.txt` plus `shot $EVIDENCE/<check>.png`. Drive through clicks on the real page; never import `quiz.js` from Python/Node as browser proof (that is what `npm test` covers). Capture `state` before and after each action that matters (pick, next, restart).

## Cleanup
`kill $(lsof -iTCP:3515 -sTCP:LISTEN -t) $(cat /tmp/quiz-verify.pid)` (node child, then npm), then as a separate command delete `/tmp/quiz-verify.pid` and `/tmp/quiz-verify.log`. Scratch copies made for startup checks live in a `mktemp -d` dir; delete it. Never kill by process name. Evidence stays in the evidence dir.
