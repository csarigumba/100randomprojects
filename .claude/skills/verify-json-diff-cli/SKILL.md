---
name: verify-json-diff-cli
description: Drive the 13-json-diff-cli `json-diff` command on fixture JSON files and capture stdout, stderr, and exit code as evidence. Use to prove any diff output, path notation, exit-code, error, or --ignore change works on the real CLI.
---

# Verify json-diff-cli

Surface: CLI (`13-json-diff-cli/`, Node 24+, ES modules). Command `json-diff <a.json> <b.json> [--ignore <path>]...`. Short-lived process; plain stdout/stderr + exit code, no PTY.

## Launch
Run from the repo root.
```
# install the real `json-diff` bin into a throwaway prefix (never global)
npm install -g --prefix /tmp/jd-verify ./13-json-diff-cli
export PATH=/tmp/jd-verify/bin:$PATH
F=.claude/skills/verify-json-diff-cli/fixtures
```
The install copies a snapshot: reinstall after every code change.

## Doctor
`node --version` is 24+, `command -v json-diff` → `/tmp/jd-verify/bin/json-diff`, and `json-diff $F/a.json $F/a.json; echo "exit=$?"` prints only `exit=0`.

## Drive
`json-diff <a> <b> [--ignore p]...; echo "exit=$?"`. Fixtures: `a.json` vs `b.json` differ at known paths (below); `bad.json` is invalid JSON. Write extra cases to `/tmp/jd-*.json`.

Expected `json-diff $F/a.json $F/b.json` (exit 1):
```
~ debug: false -> true
~ server.ports[1]: 8081 -> 9090
+ server.ports[2]: 9091
~ server.tls: null -> {"cert":"c.pem"}
- features[1]: "logs"
~ meta.build: 41 -> 42
+ region: "eu-1"
```
`--ignore server.ports` drops both port lines; `--ignore server --ignore meta.build` leaves only the `debug`, `features[1]`, and `region` lines. A missing file (`/tmp/jd-nope.json`) or `bad.json` → stderr names that file, exit 2.

## Evidence
One file per done-when check in the evidence dir: the command, stdout+stderr, `exit=<code>`:
```
{ echo '$ json-diff $F/a.json $F/b.json'; json-diff $F/a.json $F/b.json 2>&1; echo "exit=$?"; } > $EVIDENCE/<check>.txt
```
Drive the installed bin only; do not import internals.

## Cleanup
Delete `/tmp/jd-verify` and any `/tmp/jd-*.json` you wrote. Nothing else persists.
