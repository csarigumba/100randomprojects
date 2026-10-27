# --top N

## Sub-features
- Shows N paths instead of 5. N larger than the distinct path count shows them all.
- N not a positive integer (`0`, `-1`, `1.5`, `abc`, `2x`, missing value): stderr `log-stats: --top must be a positive integer, got <value>`, exit 1, empty stdout.

## How to get to it (user POV)
`log-stats access.log --top 2`.

## Driving it with the installed bin
```
FX=.claude/skills/verify-access-log-stats-cli/fixtures
log-stats $FX/access.log --top 2; echo "exit=$?"
for n in 0 -1 1.5 abc 2x; do log-stats $FX/access.log --top=$n; echo "exit=$?"; done
log-stats $FX/access.log --top; echo "exit=$?"
```
Expected: `top paths` followed by exactly `3	/index.html` and `2	/about`, exit 0. Each bad value: the error naming `--top`, exit 1. `--top` with no value: an error (usage or `--top`), exit 1.

## Gotchas
Pass negatives as `--top=-1`; `--top -1` makes parseArgs treat `-1` as a flag. `parseInt('2x')` is 2, so `2x` catches a lenient parser.
