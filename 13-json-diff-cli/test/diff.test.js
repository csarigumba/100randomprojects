import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diff } from '../src/diff.js';

const bin = join(import.meta.dirname, '../bin/json-diff.js');
let dir;
const file = (name, text) => {
  writeFileSync(join(dir, name), text);
  return join(dir, name);
};
before(() => { dir = mkdtempSync(join(tmpdir(), 'jd test ')); });
after(() => rmSync(dir, { recursive: true }));

const run = (...args) => new Promise((resolve) =>
  execFile(process.execPath, [bin, ...args], (err, stdout, stderr) => resolve({ code: err?.code ?? 0, stdout, stderr })));

test('identical values give no lines', () => {
  assert.deepEqual(diff({ a: [1, { b: null }], c: 'x' }, { a: [1, { b: null }], c: 'x' }), []);
});

test('added, removed, changed keys in a order then b-only keys', () => {
  assert.deepEqual(diff({ x: 1, gone: 'a', y: true }, { y: false, x: 1, added: { k: [1] } }), [
    '- gone: "a"',
    '~ y: true -> false',
    '+ added: {"k":[1]}',
  ]);
});

test('nested objects and arrays use dot and bracket paths', () => {
  assert.deepEqual(diff({ server: { ports: [80, { p: 1 }] } }, { server: { ports: [81, { p: 2 }] } }), [
    '~ server.ports[0]: 80 -> 81',
    '~ server.ports[1].p: 1 -> 2',
  ]);
});

test('arrays compare by index: longer b adds, shorter b removes', () => {
  assert.deepEqual(diff({ a: [1] }, { a: [1, 2, 3] }), ['+ a[1]: 2', '+ a[2]: 3']);
  assert.deepEqual(diff({ a: [1, 2, 3] }, { a: [1] }), ['- a[1]: 2', '- a[2]: 3']);
  assert.deepEqual(diff([1], [2]), ['~ [0]: 1 -> 2']);
});

test('type changes print one ~ line with full values', () => {
  assert.deepEqual(diff({ t: null, o: { a: 1 }, s: '1' }, { t: { c: 1 }, o: [1], s: 1 }), [
    '~ t: null -> {"c":1}',
    '~ o: {"a":1} -> [1]',
    '~ s: "1" -> 1',
  ]);
});

test('root scalar or type difference uses (root)', () => {
  assert.deepEqual(diff(1, 2), ['~ (root): 1 -> 2']);
  assert.deepEqual(diff({}, []), ['~ (root): {} -> []']);
  assert.deepEqual(diff('a', 'a'), []);
});

test('non-identifier keys are JSON-quoted in brackets', () => {
  assert.deepEqual(diff({ headers: { 'content-type': 'a' }, 'a b': 1 }, { headers: { 'content-type': 'b' }, 'a b': 2 }), [
    '~ headers["content-type"]: "a" -> "b"',
    '~ ["a b"]: 1 -> 2',
  ]);
});

test('inherited property names are not treated as present', () => {
  assert.deepEqual(diff({ toString: 1 }, {}), ['- toString: 1']);
  assert.deepEqual(diff({}, JSON.parse('{"__proto__": 1}')), ['+ __proto__: 1']);
});

test('ignore skips the path and everything under it, not sibling prefixes', () => {
  const a = { server: { ports: [1, 2], portsX: 1, host: 'a' }, debug: false };
  const b = { server: { ports: [3], portsX: 2, host: 'b' }, debug: true };
  assert.deepEqual(diff(a, b, { ignore: ['server.ports'] }), [
    '~ server.portsX: 1 -> 2',
    '~ server.host: "a" -> "b"',
    '~ debug: false -> true',
  ]);
  assert.deepEqual(diff(a, b, { ignore: ['server', 'debug'] }), []);
  assert.deepEqual(diff({ a: [1, 2] }, { a: [3, 4] }, { ignore: ['a[0]'] }), ['~ a[1]: 2 -> 4']);
});

test('cli: identical files print nothing, exit 0', async () => {
  const a = file('a.json', '{"a": [1, 2]}');
  assert.deepEqual(await run(a, a), { code: 0, stdout: '', stderr: '' });
});

test('cli: differences print one line each, exit 1', async () => {
  const { code, stdout, stderr } = await run(file('a.json', '{"a": 1, "b": [1]}'), file('b.json', '{"a": 2, "b": [1, 2]}'));
  assert.equal(code, 1);
  assert.equal(stdout, '~ a: 1 -> 2\n+ b[1]: 2\n');
  assert.equal(stderr, '');
});

test('cli: --ignore is repeatable', async () => {
  const a = file('a.json', '{"a": 1, "b": {"c": 1}, "d": 1}');
  const b = file('b.json', '{"a": 2, "b": {"c": 2}, "d": 2}');
  const { code, stdout } = await run(a, b, '--ignore', 'a', '--ignore', 'b');
  assert.equal(code, 1);
  assert.equal(stdout, '~ d: 1 -> 2\n');
  assert.deepEqual(await run(a, b, '--ignore', 'a', '--ignore', 'b', '--ignore', 'd'), { code: 0, stdout: '', stderr: '' });
});

test('cli: missing file exits 2 naming the file', async () => {
  const missing = join(dir, 'nope.json');
  const { code, stdout, stderr } = await run(missing, file('a.json', '{}'));
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.ok(stderr.startsWith(`json-diff: cannot read ${missing}: `), stderr);
});

test('cli: invalid JSON exits 2 naming the file', async () => {
  const bad = file('bad.json', '{ "a": 1, }');
  const { code, stdout, stderr } = await run(file('a.json', '{}'), bad);
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.ok(stderr.startsWith(`json-diff: invalid JSON in ${bad}: `), stderr);
});

test('cli: usage errors exit 2', async () => {
  const a = file('a.json', '{}');
  for (const args of [[], [a], [a, a, a], [a, a, '--bogus'], [a, a, '--ignore']]) {
    const { code, stdout, stderr } = await run(...args);
    assert.equal(code, 2, args.join(' '));
    assert.equal(stdout, '');
    assert.match(stderr, /usage: json-diff/);
  }
});
