---
name: verify-access-log-stats-cli
description: Drive the 19-access-log-stats-cli `log-stats` command against Common Log Format fixtures and a generated larger-than-heap log, capturing stdout, stderr, and exit code as evidence. Use to prove any parsing, totals, --top, --since, skipped-line, error/exit-code, or streaming change works on the real CLI.
---

# Verify access-log-stats-cli

Surface: CLI (`19-access-log-stats-cli/`, Node 24+, ES modules). Command `log-stats <file> [--top N] [--since <ISO date>]`. Short-lived process, no server, no network, no PTY. Every error exits 1.

## Launch
Run from the repo root. Install the real `log-stats` bin into a throwaway prefix (never global):
```
npm install -g --prefix /tmp/logstats-verify ./19-access-log-stats-cli
export PATH=/tmp/logstats-verify/bin:$PATH
```
Reinstall after every code change. Each drive is one process; nothing to keep running.

## Doctor
`node --version` is 24+, `command -v log-stats` prints `/tmp/logstats-verify/bin/log-stats`, and `log-stats; echo "exit=$?"` prints a `usage: log-stats` line on stderr with `exit=1`.

## Drive
`log-stats <file> [--top N] [--since <date>]; echo "exit=$?"`. The fixture is `.claude/skills/verify-access-log-stats-cli/fixtures/access.log` (13 lines: 11 valid, 2 unparseable); expected outputs live in `features/`. For one-off cases write scratch logs under `/tmp/logstats-verify-data/` with `printf`, never inside the repo. Streaming (larger-than-heap) recipe: [features/streaming.md](features/streaming.md).

Output contract (tab-separated): `total`, `2xx`, `3xx`, `4xx`, `5xx` lines, then `top paths`, then `<count>\t<path>` lines, then `skipped\t<n>`. Errors: one `log-stats: ...` line on stderr, empty stdout, exit 1.

## Evidence
One file per done-when check in the evidence dir: the command, the input (or its size for generated logs), stdout+stderr, and `exit=<code>`:
```
FX=.claude/skills/verify-access-log-stats-cli/fixtures
{ echo '$ log-stats access.log'; log-stats $FX/access.log 2>&1; echo "exit=$?"; } > $EVIDENCE/<check>.txt
```
Use `2>&1` so error lines show in order. Drive the installed bin only; never import `src/` internals.

## Cleanup
`rm -rf /tmp/logstats-verify /tmp/logstats-verify-data` (run alone, not chained). Evidence lives in the evidence dir, outside `/tmp/logstats-verify*`, so cleanup never removes it.
