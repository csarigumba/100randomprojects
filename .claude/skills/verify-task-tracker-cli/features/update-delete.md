# update / delete

## Sub-features
Change a task's description; remove a task; unknown id error.

## How to get to it (user POV)
`task-cli update 1 "Buy oat milk"`, `task-cli delete 1`.

## Driving it with run.sh
After `add`: `run.sh "$WORK" update 1 "Buy oat milk"` → `Task updated (ID: 1)`, description changed, `updatedAt` bumped. `run.sh "$WORK" delete 1` → `Task deleted (ID: 1)`, gone from `tasks.json`. `run.sh "$WORK" update 99 x` / `delete 99` → stderr `Task not found (ID: 99)`, exit 1, `tasks.json` unchanged.

## Gotchas
Quote multi-word descriptions.
