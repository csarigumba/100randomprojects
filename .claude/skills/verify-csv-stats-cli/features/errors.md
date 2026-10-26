# Errors and exit codes

## Sub-features
- Missing file: stderr `csv-stats: cannot read <file>: ...`, exit 1.
- Row with the wrong number of fields: stderr `csv-stats: line <n>: expected <h> fields, got <k>`, exit 1. Lines are 1-based file lines; the header is line 1.
- No file argument: `usage:` on stderr, exit 2.

## How to get to it (user POV)
Point `csv-stats` at a bad path or a malformed CSV.

## Driving it with the installed bin
```
csv-stats /tmp/csv-verify-data/nope.csv; echo "exit=$?"
csv-stats .claude/skills/verify-csv-stats-cli/fixtures/bad-row.csv; echo "exit=$?"
```
Expected: the cannot-read error, exit 1; then `csv-stats: line 3: expected 2 fields, got 1`, exit 1. stdout is empty in both.

## Gotchas
`bad-row.csv` line 3 is `3` (one field); line 4 is valid, so a parser that reports the last bad line or counts from 0 shows the wrong number.
