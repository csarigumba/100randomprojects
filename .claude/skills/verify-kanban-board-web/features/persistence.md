# Persistence

## Sub-features
- Board saved to `localStorage['kanban-board']` after every change; restored on load.

## How to get to it (user POV)
Make changes, reload the page (F5).

## Driving it with drive.py
`drive.py URL add A add B add C move B right move C right move C right state reload state shot $EVIDENCE/4-reload.png` → the two `state` blocks' `dom` match.

## Gotchas
- Each drive.py run is a new profile; prove persistence with `reload` inside one run, not across runs.
