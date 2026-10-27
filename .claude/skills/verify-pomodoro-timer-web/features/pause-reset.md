# Pause and Reset

## Sub-features
- Pause freezes `#time`; time passing while paused changes nothing; Start resumes from the frozen value.
- Reset → `25:00`, `Work`, count `0`, paused (`#start` enabled).

## How to get to it (user POV)
Start, wait, Pause, wait, Start; or Reset mid-break.

## Driving it with drive.py
Pause: `drive.py URL start run 60000 pause state run 120000 state start run 1000 state shot $EVIDENCE/3-pause.png`
→ `24:00`, `24:00`, `23:59`.
Reset: `drive.py URL start run 1560000 state reset state run 5000 state shot $EVIDENCE/3-reset.png`
→ `04:00` Short break count 1, then `25:00` Work count 0, still `25:00` after 5 s.
