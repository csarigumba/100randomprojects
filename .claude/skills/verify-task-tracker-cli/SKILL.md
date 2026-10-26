---
name: verify-task-tracker-cli
description: Drive the 02-task-tracker-cli `task-cli` command (Node CLI, tasks.json in cwd) in a scratch dir and capture stdout, stderr, exit code, and tasks.json as evidence. Use to prove any task-cli command change works on the real CLI.
---

# Verify task-tracker-cli

Surface: CLI (`02-task-tracker-cli/`, bin `task-cli` → `src/cli.js`, zero deps, Node 24+). Short-lived process: no server. State is `tasks.json` in the current working directory.

## Launch
No build, no deps. Make an isolated scratch dir per run so you never touch a real `tasks.json`:
```
WORK=$(mktemp -d /tmp/task-cli-verify.XXXXXX)
```
`task-cli` = `node 02-task-tracker-cli/src/cli.js` (the file the `bin` points at), run with cwd `$WORK`.

## Doctor
`node --version` is v24+, and `.claude/skills/verify-task-tracker-cli/run.sh "$WORK"` shows stderr starting `Usage: task-cli` and `exit: 1`. Anything else: the checkout is broken; read `02-task-tracker-cli/src/cli.js`.

## Drive
Use the helper (from the repo root); it runs one command in `$WORK` and prints the command, stdout, stderr, exit code, and `tasks.json` after:
```
.claude/skills/verify-task-tracker-cli/run.sh "$WORK" add "Buy milk"
```
Commands (see `features/`): `add <text>`, `update <id> <text>`, `delete <id>`, `mark-in-progress <id>`, `mark-done <id>`, `list [todo|in-progress|done]`. Success prints to stdout and exits 0; errors and usage print to stderr and exit 1.

## Evidence
One file per done-when check: `run.sh "$WORK" ... | tee -a $EVIDENCE/<check>.txt`. Exercise the real CLI only (never import modules or write `tasks.json` by hand). Capture each action and the resulting `tasks.json` (the helper does both); for failures capture the exit code and that `tasks.json` is unchanged. Evidence lives in `$EVIDENCE`, outside `$WORK`.

## Cleanup
`rm -rf "$WORK"` as its own command (only the dir you created). Nothing else to stop.
