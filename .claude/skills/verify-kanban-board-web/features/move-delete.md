# Move and delete a card

## Sub-features
- `[data-action=left]` / `[data-action=right]` move one column; Left disabled in To do, Right disabled in Done.
- `[data-action=delete]` takes the card off the board.

## How to get to it (user POV)
Buttons on each card: ← (Move left), → (Move right), Delete.

## Driving it with drive.py
`drive.py URL add A add B move A right state move A right state move A left delete B state` → A in doing, then done, then doing; B gone; `state` shows enabled flags per card.

## Gotchas
- Clicking a disabled edge button makes Playwright wait 30s and fail; prove edges via the `left`/`right` flags in `state` instead.
