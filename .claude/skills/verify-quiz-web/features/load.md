# Page loads questions

## Sub-features
- Routes `/`, `/app.js`, `/quiz.js`, `/questions.json`; anything else 404.
- Page shows question 1 of `questions.json` (≥5 questions, 3–4 choices each), `#progress` = `Question 1 of <total>`.

## How to get to it (user POV)
`cd 15-quiz-web && npm start`, open `http://localhost:3000`.

## Driving it with drive.py
`curl -s localhost:3515/questions.json | tee $EVIDENCE/1-questions.json`, then `drive.py http://localhost:3515 state shot $EVIDENCE/1-load.png` → `question` equals `questions[0].question`, choice texts equal `questions[0].choices`, `quiz_visible: true`, `result_visible: false`, `next_visible: false`.

## Gotchas
- Launch uses `PORT=3515 npm start`, so a passing launch proves `npm start` serves the page.
- Check the file's shape too: `node -p "require('./15-quiz-web/questions.json').map(q => q.choices.length)"`.
