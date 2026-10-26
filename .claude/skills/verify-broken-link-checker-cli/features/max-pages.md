# --max-pages

## Sub-features
- `--max-pages N` caps how many same-origin pages are crawled; default 100.

## How to get to it (user POV)
`link-check http://localhost:4000/many --max-pages 5` vs `link-check http://localhost:4000/many`.

## Driving it with the shell
`/many` links to `/many/1..20`; each `/many/i` links to `/many/i/leaf` (41 pages total).
- With `--max-pages 5`: total line reports 5 pages crawled; only the 4 leaves linked from crawled `/many/i` pages appear in the log.
- With no flag: 41 pages crawled (under the default 100).

## Gotchas
- Links on crawled pages are still checked (GET), so uncrawled `/many/i` URLs appear in the log once as checks; count crawled pages from the total line plus leaf requests.
