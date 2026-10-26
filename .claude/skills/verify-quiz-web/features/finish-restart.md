# Finish and restart

## Sub-features
- After Next on the last question: `#quiz` hidden, `#result` visible, `#score` exactly `N / total`, `#restart` visible.
- Restart: back to `Question 1 of <total>`, no feedback, score 0 (an all-wrong run after restart ends at `0 / total`).

## How to get to it (user POV)
Answer every question, then click Restart.

## Driving it with drive.py
For 5 questions, 3 right and 2 wrong: `drive.py URL right next wrong next right next wrong next right next state shot $EVIDENCE/3-score.png` → `score` `3 / 5`.
Restart: append `restart state shot $EVIDENCE/4-restart.png`, then every question `wrong next` and `state` → `0 / 5` proves the score reset.

## Gotchas
- Build the step list from `questions_json_count`; do not hard-code 5 if the file has more.
