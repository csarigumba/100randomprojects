# Per-column stats

## Sub-features
- One output line per header column, in header order.
- Numeric column (every non-empty cell is a number): `count`, `min`, `max`, `mean`.
- Text column (any non-empty non-numeric cell): `count` and `distinct`.
- Empty cells are skipped in every count.

## How to get to it (user POV)
`csv-stats <file.csv>`.

## Driving it with the installed bin
`csv-stats .claude/skills/verify-csv-stats-cli/fixtures/data.csv; echo "exit=$?"`. Expected, tab-separated, exit 0:
```
name	text	count=4	distinct=4
age	numeric	count=3	min=25	max=40	mean=31.67
city	text	count=4	distinct=3
score	text	count=3	distinct=3
```
`age` has one empty cell (Cara), so count 3. `score` has an `x`, so it is text; its empty cell is not counted.

## Gotchas
Mean is rounded to at most 2 decimals. Compare with `diff` against the block above, not by eye.
