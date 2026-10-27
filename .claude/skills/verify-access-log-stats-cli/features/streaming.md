# Streaming a larger-than-heap log

## Sub-features
- The file is read line by line; memory is bounded by distinct paths, not file size.

## How to get to it (user POV)
Run `log-stats` on a log bigger than the Node heap.

## Driving it with the installed bin
```
mkdir -p /tmp/logstats-verify-data
yes '10.0.0.1 - - [10/Oct/2026:13:55:36 +0000] "GET /index.html HTTP/1.1" 200 2326' | head -n 2000000 > /tmp/logstats-verify-data/big.log
ls -l /tmp/logstats-verify-data/big.log          # ~160 MB
# control: reading it whole under the same heap cap must fail
NODE_OPTIONS=--max-old-space-size=32 node -e "require('fs').readFileSync('/tmp/logstats-verify-data/big.log','utf8').split('\n').length"; echo "exit=$?"
NODE_OPTIONS=--max-old-space-size=32 log-stats /tmp/logstats-verify-data/big.log; echo "exit=$?"
```
Expected: the control dies (non-zero exit, heap or string-length error); `log-stats` prints `total 2000000`, `2xx 2000000`, `2000000	/index.html`, `skipped 0`, exit 0.

## Gotchas
The control is what makes this proof: without it a pass only shows the file fit in memory. Keep paths few; a file of all-distinct paths grows the Map by design.
