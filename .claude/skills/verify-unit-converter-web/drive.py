#!/usr/bin/env python3
"""Drive the unit converter page in headless Chromium.

Load only:   drive.py URL OUT.png
Convert:     drive.py URL OUT.png FAMILY VALUE FROM TO
Prints JSON: page title, each section's unit options, and (convert mode) result/error text.
"""
import glob, json, os, sys
from playwright.sync_api import sync_playwright

url, out, *conv = sys.argv[1:]
# Newest cached headless shell, so a playwright/browser version mismatch still runs; else playwright's default.
exes = sorted(glob.glob(os.path.expanduser(
    '~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell')))

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=exes[-1] if exes else None)
    page = browser.new_page()
    page.goto(url)
    report = {'url': page.url, 'title': page.title(), 'sections': {}}
    for f in ('length', 'weight', 'temperature'):
        if page.locator(f'#{f}').count():
            report['sections'][f] = {
                'from': page.locator(f'#{f}-from option').evaluate_all('os => os.map(o => o.value)'),
                'to': page.locator(f'#{f}-to option').evaluate_all('os => os.map(o => o.value)'),
            }
    if conv:
        f, value, frm, to = conv
        page.fill(f'#{f}-value', value)
        page.select_option(f'#{f}-from', frm)
        page.select_option(f'#{f}-to', to)
        page.click(f'#{f}-form button[type=submit]')
        page.wait_for_timeout(200)
        report['input'] = {'family': f, 'value': value, 'from': frm, 'to': to}
        report['result'] = page.text_content(f'#{f}-result')
        report['error'] = page.text_content(f'#{f}-error')
        report['error_visible'] = page.is_visible(f'#{f}-error')
        report['url_after'] = page.url
    page.screenshot(path=out, full_page=True)
    browser.close()
print(json.dumps(report, indent=2))
