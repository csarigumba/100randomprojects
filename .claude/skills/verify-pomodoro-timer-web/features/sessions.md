# Sessions: work, short break, long break

## Sub-features
- Work ends → `05:00` `Short break`, count `1`, timer keeps running (auto-continue).
- Break ends → `25:00` `Work`, count unchanged.
- The break after the 4th completed work session is `15:00` `Long break` (count `4`); after it, Work again.

## How to get to it (user POV)
Start and wait.

## Driving it with drive.py
Short: `drive.py URL start run 1500000 state shot $EVIDENCE/2-short.png run 300000 state`.
Long: `drive.py URL start run 1500000 run 300000 run 1500000 run 300000 run 1500000 run 300000 run 1500000 state shot $EVIDENCE/2-long.png run 900000 state`
→ after 4 works: `15:00`, `Long break`, count `4`; after it `25:00` Work.

## Gotchas
- `run` fires a ~250 ms interval thousands of times; a full long-break cycle takes a few seconds of real time. `ff` lands on the same state faster.
