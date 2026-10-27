# Server routes and startup

## Sub-features
- `GET /`, `/app.js`, `/pomodoro.js` → 200 with `text/html` / `text/javascript; charset=utf-8`; anything else 404.
- Malformed request URL → 400/500 and the server keeps serving.
- Bad `PORT` (`abc`, `0`, `70000`) → exit 1, stderr names `PORT`.

## Driving it
No browser.
```
for p in / /app.js /pomodoro.js /nope; do curl -s -o /dev/null -w "$p %{http_code} %{content_type}\n" localhost:3517$p; done
printf 'GET //%% HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n' | nc localhost 3517 | head -1; curl -s -o /dev/null -w '%{http_code}\n' localhost:3517/
PORT=abc node 17-pomodoro-timer-web/server.js; echo "exit $?"
```
