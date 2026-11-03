# 100randomprojects

Each project lives in its own numbered folder. A change touches only that folder and its `.claude/skills/verify-<app>/`.

The rules below come from findings the factory reviewer raised in two or more tickets (`/sidstack:factory retro`, 2026-10-26). Each one cost fix rounds when it was missed.

- Code that uses `import.meta.main` needs Node 24.2 or later. Set `"engines": { "node": ">=24.2" }` and say so in the README. (#4, #5, #10, #11)
- A server never crashes on a request. Put one try/catch around the whole request handler, body read included, that answers 500, so a client that drops mid-request or sends a malformed URL cannot kill the process. Add a regression test that does one of these. (#5, #8, #11)
- Tests locate files with `import.meta.dirname` or `fileURLToPath(import.meta.url)`, never `new URL(...).pathname`, which keeps `%20` and breaks when the path has a space. (#7, #8, #12)
- Numbers from env vars and CLI flags are parsed and range-checked at startup. A bad value exits 1 with a message naming it. (#8, #10)
- Any path that matches, case-folds, or echoes user text gets a test with a non-ASCII value such as `CAFÉ`. SQLite `lower()` and `LIKE` fold only A to Z, so fold case in JS. (#5, #36)
