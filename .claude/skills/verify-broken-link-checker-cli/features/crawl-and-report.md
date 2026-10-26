# Crawl, check, report, exit code

## Sub-features
- Crawls same-origin HTML pages reachable from the start URL, each once.
- Checks every `<a href>` and `<img src>`; external links checked, never crawled.
- Prints one line per broken link (status or error, link, page) then a total line.
- Exit 0 with no broken links, 1 otherwise, 2 on usage error.

## How to get to it (user POV)
`link-check http://localhost:4000` (broken site) and `link-check http://localhost:4000/clean` (clean site).

## Driving it with the shell
Expected for `http://localhost:4000`:
- Pages crawled: `/`, `/about`, `/deep` (3). Request log shows each of these exactly once.
- Broken: `404 /missing` on `/` and on `/deep`; `404 /nope.png` on `/`; `404 http://localhost:4001/gone` on `/`; connection error for `http://localhost:4002/` on `/about`. Exit 1.
- `http://localhost:4001/ok` is requested (checked) but `http://localhost:4001/secret` never appears in the log (not crawled).
- `#top`, `mailto:` are not requested; `/deep#x` is fetched as `/deep`.

Expected for `http://localhost:4000/clean`: 0 broken, 2 pages crawled, exit 0.

## Gotchas
- Fixture logs show the server-side path only; the port prefix tells site (4000) from external (4001).
- Reinstall the bin after code changes; the prefix holds a copy.
