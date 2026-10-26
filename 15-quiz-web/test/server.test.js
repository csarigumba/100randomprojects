import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { connect } from 'node:net';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { server, loadQuestions } from '../server.js';

const root = join(import.meta.dirname, '..');
server.listen(0);
await once(server, 'listening');
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

test('routes serve files with content types, query string ignored', async () => {
  for (const [path, type] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/quiz.js', 'text/javascript'], ['/?x=1', 'text/html']]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type'), new RegExp(`^${type}; charset=utf-8$`), path);
  }
});

test('GET /questions.json returns the questions file', async () => {
  const res = await fetch(`${base}/questions.json`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  const questions = await res.json();
  assert.deepEqual(questions, JSON.parse(readFileSync(join(root, 'questions.json'), 'utf8')));
  assert.ok(questions.length >= 5);
  assert.ok(questions.every((q) => q.choices.length >= 3 && q.choices.length <= 4));
});

test('unknown path is 404', async () => {
  assert.equal((await fetch(`${base}/nope`)).status, 404);
});

test('loadQuestions throws on invalid JSON and on malformed questions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'quiz-'));
  writeFileSync(join(dir, 'bad.json'), '[{');
  assert.throws(() => loadQuestions(join(dir, 'bad.json')), SyntaxError);
  writeFileSync(join(dir, 'range.json'), '[{"question":"x","choices":["a","b","c"],"answer":5}]');
  assert.throws(() => loadQuestions(join(dir, 'range.json')), /question 1/);
});

test('malformed request URL gets an error response and the server keeps serving', async () => {
  const socket = connect(server.address().port);
  socket.end('GET //% HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n');
  let reply = '';
  for await (const chunk of socket) reply += chunk;
  assert.match(reply, /^HTTP\/1\.1 (400|500)/);
  assert.equal((await fetch(`${base}/`)).status, 200);
});

test('bad PORT exits 1 naming PORT', () => {
  const r = spawnSync(process.execPath, [join(root, 'server.js')], { env: { ...process.env, PORT: 'abc' }, encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /PORT/);
});
