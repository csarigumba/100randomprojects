---
name: verify-tic-tac-toe-web
description: Drive the 08-tic-tac-toe-web browser game (Node http server + static page) in headless system Chrome over CDP and capture screenshots and DOM transcripts. Use to prove any board, turn, win/draw, or restart change works in the real page.
---

# Verify tic-tac-toe-web

Surface: browser page served by `08-tic-tac-toe-web/src/server.js` (`node:http`, no deps). Driver: `drive.mjs` here — launches headless system Chrome with a throwaway profile and talks CDP over Node's built-in `WebSocket`. Needs Node 24+ and `/Applications/Google Chrome.app` (override with `CHROME=/path/to/chrome`). `npm test` in the folder covers the pure game module and server routes; it is not browser proof.

## Launch
```
cd 08-tic-tac-toe-web
PORT=3298 npm start > /tmp/ttt-verify.log 2>&1 & echo $! > /tmp/ttt-verify.pid
```
Ready when `curl -s -o /dev/null -w '%{http_code}' localhost:3298/` prints `200`. Own port 3298; the game keeps no server-side state, so instances never interfere. Pick another port if 3298 is taken.

## Doctor
`kill -0 $(cat /tmp/ttt-verify.pid) && curl -s localhost:3298/ | grep -q 'id="board"'`. Fails → read `/tmp/ttt-verify.log`.

## Drive
Each `drive.mjs` call is one fresh page load (fresh game), then steps in order:
```
node .claude/skills/verify-tic-tac-toe-web/drive.mjs http://localhost:3298/ "$EVIDENCE" <step>...
```
Steps: `click:<css>` (real mouse press/release at element center), `text:<css>` (prints trimmed textContent), `board` (prints the 3x3 grid, `.` = empty), `shot:<name>` (PNG to `$EVIDENCE/<name>.png`), `wait:<ms>`. Exits 1 on a missing element or any uncaught page exception (printed as `page error:`).

DOM handles (contract):
- `#board` holds 9 cells `#board [data-index="0".."8"]`, row-major (0 1 2 / 3 4 5 / 6 7 8); text `X`, `O`, or empty.
- `#status`: `Turn: X` / `Turn: O`, `Winner: X` / `Winner: O`, `Draw`.
- `#restart`: Restart button.

Feature recipes: `features/README.md`.

## Evidence
One transcript per done-when check, with a screenshot of the end state: `node .../drive.mjs URL "$EVIDENCE" ... shot:<check> | tee "$EVIDENCE/<check>.txt"`. Click cells through `click:` (real input events); never call page functions or set the DOM directly. Capture state before and after the action (`text:#status`, `board`), not just the final screen. Evidence lives in the caller's evidence dir, outside cleanup.

## Cleanup
Stop only the PID you started: `kill $(cat /tmp/ttt-verify.pid)`. Then, as a separate command, delete `/tmp/ttt-verify.pid` and `/tmp/ttt-verify.log`. `drive.mjs` kills its own Chrome and deletes its temp profile (`$TMPDIR/ttt-chrome-*`). Never kill by process name.
