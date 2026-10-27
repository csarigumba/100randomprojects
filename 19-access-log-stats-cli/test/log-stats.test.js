import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createWriteStream, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { finished } from 'node:stream/promises';
import { parseLine, summarize, toTime } from '../src/stats.js';

const bin = join(import.meta.dirname, '..', 'bin', 'log-stats.js');
const dir = mkdtempSync(join(tmpdir(), 'log stats '));
after(() => rmSync(dir, { recursive: true, force: true }));
const file = (name, text) => {
  const path = join(dir, name);
  writeFileSync(path, text);
  return path;
};
const run = (args, env = process.env) => new Promise((resolve) => {
  execFile(process.execPath, [bin, ...args], { env, maxBuffer: 1 << 20 }, (err, stdout, stderr) => resolve({ code: err?.code ?? err?.signal ?? 0, stdout, stderr }));
});
const LOG = [
  '127.0.0.1 - - [10/Oct/2026:13:55:36 +0000] "GET /index.html HTTP/1.1" 200 2326',
  '127.0.0.1 - - [10/Oct/2026:13:56:00 +0000] "GET /index.html HTTP/1.1" 200 2326',
  '10.0.0.2 - frank [10/Oct/2026:14:00:00 +0000] "GET /about?ref=home HTTP/1.1" 200 512',
  '10.0.0.2 - - [10/Oct/2026:14:01:00 +0000] "GET /about HTTP/1.1" 304 0',
  '10.0.0.3 - - [11/Oct/2026:09:00:00 +0000] "POST /login HTTP/1.1" 302 -',
  '10.0.0.3 - - [11/Oct/2026:09:00:05 +0000] "GET /missing HTTP/1.1" 404 153',
  'this line is garbage',
  '10.0.0.4 - - [11/Oct/2026:10:00:00 +0000] "GET /index.html HTTP/1.1" 200 2326',
  '10.0.0.4 - - [11/Oct/2026:10:05:00 +0000] "GET /api/data HTTP/1.1" 500 87',
  '10.0.0.5 - - [12/Oct/2026:08:00:00 +0200] "GET /api/data HTTP/1.1" 200 900',
  '10.0.0.5 - - [12/Oct/2026:08:30:00 +0200] "GET /contact HTTP/1.1" 200 400',
  '10.0.0.6 - - [12/Oct/2026:12:00:00 +0000] "GET /favicon.ico HTTP/1.1" 404 0',
  '10.0.0.6 - - [not a date] "GET /x HTTP/1.1" 200 1',
].join('\n') + '\n';
const SUMMARY = 'total\t11\n2xx\t6\n3xx\t2\n4xx\t2\n5xx\t1\ntop paths\n3\t/index.html\n2\t/about\n2\t/api/data\n1\t/login\n1\t/missing\nskipped\t2\n';
const USAGE = 'usage: log-stats <file> [--top N] [--since <ISO date>]\n';

test('toTime: valid ISO dates, offsets, and rejects', () => {
  assert.equal(toTime('2026-10-11'), Date.UTC(2026, 9, 11));
  assert.equal(toTime('2026-10-11T09:00:05Z'), Date.UTC(2026, 9, 11, 9, 0, 5));
  assert.equal(toTime('2026-10-12T08:00:00+02:00'), Date.UTC(2026, 9, 12, 6));
  assert.equal(toTime('2026-10-11T09:00:05.250-01:30'), Date.UTC(2026, 9, 11, 10, 30, 5, 250));
  assert.equal(toTime('2024-02-29'), Date.UTC(2024, 1, 29));
  for (const bad of ['', 'yesterday', '10/11/2026', '2026-13-01', '2026-00-10', '2026-02-30', '2026-02-29', '2026-04-31', '2026-10-00',
    '2026-10-11T24:00Z', '2026-10-11T09:60Z', '2026-10-11T09:00:61Z', '2026-10-11T09:00+25:00', '2026-10-11 09:00Z', '2026-1-1', '2026-10-11Z',
    '2026-10-11T09:00', '2026-10-11T09:00:05']) {
    assert.ok(Number.isNaN(toTime(bad)), bad);
  }
});

test('parseLine: CLF and Combined, query stripped, bad lines null', () => {
  assert.deepEqual(parseLine('10.0.0.2 - frank [10/Oct/2026:14:00:00 +0000] "GET /about?ref=home HTTP/1.1" 200 512'),
    { time: Date.UTC(2026, 9, 10, 14), status: '200', path: '/about' });
  assert.deepEqual(parseLine('h - - [12/Oct/2026:08:00:00 +0200] "POST /a HTTP/1.1" 302 - "http://ref/" "Mozilla/5.0 (X11)"'),
    { time: Date.UTC(2026, 9, 12, 6), status: '302', path: '/a' });
  assert.deepEqual(parseLine('h - - [01/Jan/2026:00:00:00 -0530] "GET / HTTP/1.0" 101 0'), { time: Date.UTC(2026, 0, 1, 5, 30), status: '101', path: '/' });
  for (const bad of ['', 'this line is garbage', 'h - - [not a date] "GET /x HTTP/1.1" 200 1',
    'h - - [30/Feb/2026:00:00:00 +0000] "GET /x HTTP/1.1" 200 1', 'h - - [10/Foo/2026:00:00:00 +0000] "GET /x HTTP/1.1" 200 1',
    'h - - [10/Oct/2026:25:00:00 +0000] "GET /x HTTP/1.1" 200 1', 'h - - [10/Oct/2026:00:00:00 +0000] "GET /x HTTP/1.1" 20 1',
    'h - - [10/Oct/2026:00:00:00 +0000] "-" 400 0', 'h - - [10/Oct/2026:00:00:00 +0000] "GET /x HTTP/1.1" 200 abc']) {
    assert.equal(parseLine(bad), null, bad);
  }
});

test('summarize: classes, top N with tie order, since, skipped', async () => {
  const lines = LOG.trimEnd().split('\n');
  assert.equal((await summarize(lines)).join('\n') + '\n', SUMMARY);
  assert.deepEqual((await summarize(lines, { top: 2 })).slice(5, 8), ['top paths', '3\t/index.html', '2\t/about']);
  assert.deepEqual(await summarize(lines, { since: Date.UTC(2026, 9, 12, 7) }),
    ['total\t1', '2xx\t0', '3xx\t0', '4xx\t1', '5xx\t0', 'top paths', '1\t/favicon.ico', 'skipped\t2']);
  assert.deepEqual(await summarize(['h - - [10/Oct/2026:00:00:00 +0000] "GET /x HTTP/1.1" 199 1']),
    ['total\t1', '2xx\t0', '3xx\t0', '4xx\t0', '5xx\t0', 'top paths', '1\t/x', 'skipped\t0']);
  assert.deepEqual(await summarize([]), ['total\t0', '2xx\t0', '3xx\t0', '4xx\t0', '5xx\t0', 'top paths', 'skipped\t0']);
});

test('cli: default summary and CRLF lines', async () => {
  assert.deepEqual(await run([file('access.log', LOG)]), { code: 0, stderr: '', stdout: SUMMARY });
  assert.deepEqual(await run([file('crlf.log', LOG.replaceAll('\n', '\r\n'))]), { code: 0, stderr: '', stdout: SUMMARY });
});

test('cli: --top', async () => {
  const log = file('top.log', LOG);
  const head = 'total\t11\n2xx\t6\n3xx\t2\n4xx\t2\n5xx\t1\ntop paths\n';
  assert.deepEqual(await run([log, '--top', '2']), { code: 0, stderr: '', stdout: `${head}3\t/index.html\n2\t/about\nskipped\t2\n` });
  const all = await run([log, '--top=100']);
  assert.equal(all.stdout.split('\n').length - 1, 14);
  for (const n of ['0', '-1', '1.5', 'abc', '2x', '', '05', '+3']) {
    assert.deepEqual(await run([log, `--top=${n}`]), { code: 1, stdout: '', stderr: `log-stats: --top must be a positive integer, got ${n}\n` });
  }
  assert.deepEqual(await run([log, '--top']), { code: 1, stdout: '', stderr: USAGE });
});

test('cli: --since', async () => {
  const log = file('since.log', LOG);
  assert.deepEqual(await run([log, '--since', '2026-10-11T09:00:05Z']), { code: 0, stderr: '',
    stdout: 'total\t6\n2xx\t3\n3xx\t0\n4xx\t2\n5xx\t1\ntop paths\n2\t/api/data\n1\t/missing\n1\t/index.html\n1\t/contact\n1\t/favicon.ico\nskipped\t2\n' });
  assert.deepEqual(await run([log, '--since', '2026-10-12T07:00:00Z']), { code: 0, stderr: '',
    stdout: 'total\t1\n2xx\t0\n3xx\t0\n4xx\t1\n5xx\t0\ntop paths\n1\t/favicon.ico\nskipped\t2\n' });
  for (const d of ['yesterday', '2026-13-01', '2026-02-30', '10/11/2026', '']) {
    assert.deepEqual(await run([log, `--since=${d}`]), { code: 1, stdout: '', stderr: `log-stats: --since must be an ISO date, got ${d}\n` });
  }
  assert.deepEqual(await run([log, '--since', '2026-10-11T09:00']), { code: 1, stdout: '',
    stderr: 'log-stats: --since must be an ISO date, got 2026-10-11T09:00\n' });
});

test('cli: usage and unreadable file errors', async () => {
  const log = file('err.log', LOG);
  assert.deepEqual(await run([]), { code: 1, stdout: '', stderr: USAGE });
  assert.deepEqual(await run([log, log]), { code: 1, stdout: '', stderr: USAGE });
  assert.deepEqual(await run([log, '--bogus']), { code: 1, stdout: '', stderr: USAGE });
  const missing = join(dir, 'nope.log');
  assert.deepEqual(await run([missing]), { code: 1, stdout: '', stderr: `log-stats: cannot read ${missing}: ENOENT\n` });
  assert.deepEqual(await run([dir]), { code: 1, stdout: '', stderr: `log-stats: cannot read ${dir}: EISDIR\n` });
});

test('cli: streams a file larger than the heap limit', async () => {
  const line = '10.0.0.1 - - [10/Oct/2026:13:55:36 +0000] "GET /index.html HTTP/1.1" 200 2326\n';
  const chunk = line.repeat(10000);
  const big = join(dir, 'big.log');
  const out = createWriteStream(big);
  for (let i = 0; i < 100; i++) if (!out.write(chunk)) await new Promise((r) => out.once('drain', r));
  out.end();
  await finished(out);
  const env = { ...process.env, NODE_OPTIONS: '--max-old-space-size=16' };
  const control = await new Promise((resolve) => execFile(process.execPath,
    ['-e', 'require("fs").readFileSync(process.argv[1], "utf8").split("\\n").length', big], { env }, (err) => resolve(err?.code ?? err?.signal ?? 0)));
  assert.notEqual(control, 0);
  assert.deepEqual(await run([big], env), { code: 0, stderr: '',
    stdout: 'total\t1000000\n2xx\t1000000\n3xx\t0\n4xx\t0\n5xx\t0\ntop paths\n1000000\t/index.html\nskipped\t0\n' });
});
