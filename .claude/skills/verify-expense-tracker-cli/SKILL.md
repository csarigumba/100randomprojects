---
name: verify-expense-tracker-cli
description: Drive the 05-expense-tracker-cli Node CLI (add, list, delete, summary, export) against a throwaway JSON data file and capture stdout, stderr, exit codes, and written files as evidence. Use to prove any expense-tracker command change works on the real CLI.
---

# Verify expense-tracker-cli

Surface: short-lived Node 24 CLI (`05-expense-tracker-cli/bin/expense-tracker.js`, no runtime deps). No server; each command is one process.

## Launch
```
cd 05-expense-tracker-cli && npm install
export EXPENSES_FILE=$(mktemp -d /tmp/expense-verify.XXXX)/expenses.json
```
`EXPENSES_FILE` points the CLI at a scratch JSON file so it never touches `./expenses.json` (the default). A missing file means an empty list. Fresh temp dir per run → instances are isolated; IDs start at 1.

## Doctor
`node --version` is 24+ and `node bin/expense-tracker.js` (no args) exits 1 with a `Usage:` line on stderr. Anything else: run `npm install` and read the stack trace.

## Drive
Run each command and record its exit code:
```
node bin/expense-tracker.js add --description Lunch --amount 20; echo "exit=$?"
```
Recipes per command in `features/`. Check state after mutations: `cat "$EXPENSES_FILE"` (and the CSV for export).

## Evidence
One file per done-when check in the evidence dir (outside the temp dir). Capture command, stdout+stderr, exit code, and resulting file state:
```
{ echo '$ add --description Lunch --amount 20'; node bin/expense-tracker.js add --description Lunch --amount 20 2>&1; echo "exit=$?"; echo '--- data file'; cat "$EXPENSES_FILE"; } | tee "$EVIDENCE/<check>.txt"
```
Drive the real CLI only; never import modules or write the JSON by hand to fake state. Error paths count: show the non-zero exit and that the data file did not change.

## Cleanup
Run alone, not chained (a guardrail hook blocks chained `rm`): `rm -rf "$(dirname "$EXPENSES_FILE")"`. That removes the data file and any CSV written inside the temp dir. Evidence lives in the evidence dir, which cleanup never touches. No processes to kill.
