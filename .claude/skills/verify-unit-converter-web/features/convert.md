# Convert a value

Enter a number, pick from/to units in a section, press Convert; the section's result shows the converted value and the to-unit.

## Sub-features

- `convert-temperature` 100 C → F shows `212 F`.
- `convert-length` 1 km → m shows `1000 m`.
- `convert-weight` 1 lb → oz shows `16 oz`.

## How to get to it (user POV)

- Type in the section's value box, choose units, click `Convert` (or press Enter).

## Driving it with drive.py

- `drive.py http://localhost:3197/ $EVIDENCE/convert-temperature.png temperature 100 C F | tee $EVIDENCE/convert-temperature.json` → `result` `212 F`, `error` empty.
- Same shape: `length 1 km m` → `1000 m`; `weight 1 lb oz` → `16 oz`.

## Gotchas

- Results are rounded to 12 significant digits for display (`1 ft → m` shows `0.3048`).
- `url_after` must equal `url`; a changed URL means the form submitted natively (missing `preventDefault`).
