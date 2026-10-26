# Add expense

## Sub-features
- Valid add prints `Expense added successfully (ID: <n>)`, exit 0; IDs increment.
- Negative, zero, or non-numeric `--amount` → `Error: ...` on stderr, exit 1, file unchanged.
- Missing `--description` → exit 1.

## How to get to it (user POV)
`expense-tracker add --description Lunch --amount 20`

## Driving it with node
`node bin/expense-tracker.js add --description Lunch --amount 20; echo "exit=$?"; cat "$EXPENSES_FILE"`
Then `--amount -5` and `--amount abc`; confirm exit=1 and the JSON still has one entry.

## Gotchas
`--amount -5` (space-separated negative) must be read as the value, not a flag; check it and `--amount=-5`.
