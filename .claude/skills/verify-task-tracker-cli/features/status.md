# mark-in-progress / mark-done

## Sub-features
Set status to `in-progress` or `done`.

## How to get to it (user POV)
`task-cli mark-in-progress 1`, `task-cli mark-done 1`.

## Driving it with run.sh
`run.sh "$WORK" mark-in-progress 1` → `Task marked in-progress (ID: 1)`, `status:"in-progress"`, `updatedAt` bumped. `run.sh "$WORK" mark-done 1` → `Task marked done (ID: 1)`, `status:"done"`. Unknown id → `Task not found (ID: <id>)`, exit 1.

## Gotchas
Check every task in `tasks.json` has exactly `id, description, status, createdAt, updatedAt`.
