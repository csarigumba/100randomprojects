# unit-converter-web verification map

Maintained source for verifying 03-unit-converter-web. Read the index, then use the matching feature file.

## Baseline preconditions

- Server launched per `SKILL.md` on `http://localhost:3197`, doctor passes.
- `drive.py` in recipes means `/usr/bin/python3 .claude/skills/verify-unit-converter-web/drive.py` (see `SKILL.md` Drive).

## Driving conventions

- Every drive starts from a fresh page load (`drive.py` loads the URL each call).
- Handles are ids from the contract: `#<family>`, `#<family>-form|value|from|to|result|error`.

## Proof and skip reporting

- Each proof: JSON from `drive.py` + full-page screenshot, named after the check.
- Report an unreachable path with the command and the unmet precondition; do not substitute `npm test` for browser proof.

## Features

- [serve-page.md](serve-page.md) — `npm start` serves the page, default port 3000.
- [sections.md](sections.md) — three sections with the right unit lists.
- [convert.md](convert.md) — submit a value and see the result.
- [invalid-input.md](invalid-input.md) — non-numeric input shows inline error, no result.
