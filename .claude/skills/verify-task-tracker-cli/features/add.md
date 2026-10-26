# add

## Sub-features
Add a task with status `todo`; the first write creates `tasks.json`.

## How to get to it (user POV)
`task-cli add "Buy milk"` in any directory.

## Driving it with run.sh
`run.sh "$WORK" add "Buy milk"` → stdout `Task added (ID: 1)`, exit 0, `tasks.json` holds `[{id:1, description:"Buy milk", status:"todo", createdAt, updatedAt}]`. `add` with no text → usage, exit 1.

## Gotchas
Fresh `$WORK` → ids start at 1. New id = max id + 1.
