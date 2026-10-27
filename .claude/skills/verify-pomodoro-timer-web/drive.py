#!/usr/bin/python3 -I
"""Drive the pomodoro page in a fresh headless Chromium with Playwright's fake clock installed.

usage: drive.py URL STEP...
steps: start | pause | reset | ff <ms> | run <ms> | state | shot <path>
ff  <ms>: jump wall-clock time forward, firing due timers at most once (a throttled background tab).
run <ms>: advance time firing every timer on schedule (a foreground tab).
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright

url, steps = sys.argv[1].rstrip('/'), sys.argv[2:]
# Newest cached headless shell, so a playwright/browser version mismatch still runs; else playwright's default.
exes = sorted(glob.glob(os.path.expanduser(
    '~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell')))

def state(page):
    return page.evaluate("""() => {
        const $ = s => document.querySelector(s);
        return {
            time: $('#time').textContent, mode: $('#mode').textContent, data_mode: $('#mode').dataset.mode,
            count: $('#count').textContent, title: document.title,
            start_disabled: $('#start').disabled, pause_disabled: $('#pause').disabled, reset_disabled: $('#reset').disabled,
        };
    }""")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=exes[-1] if exes else None)
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.clock.install()
    page.goto(url + '/')
    page.wait_for_selector('#time')
    i = 0
    while i < len(steps):
        s, start = steps[i], i
        if s in ('start', 'pause', 'reset'):
            page.click(f'#{s}'); i += 1
        elif s == 'ff':
            page.clock.fast_forward(int(steps[i + 1])); i += 2
        elif s == 'run':
            page.clock.run_for(int(steps[i + 1])); i += 2
        elif s == 'state':
            print(json.dumps(state(page))); i += 1
        elif s == 'shot':
            page.screenshot(path=steps[i + 1], full_page=True); i += 2
        else:
            sys.exit(f'unknown step {s}')
        if s != 'state':
            print('>', ' '.join(steps[start:i]))
    browser.close()
    if errors:
        print('PAGE ERRORS:', errors); sys.exit(1)
