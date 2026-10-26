# Add a card

## Sub-features
- Title + Add creates a card at the end of To do; input clears.
- Empty title: native `required` blocks submit. Whitespace-only: app rejects. No card, localStorage unchanged.

## How to get to it (user POV)
Type in the title box at the top, press Add (or Enter).

## Driving it with drive.py
`drive.py URL add "Buy milk" add "" add "   " state` → `todo` has exactly one card "Buy milk"; `localStorage` has one card.

## Gotchas
- `add ""` still clicks Add; the browser blocks the submit, so the proof is the unchanged state, not an error message.
