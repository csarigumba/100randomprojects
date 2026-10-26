# usage

## Sub-features
No args; unknown command.

## How to get to it (user POV)
`task-cli`, `task-cli frobnicate`.

## Driving it with run.sh
`run.sh "$WORK"` and `run.sh "$WORK" frobnicate` → stderr starts `Usage: task-cli <command>`, exit 1.

## Gotchas
Usage goes to stderr, not stdout.
