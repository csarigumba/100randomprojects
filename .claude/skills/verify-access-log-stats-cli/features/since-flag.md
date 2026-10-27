# --since <ISO date>

## Sub-features
- Counts only requests whose timestamp is at or after the given instant; earlier lines count nowhere. Skipped lines still count as skipped.
- CLF offsets are honored (`+0200` is two hours ahead of UTC).
- Invalid date (`yesterday`, `2026-13-01`, `10/11/2026`, empty): stderr `log-stats: --since must be an ISO date, got <value>`, exit 1, empty stdout.

## How to get to it (user POV)
`log-stats access.log --since 2026-10-11T09:00:05Z`.

## Driving it with the installed bin
```
FX=.claude/skills/verify-access-log-stats-cli/fixtures
log-stats $FX/access.log --since 2026-10-11T09:00:05Z; echo "exit=$?"
log-stats $FX/access.log --since 2026-10-12T07:00:00Z; echo "exit=$?"
for d in yesterday 2026-13-01 10/11/2026; do log-stats $FX/access.log --since $d; echo "exit=$?"; done
```
Expected first run, exit 0:
```
total	6
2xx	3
3xx	0
4xx	2
5xx	1
top paths
2	/api/data
1	/missing
1	/index.html
1	/contact
1	/favicon.ico
skipped	2
```
Second run: `total 1` (only the 12:00Z favicon line; the two `+0200` lines are 06:00Z and 06:30Z), `4xx 1`, exit 0. Each bad date: the error naming `--since`, exit 1.

## Gotchas
`/missing` at exactly 09:00:05Z must be included (at-or-after). A parser that ignores the offset includes the `+0200` lines in the second run.
