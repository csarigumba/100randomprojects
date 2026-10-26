#!/usr/bin/env node
// Drive a page in headless system Chrome over CDP (Node built-in WebSocket, no deps).
// Usage: node drive.mjs <url> <evidence_dir> <step>...
// Steps: click:<css>  text:<css>  board  shot:<name>  wait:<ms>
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, outDir, ...steps] = process.argv.slice(2);
if (!url || !outDir) { console.error('usage: drive.mjs <url> <evidence_dir> <step>...'); process.exit(2); }
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = mkdtempSync(join(tmpdir(), 'ttt-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--window-size=600,700', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let code = 0;
try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100);
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id) pending.get(msg.id)?.(msg); else events.push(msg);
  };
  const send = (method, params = {}) => new Promise((r, j) => {
    const n = ++id; pending.set(n, (msg) => msg.error ? j(new Error(`${method}: ${msg.error.message}`)) : r(msg.result));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const evaluate = async (expr) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url });
  for (let i = 0; i < 50 && !events.some((e) => e.method === 'Page.loadEventFired'); i++) await sleep(100);
  await sleep(200); // module scripts settle
  console.log(`open ${url}`);

  for (const step of steps) {
    const [cmd, ...rest] = step.split(':'); const arg = rest.join(':');
    if (cmd === 'click') {
      const box = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(arg)});
        if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      if (!box) throw new Error(`no element ${arg}`);
      for (const type of ['mousePressed', 'mouseReleased'])
        await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      await sleep(100);
      console.log(`click ${arg}`);
    } else if (cmd === 'text') {
      console.log(`text ${arg} = ${JSON.stringify(await evaluate(`document.querySelector(${JSON.stringify(arg)})?.textContent.trim() ?? null`))}`);
    } else if (cmd === 'board') {
      const cells = await evaluate(`[...document.querySelectorAll('#board [data-index]')].map((c) => c.textContent.trim() || '.')`);
      console.log(`board\n  ${cells.slice(0, 3).join(' ')}\n  ${cells.slice(3, 6).join(' ')}\n  ${cells.slice(6, 9).join(' ')}`);
    } else if (cmd === 'shot') {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const file = join(outDir, `${arg}.png`); writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`shot ${file}`);
    } else if (cmd === 'wait') {
      await sleep(Number(arg));
    } else throw new Error(`unknown step ${step}`);
  }
  const errors = events.filter((e) => e.method === 'Runtime.exceptionThrown');
  for (const e of errors) console.log(`page error: ${e.params.exceptionDetails.exception?.description ?? e.params.exceptionDetails.text}`);
  if (errors.length) code = 1;
  ws.close();
} catch (err) {
  console.log(`FAIL ${err.message}`); code = 1;
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
process.exit(code);
