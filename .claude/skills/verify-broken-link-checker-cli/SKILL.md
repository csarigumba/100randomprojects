---
name: verify-broken-link-checker-cli
description: Drive the 11-broken-link-checker-cli `link-check` command against a local fixture site (ports 4000/4001) and capture stdout, exit code, and the fixture's request log as evidence. Use to prove any crawl, link-check, output, exit-code, or --max-pages change works on the real CLI.
---

# Verify broken-link-checker-cli

Surface: CLI (`11-broken-link-checker-cli/`, Node 24+, ES modules). Command `link-check <start-url> [--max-pages N]`. Short-lived process; no PTY needed (plain stdout/stderr + exit code).

## Launch
Run from the repo root.
```
# install the real `link-check` bin into a throwaway prefix (never global)
npm install -g --prefix /tmp/lc-verify ./11-broken-link-checker-cli
export PATH=/tmp/lc-verify/bin:$PATH
# fixture site: :4000 (site under test), :4001 ("external" origin); :4002 is deliberately unused
lsof -nP -iTCP:4000 -iTCP:4001 -sTCP:LISTEN   # must print nothing; if busy, stop — do not drive someone else's server
node .claude/skills/verify-broken-link-checker-cli/fixture-site.js > /tmp/lc-fixture.log 2>&1 & echo $! > /tmp/lc-fixture.pid
```
Ready when `/tmp/lc-fixture.log` contains `fixture ready`. The install copies a snapshot: reinstall after every code change.

## Doctor
`kill -0 $(cat /tmp/lc-fixture.pid) && curl -s -o /dev/null -w '%{http_code}\n' localhost:4000/` → `200`, and `command -v link-check` → `/tmp/lc-verify/bin/link-check`. Otherwise read `/tmp/lc-fixture.log`.

## Drive
`link-check <url> [--max-pages N]; echo "exit=$?"`. Clear the request log between drives (`: > /tmp/lc-fixture.log`) so each run's requests are isolated. Fixture map (what each URL should yield) in `features/`.

## Evidence
One file per done-when check in the evidence dir: the command, full stdout+stderr, `exit=<code>`, and the fixture request log for that run:
```
: > /tmp/lc-fixture.log
{ echo '$ link-check http://localhost:4000'; link-check http://localhost:4000 2>&1; echo "exit=$?"; echo '--- fixture requests'; cat /tmp/lc-fixture.log; } > $EVIDENCE/<check>.txt
```
Prove crawl claims from the request log (what was actually fetched), not just the CLI's own summary line. Evidence lives outside `/tmp/lc-*`, so cleanup never removes it.

## Cleanup
Kill only the PID you started: `kill $(cat /tmp/lc-fixture.pid)`. Then, as a separate command: `rm -rf /tmp/lc-verify /tmp/lc-fixture.pid /tmp/lc-fixture.log`. Never kill by process name.
