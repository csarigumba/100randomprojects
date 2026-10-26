#!/usr/bin/python3 -I
"""Drive the quiz page in a fresh headless Chromium.

usage: drive.py URL STEP...
steps: pick <i> (0-based choice index) | right | wrong | next | restart | state | shot <path>
`right` / `wrong` pick the correct / a wrong choice of the current question, read from questions.json.
"""
import glob, json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

url, steps = sys.argv[1].rstrip('/'), sys.argv[2:]
questions = json.load(urllib.request.urlopen(url + '/questions.json'))
# Newest cached headless shell, so a playwright/browser version mismatch still runs; else playwright's default.
exes = sorted(glob.glob(os.path.expanduser(
    '~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell')))

def state(page):
    return page.evaluate("""() => {
        const $ = s => document.querySelector(s);
        return {
            quiz_visible: !$('#quiz').hidden, result_visible: !$('#result').hidden, error_visible: !$('#error').hidden,
            progress: $('#progress').textContent, question: $('#question').textContent,
            choices: [...document.querySelectorAll('#choices .choice')].map(b => ({
                index: +b.dataset.index, text: b.textContent, disabled: b.disabled,
                result: b.dataset.result ?? null, correct: b.hasAttribute('data-correct')})),
            feedback: $('#feedback').textContent, next_visible: !$('#next').hidden && !$('#quiz').hidden,
            score: $('#score').textContent, restart_visible: !$('#restart').hidden && !$('#result').hidden,
        };
    }""")

def current(page):
    return questions[int(page.text_content('#progress').split()[1]) - 1]

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=exes[-1] if exes else None)
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url + '/')
    page.wait_for_selector('#choices .choice')
    print(json.dumps({'questions_json_count': len(questions)}))
    i = 0
    while i < len(steps):
        s, start = steps[i], i
        if s in ('pick', 'right', 'wrong'):
            q = current(page)
            n = int(steps[i + 1]) if s == 'pick' else q['answer'] if s == 'right' else (q['answer'] + 1) % len(q['choices'])
            page.click(f'#choices .choice[data-index="{n}"]'); i += 2 if s == 'pick' else 1
        elif s in ('next', 'restart'):
            page.click(f'#{s}'); i += 1
        elif s == 'state':
            print(json.dumps(state(page), indent=1)); i += 1
        elif s == 'shot':
            page.screenshot(path=steps[i + 1], full_page=True); i += 2
        else:
            sys.exit(f'unknown step {s}')
        if s != 'state':
            print('>', ' '.join(steps[start:i]))
    browser.close()
    if errors:
        print('PAGE ERRORS:', errors); sys.exit(1)
