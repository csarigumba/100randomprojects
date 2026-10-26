import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCsv, stats } from '../src/stats.js';

const bin = join(import.meta.dirname, '..', 'bin', 'csv-stats.js');
const dir = mkdtempSync(join(tmpdir(), 'csv stats '));
after(() => rmSync(dir, { recursive: true, force: true }));
const file = (name, text) => {
  const path = join(dir, name);
  writeFileSync(path, text);
  return path;
};
const run = (...args) => new Promise((resolve) => {
  execFile(process.execPath, [bin, ...args], (err, stdout, stderr) => resolve({ code: err?.code ?? 0, stdout, stderr }));
});
const DATA = 'name,age,city,score\nAlice,30,"Paris, FR",9.5\nBob,25,"He said ""hi""",7\nCara,,London,\nDan,40,London,x\n';

test('parseCsv: quoted commas, doubled quotes, quoted newlines, CRLF, trailing newline', () => {
  assert.deepEqual(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n"multi\nline",z\r\nlast,\n'), [
    { line: 1, fields: ['a', 'b'] },
    { line: 2, fields: ['x, y', 'say "hi"'] },
    { line: 3, fields: ['multi\nline', 'z'] },
    { line: 5, fields: ['last', ''] },
  ]);
  assert.deepEqual(parseCsv('a\n1'), [{ line: 1, fields: ['a'] }, { line: 2, fields: ['1'] }]);
});

test('parseCsv: unterminated quote names the line the record starts on', () => {
  assert.throws(() => parseCsv('a,b\n1,2\n3,"oops\nmore\n'), { message: 'line 3: unterminated quote' });
});

test('stats: numeric, text, empty cells skipped, all-empty column', () => {
  assert.deepEqual(stats(DATA), [
    'name\ttext\tcount=4\tdistinct=4',
    'age\tnumeric\tcount=3\tmin=25\tmax=40\tmean=31.67',
    'city\ttext\tcount=4\tdistinct=3',
    'score\ttext\tcount=3\tdistinct=3',
  ]);
  assert.deepEqual(stats('n,e\n 7 ,\n7, \n'), ['n\tnumeric\tcount=2\tmin=7\tmax=7\tmean=7', 'e\ttext\tcount=0\tdistinct=0']);
});

test('stats: --column filter and errors', () => {
  assert.deepEqual(stats(DATA, 'age'), ['age\tnumeric\tcount=3\tmin=25\tmax=40\tmean=31.67']);
  assert.throws(() => stats(DATA, 'Age'), { message: 'unknown column: Age' });
  assert.throws(() => stats('a,b\n1,2\n3\n4,5\n'), { message: 'line 3: expected 2 fields, got 1' });
  assert.throws(() => stats('a,b\n"x\ny",1\n2\n'), { message: 'line 4: expected 2 fields, got 1' });
  assert.throws(() => stats(''), { message: 'empty file' });
});

test('stats: BOM stripped, blank records skipped, blank-only file is empty', () => {
  assert.deepEqual(stats('\uFEFFname,age\nA,1\n', 'name'), ['name\ttext\tcount=1\tdistinct=1']);
  assert.deepEqual(stats('a,b\n1,2\n\n3,4\n\n'), stats('a,b\n1,2\n3,4\n'));
  for (const text of ['\n', '\r\n', '\uFEFF', '\n\n']) assert.throws(() => stats(text), { message: 'empty file' });
});

test('cli: prints stats and filters by --column', async () => {
  const data = file('data.csv', DATA);
  assert.deepEqual(await run(data), { code: 0, stderr: '', stdout: `${stats(DATA).join('\n')}\n` });
  assert.deepEqual(await run(data, '--column', 'city'), { code: 0, stderr: '', stdout: 'city\ttext\tcount=4\tdistinct=3\n' });
});

test('cli: errors go to stderr with exit codes', async () => {
  const usage = 'usage: csv-stats <file.csv> [--column <name>]\n';
  const data = file('data2.csv', DATA);
  assert.deepEqual(await run(), { code: 2, stdout: '', stderr: usage });
  assert.deepEqual(await run(data, 'extra'), { code: 2, stdout: '', stderr: usage });
  assert.deepEqual(await run(data, '--nope'), { code: 2, stdout: '', stderr: usage });
  const missing = join(dir, 'missing.csv');
  assert.deepEqual(await run(missing), { code: 1, stdout: '', stderr: `csv-stats: cannot read ${missing}: ENOENT\n` });
  assert.deepEqual(await run(file('empty.csv', '')), { code: 1, stdout: '', stderr: 'csv-stats: empty file\n' });
  assert.deepEqual(await run(file('blank.csv', '\r\n')), { code: 1, stdout: '', stderr: 'csv-stats: empty file\n' });
  assert.deepEqual(await run(file('bad.csv', 'a,b\n1,2\n3\n4,5\n')), { code: 1, stdout: '', stderr: 'csv-stats: line 3: expected 2 fields, got 1\n' });
  assert.deepEqual(await run(file('open.csv', 'a\n"x\n')), { code: 1, stdout: '', stderr: 'csv-stats: line 2: unterminated quote\n' });
  assert.deepEqual(await run(data, '--column', 'nope'), { code: 1, stdout: '', stderr: 'csv-stats: unknown column: nope\n' });
});
