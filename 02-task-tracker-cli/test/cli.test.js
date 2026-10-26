import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cliPath = join(import.meta.dirname, '..', 'src', 'cli.js');
const tmp = () => mkdtempSync(join(tmpdir(), 'task-cli-'));
const run = (cwd, ...args) => spawnSync('node', [cliPath, ...args], { cwd, encoding: 'utf8' });
const tasks = (cwd) => JSON.parse(readFileSync(join(cwd, 'tasks.json'), 'utf8'));
const tick = () => new Promise((r) => setTimeout(r, 5));

test('add creates tasks.json and prints id', () => {
  const dir = tmp();
  const r = run(dir, 'add', 'Buy milk');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'Task added (ID: 1)\n');
  const [t] = tasks(dir);
  assert.deepEqual(Object.keys(t), ['id', 'description', 'status', 'createdAt', 'updatedAt']);
  assert.equal(t.id, 1);
  assert.equal(t.description, 'Buy milk');
  assert.equal(t.status, 'todo');
  assert.equal(new Date(t.createdAt).toISOString(), t.createdAt);
  assert.equal(run(dir, 'add', 'Two').stdout, 'Task added (ID: 2)\n');
});

test('new id is max existing id + 1', () => {
  const dir = tmp();
  run(dir, 'add', 'a');
  run(dir, 'add', 'b');
  run(dir, 'delete', '1');
  assert.equal(run(dir, 'add', 'c').stdout, 'Task added (ID: 3)\n');
});

test('update changes description and bumps updatedAt', async () => {
  const dir = tmp();
  run(dir, 'add', 'old');
  const before = tasks(dir)[0];
  await tick();
  const r = run(dir, 'update', '1', 'new');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'Task updated (ID: 1)\n');
  const after = tasks(dir)[0];
  assert.equal(after.description, 'new');
  assert.equal(after.createdAt, before.createdAt);
  assert.ok(after.updatedAt > before.updatedAt);
});

test('delete removes the task', () => {
  const dir = tmp();
  run(dir, 'add', 'a');
  run(dir, 'add', 'b');
  const r = run(dir, 'delete', '1');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'Task deleted (ID: 1)\n');
  assert.deepEqual(tasks(dir).map((t) => t.id), [2]);
});

test('mark-in-progress and mark-done set status and bump updatedAt', async () => {
  const dir = tmp();
  run(dir, 'add', 'a');
  const t0 = tasks(dir)[0].updatedAt;
  await tick();
  let r = run(dir, 'mark-in-progress', '1');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'Task marked in-progress (ID: 1)\n');
  assert.equal(tasks(dir)[0].status, 'in-progress');
  assert.ok(tasks(dir)[0].updatedAt > t0);
  r = run(dir, 'mark-done', '1');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'Task marked done (ID: 1)\n');
  assert.equal(tasks(dir)[0].status, 'done');
});

test('unknown or non-numeric id errors, exits 1, leaves tasks.json unchanged', () => {
  const dir = tmp();
  run(dir, 'add', 'a');
  const before = readFileSync(join(dir, 'tasks.json'), 'utf8');
  for (const args of [['update', '9', 'x'], ['delete', '9'], ['mark-done', 'abc'], ['mark-in-progress', '9']]) {
    const r = run(dir, ...args);
    assert.equal(r.status, 1, args.join(' '));
    assert.equal(r.stdout, '');
    assert.equal(r.stderr, `Task not found (ID: ${args[1]})\n`);
  }
  assert.equal(readFileSync(join(dir, 'tasks.json'), 'utf8'), before);
});

test('list prints all tasks or filters by status', () => {
  const dir = tmp();
  assert.equal(run(dir, 'list').stdout, 'No tasks\n');
  run(dir, 'add', 'a');
  run(dir, 'add', 'b');
  run(dir, 'add', 'c');
  run(dir, 'mark-in-progress', '2');
  run(dir, 'mark-done', '3');
  const r = run(dir, 'list');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '1 [todo] a\n2 [in-progress] b\n3 [done] c\n');
  assert.equal(run(dir, 'list', 'todo').stdout, '1 [todo] a\n');
  assert.equal(run(dir, 'list', 'in-progress').stdout, '2 [in-progress] b\n');
  assert.equal(run(dir, 'list', 'done').stdout, '3 [done] c\n');
  run(dir, 'delete', '3');
  assert.equal(run(dir, 'list', 'done').stdout, 'No tasks\n');
});

test('usage on bad invocation, exit 1, no tasks.json written', () => {
  const dir = tmp();
  for (const args of [[], ['nope'], ['add'], ['update', '1'], ['delete'], ['mark-done'], ['list', 'bogus']]) {
    const r = run(dir, ...args);
    assert.equal(r.status, 1, args.join(' '));
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /^Usage: task-cli <command>\n/);
    for (const cmd of ['add', 'update', 'delete', 'mark-in-progress', 'mark-done', 'list']) {
      assert.ok(r.stderr.includes(cmd), cmd);
    }
  }
  assert.equal(existsSync(join(dir, 'tasks.json')), false);
});
