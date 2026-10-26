#!/usr/bin/python3 -I
"""Drive the kanban page in a fresh headless Chrome profile.

usage: drive.py URL STEP...
steps: add <title> | move <title> left|right | delete <title> | reload | state | shot <path>
Each run starts with empty localStorage; `reload` keeps it (same browser context).
"""
import json, sys
from playwright.sync_api import sync_playwright

url, steps = sys.argv[1], sys.argv[2:]

def card(page, title):
    return page.locator('li.card').filter(has=page.locator('span.title', has_text=title)).first

def state(page):
    cols = page.evaluate("""() => Object.fromEntries([...document.querySelectorAll('section[data-column]')].map(s =>
        [s.dataset.column, [...s.querySelectorAll('li.card')].map(li => ({
            title: li.querySelector('span.title').textContent,
            left: !li.querySelector('[data-action=left]').disabled,
            right: !li.querySelector('[data-action=right]').disabled,
            delete: !!li.querySelector('[data-action=delete]')}))]))""")
    return {'dom': cols, 'localStorage': page.evaluate("localStorage.getItem('kanban-board')"),
            'headings': page.locator('section[data-column] h2').all_inner_texts()}

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url)
    i = 0
    while i < len(steps):
        s, start = steps[i], i
        if s == 'add':
            page.fill('#title', steps[i + 1]); page.click('#add-form button[type=submit]'); i += 2
        elif s == 'move':
            card(page, steps[i + 1]).locator(f'[data-action={steps[i + 2]}]').click(); i += 3
        elif s == 'delete':
            card(page, steps[i + 1]).locator('[data-action=delete]').click(); i += 2
        elif s == 'reload':
            page.reload(); i += 1
        elif s == 'state':
            print(json.dumps(state(page), indent=1)); i += 1
        elif s == 'shot':
            page.screenshot(path=steps[i + 1], full_page=True); i += 2
        else:
            sys.exit(f'unknown step {s}')
        if s != 'state':
            print('>', ' '.join(steps[start:i]))
    if errors:
        print('PAGE ERRORS:', errors); sys.exit(1)
    browser.close()
