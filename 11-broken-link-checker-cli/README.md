# Broken Link Checker CLI

Crawls a site from a start URL and reports broken links (`<a href>`, `<img src>`). Same-origin HTML pages are crawled once each; external links are checked but not crawled. Broken = status >= 400 after redirects, or a network error / 10s timeout. Zero dependencies. Needs Node 24+.

## Run

```
npm install -g .   # then: link-check <start-url> [--max-pages N]
node bin/link-check.js <start-url> [--max-pages N]
npm test
```

Exit: `0` no broken links, `1` broken links found, `2` usage error.

## Examples

```
# crawl from a start URL (default cap: 100 pages)
$ link-check http://localhost:4000
404  http://localhost:4000/missing  on http://localhost:4000/
404  http://localhost:4001/gone  on http://localhost:4000/
404  http://localhost:4000/nope.png  on http://localhost:4000/
ECONNREFUSED  http://localhost:4002/  on http://localhost:4000/about
404  http://localhost:4000/missing  on http://localhost:4000/deep
5 broken link(s) — 3 page(s) crawled, 9 link(s) checked

# cap the number of crawled pages (links on crawled pages are still all checked)
$ link-check http://localhost:4000/many --max-pages 5
0 broken link(s) — 5 page(s) crawled, 25 link(s) checked
```
