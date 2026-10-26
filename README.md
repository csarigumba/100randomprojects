# 100 random projects

Each project lives in its own numbered folder and is built end to end by `/sidstack:ship` (https://github.com/csarigumba/sidstack): planned, built by parallel agents, proved on the real app, reviewed by a fresh-context agent, and opened as a PR with evidence. I merge.

From project 2 on, `/sidstack:factory` runs the board: each project is a GitHub issue labelled `factory:ready`, worked by a fresh headless `/sidstack:ship #<n>`, and merged by a script only when the reviewer said `ship` on the exact head commit, no path matches `.factory/escalate`, and `.factory/check` (every folder's `npm test`) passes on that commit. Anything else lands in `factory:blocked` with the reason on the issue.

| # | project | folder |
|---|---|---|
| 1 | Personal blogging platform API | `01-blogging-platform-api/` |
