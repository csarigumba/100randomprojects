# Expense Tracker CLI

Command-line expense tracker. Stores expenses in a JSON file. No runtime dependencies. Needs Node 24+.

## Run

```
npm link           # optional: puts `expense-tracker` on PATH
node bin/expense-tracker.js <command> [flags]
npm test
```

Env: `EXPENSES_FILE` (default `./expenses.json`). Expense: `{id, date, description, amount}`. Errors go to stderr as `Error: ...` with exit 1.

## Commands

```
# add (amount must be > 0)
expense-tracker add --description Lunch --amount 20
# Expense added successfully (ID: 1)

# list
expense-tracker list
# ID  Date        Description  Amount
# 1   2026-08-06  Lunch        $20

# delete (exit 1 if id not found)
expense-tracker delete --id 1
# Expense deleted successfully

# summary, all or one month (1-12) of the current year
expense-tracker summary
# Total expenses: $20
expense-tracker summary --month 8
# Total expenses for August: $20

# export to CSV (header id,date,description,amount)
expense-tracker export --file out.csv
# Exported 1 expenses to out.csv
```
