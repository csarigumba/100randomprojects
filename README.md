# 100 random projects

Each project lives in its own numbered folder and is built end to end by `/sidstack:ship` (https://github.com/csarigumba/sidstack): planned, built by parallel agents, proved on the real app, reviewed by a fresh-context agent, and opened as a PR with evidence. I merge.

From project 2 on, `/sidstack:factory` runs the board: each project is a GitHub issue labelled `factory:ready`, worked by a fresh headless `/sidstack:ship #<n>`, and merged by a script only when the reviewer said `ship` on the exact head commit, no path matches `.factory/escalate`, and `.factory/check` (every folder's `npm test`) passes on that commit. Anything else lands in `factory:blocked` with the reason on the issue.

| # | project | folder |
|---|---|---|
| 1 | Personal blogging platform API | `01-blogging-platform-api/` |
| 2 | Task tracker CLI | `02-task-tracker-cli/` |
| 3 | Unit converter web page | `03-unit-converter-web/` |
| 4 | URL shortener API | `04-url-shortener-api/` |
| 5 | Expense tracker CLI | `05-expense-tracker-cli/` |
| 6 | Number guessing game CLI | `06-number-guessing-cli/` |
| 7 | Caching proxy server | `07-caching-proxy-cli/` |
| 8 | Tic-tac-toe web game | `08-tic-tac-toe-web/` |
| 9 | Rate-limited API | `09-rate-limited-api/` |
| 10 | Kanban board web app | `10-kanban-board-web/` |
| 11 | Broken link checker CLI | `11-broken-link-checker-cli/` |
