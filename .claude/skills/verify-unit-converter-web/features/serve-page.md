# Serve the page

`npm start` in `03-unit-converter-web/` starts the server and the page loads at `http://localhost:$PORT`, default 3000.

## Sub-features

- `serve-default` no `PORT` → listens on 3000.
- `serve-port` `PORT=3197` → listens on 3197.
- `serve-404` unknown paths return 404.

## How to get to it (user POV)

- Run `npm start` in the folder, open `http://localhost:3000/`.

## Driving it with drive.py

- **Default port.** Only if `lsof -nP -iTCP:3000 -sTCP:LISTEN` is empty: `(cd 03-unit-converter-web && npm start > /tmp/uc-default.log 2>&1 & echo $! > /tmp/uc-default.pid)`, then `drive.py http://localhost:3000/ $EVIDENCE/serve-default.png | tee $EVIDENCE/serve-default.json`. JSON `title` is `Unit converter`. Stop it: `kill $(cat /tmp/uc-default.pid)`, then confirm `lsof -nP -iTCP:3000 -sTCP:LISTEN` is empty; npm spawns node as a child, so if a listener remains, kill that listed PID (it is the child you started).
- **Custom port.** With the Launch instance: `curl -si localhost:3197/ | head -5 | tee $EVIDENCE/serve-port.txt` → `200`, `content-type: text/html`.
- **404.** `curl -s -o /dev/null -w '%{http_code}' localhost:3197/nope` → `404`.

## Gotchas

- `npm start` wraps node; the pid file holds npm's pid. Confirm port 3000 is free after cleanup.
