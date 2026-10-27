# Summary

## Sub-features
- `total` counts every parsed line; `2xx`..`5xx` count by first status digit.
- `top paths`: top 5 by count, count desc, ties by first appearance. Query strings are stripped (`/about?ref=home` counts as `/about`).
- `skipped`: lines that do not parse, including a line whose `[...]` timestamp is not a real CLF date. Printed last.

## How to get to it (user POV)
`log-stats access.log`.

## Driving it with the installed bin
```
log-stats .claude/skills/verify-access-log-stats-cli/fixtures/access.log; echo "exit=$?"
```
Expected stdout, exit 0:
```
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
```

## Gotchas
`/about` reaches 2 only if the query string is stripped. `/login` before `/missing` proves the tie order. The `[not a date]` line has the right shape but must be skipped, so `skipped 2` not 1.
