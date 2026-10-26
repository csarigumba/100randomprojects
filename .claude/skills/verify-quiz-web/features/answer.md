# Answer a question

## Sub-features
- Picking marks it: every `.choice` disabled, picked one `data-result=right|wrong`, correct one `data-correct`.
- `#feedback` = `Correct!` or `Wrong — answer: <choice>`; `#next` becomes visible.
- `#next` advances to the next question (`#progress` increments, feedback cleared, Next hidden).

## How to get to it (user POV)
Open the page, click a choice, click Next.

## Driving it with drive.py
Right: `drive.py URL state right state next state shot $EVIDENCE/2-right.png`.
Wrong: `drive.py URL wrong state shot $EVIDENCE/2-wrong.png`.

## Gotchas
- After a pick every choice is `disabled`, so a second pick through the UI is impossible; `state` shows it.
