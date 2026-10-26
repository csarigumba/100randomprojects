# list

## Sub-features
`list`, `list todo`, `list in-progress`, `list done`.

## How to get to it (user POV)
`task-cli list [status]`.

## Driving it with run.sh
Seed three tasks with different statuses via add + mark-*, then `run.sh "$WORK" list` → one line per task `<id> [<status>] <description>`; each filter shows only its status. Empty result → `No tasks`. `list foo` → usage, exit 1.

## Gotchas
Seed through the CLI, not by writing `tasks.json`.
