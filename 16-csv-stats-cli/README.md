# CSV Stats CLI

Prints per-column statistics for a CSV file with a header row: one tab-separated line per column. A column whose non-empty cells are all numbers gets count, min, max, and mean (rounded to 2 decimals); any other column is text and gets count and distinct values. Empty cells are not counted. Parses RFC 4180 CSV (quoted commas, `""` escapes, quoted newlines, CRLF); a UTF-8 BOM and blank lines are ignored. Zero dependencies. Needs Node 24+.

## Run

```
npm install -g .   # then: csv-stats <file.csv> [--column <name>]
node bin/csv-stats.js <file.csv> [--column <name>]
npm test
```

Exit: `0` ok, `1` bad file (unreadable, empty, wrong field count, unterminated quote) or unknown column, `2` usage error. Errors name the line (1-based, header = line 1).

## Examples

```
# all columns
$ csv-stats data.csv
name	text	count=4	distinct=4
age	numeric	count=3	min=25	max=40	mean=31.67
city	text	count=4	distinct=3
score	text	count=3	distinct=3

# one column
$ csv-stats data.csv --column age
age	numeric	count=3	min=25	max=40	mean=31.67

# a row with the wrong number of fields
$ csv-stats bad-row.csv
csv-stats: line 3: expected 2 fields, got 1
```
