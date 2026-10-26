# Delete expense

## Sub-features
- `delete --id <n>` prints `Expense deleted successfully`, exit 0, row gone.
- Unknown id → `Error: Expense <id> not found`, exit 1.

## How to get to it (user POV)
`expense-tracker delete --id 1`

## Driving it with node
Add one, `node bin/expense-tracker.js delete --id 1; echo "exit=$?"`, then `list` and `cat "$EXPENSES_FILE"`; then `delete --id 99` → exit 1.

## Gotchas
None known.
