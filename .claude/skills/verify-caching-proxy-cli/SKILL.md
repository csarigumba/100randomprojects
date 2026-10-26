---
name: verify-caching-proxy-cli
description: Drive the 07-caching-proxy-cli `caching-proxy` CLI and its HTTP proxy against a counting fake origin with curl, capturing headers, bodies, and origin request logs as evidence. Use to prove any change to proxy forwarding, caching (X-Cache HIT/MISS), or --clear-cache works on the real process.
---

# Verify caching-proxy-cli

Surface: CLI that starts an HTTP caching proxy (`07-caching-proxy-cli/`, Node 24+, no deps). Drive with the installed bin + curl.

## Launch
```
APP=$PWD/07-caching-proxy-cli
npm install -g --prefix /tmp/cpx-prefix "$APP"          # installs the real `caching-proxy` bin
node .claude/skills/verify-caching-proxy-cli/origin.mjs 4199 > /tmp/cpx-origin.log 2>&1 & echo $! > /tmp/cpx-origin.pid
/tmp/cpx-prefix/bin/caching-proxy --port 3198 --origin http://localhost:4199 > /tmp/cpx-proxy.log 2>&1 & echo $! > /tmp/cpx-proxy.pid
```
Ready when `/tmp/cpx-origin.log` has `origin ready` and `/tmp/cpx-proxy.log` has `Caching proxy listening on http://localhost:3198 -> http://localhost:4199`. Own ports 3198/4199.

## Doctor
`kill -0 $(cat /tmp/cpx-origin.pid) && kill -0 $(cat /tmp/cpx-proxy.pid)`. Otherwise read both logs.

## Drive
- `curl -si localhost:3198/<path>` — `-i` captures status + `X-Cache`.
- Origin log (`/tmp/cpx-origin.log`) has one `METHOD url` line per request that reached origin; `grep -c 'GET /foo' /tmp/cpx-origin.log` proves cache hits skipped origin. Origin body `n` is a global counter, so a HIT shows a stale `n`.
- `/missing*` paths return 404 from origin (to check status is cached too).
- Clear: `/tmp/cpx-prefix/bin/caching-proxy --clear-cache --port 3198`.

## Evidence
One file per done-when check under the evidence dir: the commands, full `curl -si` output, CLI stdout, and relevant origin-log greps (`… | tee $EVIDENCE/<check>.txt`).

## Cleanup
Kill only PIDs you started: `kill $(cat /tmp/cpx-proxy.pid) $(cat /tmp/cpx-origin.pid)`. Then, as a separate command, delete `/tmp/cpx-prefix` and the `/tmp/cpx-*` logs and pid files. Never kill by name.
