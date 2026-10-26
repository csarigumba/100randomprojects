# Quoted fields

## Sub-features
- `"Paris, FR"`: comma inside quotes stays in one field.
- `"He said ""hi"""`: doubled quote is a literal `"`.

## How to get to it (user POV)
Any CSV with quoted fields passed to `csv-stats`.

## Driving it with the installed bin
`data.csv` row widths only line up if quotes parse right: a broken parser splits `"Paris, FR"` into two fields and exits 1 with a wrong-field-count error on line 2. Prove the values themselves with a single-column file:
```
mkdir -p /tmp/csv-verify-data
printf 'q\n"a,b"\n"say ""hi"""\n"a,b"\n' > /tmp/csv-verify-data/quotes.csv
csv-stats /tmp/csv-verify-data/quotes.csv; echo "exit=$?"
```
Expected: `q	text	count=3	distinct=2`, exit 0.

## Gotchas
Shell quoting: keep the `printf` format in single quotes.
