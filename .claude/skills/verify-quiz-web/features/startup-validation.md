# Startup validation

## Sub-features
- Malformed `questions.json` → server exits 1, stderr names `questions.json` and the problem.
- Bad `PORT` (e.g. `abc`, `0`, `70000`) → exit 1, stderr names `PORT`.

## How to get to it (user POV)
Edit `questions.json` badly, or set `PORT`, then `npm start`.

## Driving it with drive.py
No browser. Never edit the real file; copy the app to a scratch dir:
```
T=$(mktemp -d) && cp -R 15-quiz-web/. $T && echo '[{"question":"x","choices":["a"],"answer":5}]' > $T/questions.json
node $T/server.js; echo "exit $?"            # → exit 1 + message naming questions.json
PORT=abc node 15-quiz-web/server.js; echo "exit $?"   # → exit 1 + message naming PORT
```
Then delete `$T` as its own command.

## Gotchas
- Pure validation rules are unit-tested in `test/quiz.test.js`; this checks the wiring at startup.
