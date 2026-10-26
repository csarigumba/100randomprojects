import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/expense-tracker.js', import.meta.url));
let dir, file;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'expense-test-'));
  file = join(dir, 'expenses.json');
});

const run = (...args) => {
  const r = spawnSync(process.execPath, [bin, ...args], { env: { ...process.env, EXPENSES_FILE: file }, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
};
const data = () => JSON.parse(readFileSync(file, 'utf8'));
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('add stores expense dated today and increments ids', () => {
  assert.deepEqual(run('add', '--description', 'Lunch', '--amount', '20'), { code: 0, out: 'Expense added successfully (ID: 1)\n', err: '' });
  assert.equal(run('add', '--description', 'Dinner', '--amount', '10.5').out, 'Expense added successfully (ID: 2)\n');
  assert.deepEqual(data(), [
    { id: 1, date: today(), description: 'Lunch', amount: 20 },
    { id: 2, date: today(), description: 'Dinner', amount: 10.5 },
  ]);
});

test('add id is max existing id + 1', () => {
  run('add', '--description', 'A', '--amount', '1');
  run('add', '--description', 'B', '--amount', '2');
  run('delete', '--id', '1');
  assert.equal(run('add', '--description', 'C', '--amount', '3').out, 'Expense added successfully (ID: 3)\n');
});

test('add rejects bad amounts and leaves file unchanged', () => {
  run('add', '--description', 'Lunch', '--amount', '20');
  const before = readFileSync(file, 'utf8');
  for (const amount of [['--amount', '-5'], ['--amount=-5'], ['--amount', '0'], ['--amount', 'abc'], ['--amount', 'Infinity'], ['--amount', '']]) {
    const r = run('add', '--description', 'X', ...amount);
    assert.equal(r.code, 1, amount.join(' '));
    assert.match(r.err, /^Error: /);
    assert.equal(r.out, '');
  }
  assert.match(run('add', '--description', 'X', '--amount', '-5').err, /positive/);
  assert.equal(readFileSync(file, 'utf8'), before);
});

test('add requires description and amount', () => {
  for (const args of [['--amount', '5'], ['--description', '', '--amount', '5'], ['--description', '  ', '--amount', '5'], ['--description', 'X']]) {
    const r = run('add', ...args);
    assert.equal(r.code, 1, args.join(' '));
    assert.match(r.err, /^Error: /);
  }
  assert.equal(existsSync(file), false);
});

test('list prints header and padded rows', () => {
  run('add', '--description', 'Lunch', '--amount', '20');
  run('add', '--description', 'Dinner', '--amount', '10.5');
  const r = run('list');
  assert.equal(r.code, 0);
  const lines = r.out.trimEnd().split('\n');
  assert.match(lines[0], /^ID\s+Date\s+Description\s+Amount$/);
  assert.match(lines[1], new RegExp(`^1\\s+${today()}\\s+Lunch\\s+\\$20$`));
  assert.match(lines[2], new RegExp(`^2\\s+${today()}\\s+Dinner\\s+\\$10\\.5$`));
  assert.equal(lines.length, 3);
  assert.equal(lines[0].indexOf('Date'), lines[1].indexOf(today()));
});

test('list with missing file prints only header', () => {
  const r = run('list');
  assert.equal(r.code, 0);
  assert.match(r.out, /^ID\s+Date\s+Description\s+Amount\n$/);
});

test('delete removes expense; unknown id exits 1', () => {
  run('add', '--description', 'Lunch', '--amount', '20');
  assert.deepEqual(run('delete', '--id', '1'), { code: 0, out: 'Expense deleted successfully\n', err: '' });
  assert.deepEqual(data(), []);
  assert.deepEqual(run('delete', '--id', '1'), { code: 1, out: '', err: 'Error: Expense 1 not found\n' });
  assert.equal(run('delete').code, 1);
});

test('summary totals all and by month', () => {
  run('add', '--description', 'Lunch', '--amount', '20');
  run('add', '--description', 'Dinner', '--amount', '10.5');
  assert.deepEqual(run('summary'), { code: 0, out: 'Total expenses: $30.5\n', err: '' });
  const name = (m) => new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'long' });
  const cur = new Date().getMonth() + 1;
  const other = (cur % 12) + 1;
  assert.equal(run('summary', '--month', String(cur)).out, `Total expenses for ${name(cur)}: $30.5\n`);
  assert.equal(run('summary', '--month', String(other)).out, `Total expenses for ${name(other)}: $0\n`);
});

test('summary --month must be 1-12', () => {
  for (const m of ['0', '13', 'abc', '1.5', '-1']) {
    const r = run('summary', '--month', m);
    assert.equal(r.code, 1, m);
    assert.match(r.err, /^Error: /);
  }
});

test('export writes RFC 4180 CSV', () => {
  run('add', '--description', 'Lunch', '--amount', '20');
  run('add', '--description', 'Pizza, "large"', '--amount', '12');
  const out = join(dir, 'out.csv');
  assert.deepEqual(run('export', '--file', out), { code: 0, out: `Exported 2 expenses to ${out}\n`, err: '' });
  assert.equal(readFileSync(out, 'utf8'), `id,date,description,amount\n1,${today()},Lunch,20\n2,${today()},"Pizza, ""large""",12\n`);
  assert.equal(run('export').code, 1);
});

test('no command, unknown command, unknown flag exit 1 on stderr', () => {
  for (const args of [[], ['bogus'], ['list', '--nope']]) {
    const r = run(...args);
    assert.equal(r.code, 1, args.join(' '));
    assert.equal(r.out, '');
    assert.notEqual(r.err, '');
  }
  assert.match(run().err, /Usage:/);
});
