# Invalid input

Submitting a non-numeric or empty value shows an inline error in that section and no result.

## Sub-features

- `invalid-text` `abc` → error.
- `invalid-empty` empty → error.

## How to get to it (user POV)

- Type `abc` in a section's value box and click `Convert`.

## Driving it with drive.py

- `drive.py http://localhost:3197/ $EVIDENCE/invalid-text.png length abc m km | tee $EVIDENCE/invalid-text.json` → `error` non-empty, `error_visible` true, `result` empty, `url_after` equals `url`.
- `drive.py http://localhost:3197/ $EVIDENCE/invalid-empty.png weight '' g kg` → same.

## Gotchas

- `drive.py` reloads per call, so "a previous result is cleared by a later invalid submit" is not covered by it; prove that with a one-off Playwright session if it matters.
