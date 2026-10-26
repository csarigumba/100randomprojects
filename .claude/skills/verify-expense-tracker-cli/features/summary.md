# Summary

## Sub-features
- `summary` → `Total expenses: $<n>`.
- `summary --month <1-12>` → `Total expenses for <MonthName>: $<n>`, current year only. Out-of-range month → exit 1.

## How to get to it (user POV)
`expense-tracker summary`, `expense-tracker summary --month 8`

## Driving it with node
Add expenses (dated today), run `summary`, `summary --month $(date +%-m)` (should match), and another month (should be `$0`).

## Gotchas
Adds are always dated today, so only the current month has non-zero totals via the real CLI path.
