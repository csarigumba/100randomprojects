# Errors and exit codes

## Sub-features
- Missing file: stderr `log-stats: cannot read <file>: ENOENT`, exit 1, empty stdout.
- No file, two files, unknown option: `usage: log-stats <file> [--top N] [--since <ISO date>]` on stderr, exit 1.

## How to get to it (user POV)
Point `log-stats` at a bad path or call it wrong.

## Driving it with the installed bin
```
log-stats /tmp/logstats-verify-data/nope.log; echo "exit=$?"
log-stats; echo "exit=$?"
log-stats a.log --bogus; echo "exit=$?"
```

## Gotchas
A stream that errors after stdout has started would print partial output; check stdout is empty on the missing-file case.
