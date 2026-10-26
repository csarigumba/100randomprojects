# List expenses

## Sub-features
- Header row `ID  Date  Description  Amount`, one padded row per expense, amount as `$<n>`.

## How to get to it (user POV)
`expense-tracker list`

## Driving it with node
Add two expenses, then `node bin/expense-tracker.js list; echo "exit=$?"`.

## Gotchas
Date is the local date at add time (`YYYY-MM-DD`).
