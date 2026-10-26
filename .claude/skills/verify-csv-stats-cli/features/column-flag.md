# --column

## Sub-features
- `--column <name>` prints only that column's line.
- Unknown name: stderr `csv-stats: unknown column: <name>`, exit 1, nothing on stdout.

## How to get to it (user POV)
`csv-stats <file.csv> --column <name>`.

## Driving it with the installed bin
```
csv-stats .claude/skills/verify-csv-stats-cli/fixtures/data.csv --column age; echo "exit=$?"
csv-stats .claude/skills/verify-csv-stats-cli/fixtures/data.csv --column nope; echo "exit=$?"
```
Expected: `age	numeric	count=3	min=25	max=40	mean=31.67` exit 0; then the unknown-column error with exit 1.

## Gotchas
Column names are matched exactly (case-sensitive).
