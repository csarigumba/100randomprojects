# Access Log Stats CLI

Summarizes a Common Log Format access log: total requests, requests per status class (2xx, 3xx, 4xx, 5xx), the top paths by count, and how many lines were skipped. Combined Log Format lines parse too (trailing referer/user-agent fields are ignored). Query strings are stripped from paths, ties in the top list keep first-appearance order, and a status outside 2xx–5xx counts in `total` only. A line that does not parse, including one whose timestamp is not a real date, is counted in `skipped`. The file is streamed line by line, so memory is bounded by the number of distinct paths, not the file size. Zero dependencies. Needs Node 24+.

## Run

```
npm install -g .   # then: log-stats <file> [--top N] [--since <ISO date>]
node bin/log-stats.js <file> [--top N] [--since <ISO date>]
npm test
```

Output is tab-separated. `--top N` shows N paths instead of 5 (N must be a positive integer). `--since` counts only requests at or after that instant; lines before it count nowhere. It takes `YYYY-MM-DD` (midnight UTC) optionally followed by `THH:MM[:SS[.sss]]` and `Z` or `±HH:MM`. Every error prints one line on stderr and exits 1.

## Examples

```
# default: top 5 paths
$ log-stats access.log
total	11
2xx	6
3xx	2
4xx	2
5xx	1
top paths
3	/index.html
2	/about
2	/api/data
1	/login
1	/missing
skipped	2

# --top
$ log-stats access.log --top 2
total	11
2xx	6
3xx	2
4xx	2
5xx	1
top paths
3	/index.html
2	/about
skipped	2

# --since (CLF offsets are honored: 08:00:00 +0200 is 06:00Z)
$ log-stats access.log --since 2026-10-12T07:00:00Z
total	1
2xx	0
3xx	0
4xx	1
5xx	0
top paths
1	/favicon.ico
skipped	2

# errors
$ log-stats nope.log
log-stats: cannot read nope.log: ENOENT
$ log-stats access.log --top 0
log-stats: --top must be a positive integer, got 0
$ log-stats access.log --since 2026-02-30
log-stats: --since must be an ISO date, got 2026-02-30
```
