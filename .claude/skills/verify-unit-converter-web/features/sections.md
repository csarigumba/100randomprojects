# Unit sections

The page shows three sections — length, weight, temperature — each with from/to dropdowns listing that family's units.

## Sub-features

- `sections-length` mm, cm, m, km, in, ft, yd, mi.
- `sections-weight` mg, g, kg, oz, lb.
- `sections-temperature` C, F, K.

## How to get to it (user POV)

- Open the page; all three sections are visible without clicking.

## Driving it with drive.py

- `drive.py http://localhost:3197/ $EVIDENCE/sections.png | tee $EVIDENCE/sections.json`. `sections.length.from` = `["mm","cm","m","km","in","ft","yd","mi"]`, `weight` = `["mg","g","kg","oz","lb"]`, `temperature` = `["C","F","K"]`; `to` lists match `from`.

## Gotchas

- A missing section is simply absent from `sections` in the JSON; check all three keys exist.
