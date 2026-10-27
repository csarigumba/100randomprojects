# Background tab (throttled timers)

## Sub-features
- Remaining time comes from wall-clock differences, so if timer callbacks stop firing for a while the display still matches real elapsed time.

## How to get to it (user POV)
Start, switch tabs for 10 minutes, come back.

## Driving it with drive.py
`ff` jumps `Date.now()` and fires the interval at most once, the way a throttled background tab does:
`drive.py URL start ff 600000 state ff 1200000 state shot $EVIDENCE/4-background.png`
→ `15:00` Work, count `0`; then 30 min total (25 work + 5 break) → `25:00` Work, count `1`.
A tick-counting page would show ~`24:59` after the first jump.

## Gotchas
- Use `ff`, not `run`, for this check: `run` fires every tick, so a tick-counting page would also pass it.
