# CSV export

## Sub-features
- `export --file <path>` writes `id,date,description,amount` header + one row per expense; fields with `,` `"` or newlines are quoted.

## How to get to it (user POV)
`expense-tracker export --file out.csv`

## Driving it with node
Add two expenses (one description containing a comma), `node bin/expense-tracker.js export --file "$(dirname "$EXPENSES_FILE")/out.csv"; echo "exit=$?"`, then `cat` the CSV.

## Gotchas
Write the CSV inside the temp dir so cleanup removes it.
