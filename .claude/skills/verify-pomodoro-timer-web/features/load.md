# Page load

## Sub-features
- `#time` = `25:00`, `#mode` = `Work` (`data-mode=work`), `#count` = `0`, title `25:00 · Work`.
- `#start` enabled, `#pause` disabled while paused.

## How to get to it (user POV)
`npm start`, open the page.

## Driving it with drive.py
`drive.py URL state shot $EVIDENCE/1-load.png`

## Gotchas
- `start state` right after load still shows `25:00` (seconds round up); `run 1000 state` shows `24:59`.
