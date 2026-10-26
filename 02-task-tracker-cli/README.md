# Task Tracker CLI

Command-line task tracker. Tasks live in `tasks.json` in the current directory. Node 24+, no dependencies.

## Run

```
node src/cli.js <command>   # or `npm link`, then `task-cli <command>`
npm test
```

Task: `{id, description, status, createdAt, updatedAt}`, status is `todo`, `in-progress` or `done`. Errors go to stderr, exit 1.

## Commands

```
task-cli add "Buy milk"            # Task added (ID: 1)
task-cli update 1 "Buy oat milk"   # Task updated (ID: 1)
task-cli mark-in-progress 1        # Task marked in-progress (ID: 1)
task-cli mark-done 1               # Task marked done (ID: 1)
task-cli list                      # 1 [done] Buy oat milk
task-cli list done                 # also: list todo, list in-progress
task-cli delete 1                  # Task deleted (ID: 1)
```
