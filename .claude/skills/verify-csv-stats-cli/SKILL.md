---
name: verify-csv-stats-cli
description: Drive the 16-csv-stats-cli `csv-stats` command against CSV fixtures and capture stdout, stderr, and exit code as evidence. Use to prove any parsing, stats, --column, or error/exit-code change works on the real CLI.
---

# Verify csv-stats-cli

Surface: CLI (`16-csv-stats-cli/`, Node 24+, ES modules). Command `csv-stats <file.csv> [--column <name>]`. Short-lived process, no server, no network, no PTY.

## Launch
Run from the repo root. Install the real `csv-stats` bin into a throwaway prefix (never global):
```
npm install -g --prefix /tmp/csv-verify ./16-csv-stats-cli
export PATH=/tmp/csv-verify/bin:$PATH
```
The install links or copies the folder; reinstall after every code change to be safe. Each drive is one process; nothing to keep running.

## Doctor
`node --version` is 24+, `command -v csv-stats` prints `/tmp/csv-verify/bin/csv-stats`, and `csv-stats; echo "exit=$?"` prints a `usage:` line on stderr with `exit=2`.

## Drive
`csv-stats <file> [--column <name>]; echo "exit=$?"`. Fixtures live in `.claude/skills/verify-csv-stats-cli/fixtures/` (expected results in `features/`). For one-off cases write a scratch CSV under `/tmp/csv-verify-data/` with `printf`, never inside the repo.

## Evidence
One file per done-when check in the evidence dir: the command, the input file, stdout+stderr, and `exit=<code>`:
```
FX=.claude/skills/verify-csv-stats-cli/fixtures
{ echo "--- $FX/data.csv"; cat $FX/data.csv; echo '$ csv-stats data.csv'; csv-stats $FX/data.csv 2>&1; echo "exit=$?"; } > $EVIDENCE/<check>.txt
```
Use `2>&1` so error lines show in order. Drive the installed bin only; never import `src/` internals.

## Cleanup
`rm -rf /tmp/csv-verify /tmp/csv-verify-data` (run alone, not chained). Evidence lives in the evidence dir, outside `/tmp/csv-verify*`, so cleanup never removes it.
