---
name: verify-unit-converter-web
description: Drive the 03-unit-converter-web page (node:http static server + browser page converting length, weight, temperature) in headless Chromium and capture screenshot + JSON evidence. Use to prove any change to 03-unit-converter-web works in the real browser.
---

# Verify unit-converter-web

Surface: one HTML page (`03-unit-converter-web/public/index.html`) served by `src/server.js` (node:http, fixed routes `/` and `/convert.js`, 404 otherwise). Conversion runs in the browser via the ES module `public/convert.js`. No deps, no data, no auth.

## Launch
```
cd 03-unit-converter-web
PORT=3197 node src/server.js > /tmp/uc-verify.log 2>&1 & echo $! > /tmp/uc-verify.pid
```
Ready when `/tmp/uc-verify.log` prints `http://localhost:3197` and `curl -s -o /dev/null -w '%{http_code}' localhost:3197/` prints `200`. Own port 3197 so it never collides with a dev instance on 3000. To prove the default port, see `features/serve-page.md` (only when port 3000 is free).

## Doctor
`kill -0 $(cat /tmp/uc-verify.pid) && lsof -nP -iTCP:3197 -sTCP:LISTEN` — the listening PID must equal the pid file. Otherwise read `/tmp/uc-verify.log`; never drive an instance you did not start.

## Drive
Helper (executable, system Python Playwright, uses newest cached `chromium_headless_shell`; nothing to install):
```
.claude/skills/verify-unit-converter-web/drive.py http://localhost:3197/ $EVIDENCE/load.png
.claude/skills/verify-unit-converter-web/drive.py http://localhost:3197/ $EVIDENCE/c-to-f.png temperature 100 C F
```
Prints JSON: `title`, `sections.<family>.from/to` option values, and in convert mode `result`, `error`, `error_visible`, `url_after`. It fills `#<f>-value`, selects `#<f>-from` / `#<f>-to`, clicks `#<f>-form button[type=submit]`, reads `#<f>-result` and `#<f>-error`. Families: `length`, `weight`, `temperature`. Recipes in `features/`.

## Evidence
Per done-when check save the JSON (`... | tee $EVIDENCE/<check>.json`) and the screenshot next to it. Drive the real page through the server; never import `convert.js` from Python/Node as browser proof (that is what `npm test` covers). A conversion proof needs the input in the JSON and the shown `result`; an error proof needs `error` non-empty, `error_visible: true`, `result` empty, and `url_after` equal to `url` (no reload). Evidence lives in the caller's evidence dir, outside cleanup scope.

## Cleanup
`kill $(cat /tmp/uc-verify.pid)` (only the PID you started), then delete `/tmp/uc-verify.pid` and `/tmp/uc-verify.log` in a separate command. Never kill by process name.
