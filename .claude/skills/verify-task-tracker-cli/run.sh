#!/usr/bin/env bash
# Usage: run.sh <workdir> [task-cli args...]
# Runs task-cli in <workdir>; prints the command, stdout, stderr, exit code, and tasks.json after.
set -u
work=$1; shift
app="$(cd "$(dirname "$0")/../../.." && pwd)/02-task-tracker-cli"
out=$(mktemp); err=$(mktemp)
(cd "$work" && node "$app/src/cli.js" "$@" >"$out" 2>"$err"); code=$?
printf '$ task-cli'; [ $# -gt 0 ] && printf ' %q' "$@"; echo
echo "--- stdout"; cat "$out"
echo "--- stderr"; cat "$err"
echo "--- exit: $code"
echo "--- tasks.json"; cat "$work/tasks.json" 2>/dev/null || echo "(missing)"
echo
rm -f "$out" "$err"
exit $code
