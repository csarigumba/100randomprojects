import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { createProxy } from '../src/proxy.js';

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../bin/caching-proxy.js', import.meta.url));
const hits = [];
let origin, proxy, base;

before(() => {
  origin = http.createServer(async (req, res) => {
    const body = Buffer.concat(await req.toArray()).toString();
    hits.push(`${req.method} ${req.url} ${body}`);
    if (req.url === '/partial') return res.writeHead(200, { 'content-length': '100' }).write('part', () => res.socket.destroy());
    if (req.url === '/etag' && req.headers['if-none-match']) return res.writeHead(304).end();
    if (req.url === '/range' && req.headers.range) return res.writeHead(206).end('part');
    if (req.url === '/if-match' && req.headers['if-match']) return res.writeHead(412).end();
    if (req.url === '/if-unmodified-since' && req.headers['if-unmodified-since']) return res.writeHead(412).end();
    if (req.url === '/gzip') return res.writeHead(200, { 'content-encoding': 'gzip' }).end(zlib.gzipSync('plain text'));
    res.writeHead(req.url.startsWith('/missing') ? 404 : 200, { 'content-type': 'text/plain', 'x-origin': 'yes' });
    res.end(`${req.method} ${req.url} ${body} #${hits.length}`);
  }).listen(0);
  proxy = createProxy(`http://localhost:${origin.address().port}`).listen(0);
  base = `http://localhost:${proxy.address().port}`;
});

after(() => {
  proxy.close();
  origin.close();
});

const count = (line) => hits.filter((h) => h === line).length;

test('GET: MISS then HIT, origin hit once', async () => {
  const a = await fetch(`${base}/a?x=1`);
  assert.equal(a.headers.get('x-cache'), 'MISS');
  assert.equal(a.headers.get('x-origin'), 'yes');
  const bodyA = await a.text();
  const b = await fetch(`${base}/a?x=1`);
  assert.equal(b.headers.get('x-cache'), 'HIT');
  assert.equal(b.status, 200);
  assert.equal(await b.text(), bodyA);
  assert.equal(count('GET /a?x=1 '), 1);
});

test('different query is a MISS', async () => {
  const r = await fetch(`${base}/a?x=2`);
  assert.equal(r.headers.get('x-cache'), 'MISS');
});

test('status is cached too', async () => {
  const a = await fetch(`${base}/missing`);
  assert.equal(a.status, 404);
  assert.equal(a.headers.get('x-cache'), 'MISS');
  const b = await fetch(`${base}/missing`);
  assert.equal(b.status, 404);
  assert.equal(b.headers.get('x-cache'), 'HIT');
  assert.equal(count('GET /missing '), 1);
});

test('POST and DELETE are forwarded every time, never cached', async () => {
  for (let i = 0; i < 2; i++) {
    const r = await fetch(`${base}/p`, { method: 'POST', body: 'hi' });
    assert.equal(r.headers.get('x-cache'), null);
    assert.match(await r.text(), /^POST \/p hi/);
  }
  assert.equal(count('POST /p hi'), 2);
  await fetch(`${base}/p`, { method: 'DELETE' });
  await fetch(`${base}/p`, { method: 'DELETE' });
  assert.equal(count('DELETE /p '), 2);
  assert.equal((await fetch(`${base}/p`)).headers.get('x-cache'), 'MISS');
});

test('POST /__cache/clear empties cache', async () => {
  await fetch(`${base}/c`);
  const r = await fetch(`${base}/__cache/clear`, { method: 'POST' });
  assert.equal(r.status, 200);
  assert.ok((await r.json()).cleared > 0);
  assert.equal((await fetch(`${base}/c`)).headers.get('x-cache'), 'MISS');
});

test('origin unreachable -> 502', async () => {
  const dead = createProxy('http://localhost:1').listen(0);
  const r = await fetch(`http://localhost:${dead.address().port}/`);
  assert.equal(r.status, 502);
  assert.equal(await r.text(), 'Bad Gateway');
  dead.close();
});

test('origin reset mid-body -> 502, proxy stays up', async () => {
  const r = await fetch(`${base}/partial`);
  assert.equal(r.status, 502);
  assert.equal(await r.text(), 'Bad Gateway');
  assert.equal((await fetch(`${base}/after-partial`)).status, 200);
});

test('client conditional headers are not forwarded, so 304 is never cached', async () => {
  const a = await fetch(`${base}/etag`, { headers: { 'if-none-match': '"x"' } });
  assert.equal(a.status, 200);
  const b = await fetch(`${base}/etag`);
  assert.equal(b.status, 200);
  assert.match(await b.text(), /^GET \/etag/);
});

test('POST with expect: 100-continue is forwarded', async () => {
  const req = http.request(`${base}/expect`, { method: 'POST', headers: { expect: '100-continue' } }).end('hi');
  const [res] = await once(req, 'response');
  assert.equal(res.statusCode, 200);
  assert.match(Buffer.concat(await res.toArray()).toString(), /^POST \/expect hi/);
});

test('client range header is not forwarded, so 206 is never cached', async () => {
  await fetch(`${base}/range`, { headers: { range: 'bytes=0-3' } });
  const r = await fetch(`${base}/range`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /^GET \/range/);
});

test('client if-match header is not forwarded, so 412 is never cached', async () => {
  await fetch(`${base}/if-match`, { headers: { 'if-match': '"stale"' } });
  const r = await fetch(`${base}/if-match`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /^GET \/if-match/);
});

test('client if-unmodified-since header is not forwarded, so 412 is never cached', async () => {
  await fetch(`${base}/if-unmodified-since`, { headers: { 'if-unmodified-since': 'Thu, 01 Jan 1970 00:00:00 GMT' } });
  const r = await fetch(`${base}/if-unmodified-since`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /^GET \/if-unmodified-since/);
});

test('gzip origin body is decoded and content-encoding dropped', async () => {
  const r = await fetch(`${base}/gzip`);
  assert.equal(r.headers.get('content-encoding'), null);
  assert.equal(await r.text(), 'plain text');
});

test('CLI --clear-cache clears running proxy', async () => {
  await fetch(`${base}/__cache/clear`, { method: 'POST' });
  await fetch(`${base}/d`);
  const { stdout } = await run('node', [bin, '--clear-cache', '--port', String(proxy.address().port)]);
  assert.equal(stdout, 'Cache cleared (1 entries)\n');
  assert.equal((await fetch(`${base}/d`)).headers.get('x-cache'), 'MISS');
});

test('CLI --clear-cache exits 1 when proxy unreachable', async () => {
  await assert.rejects(run('node', [bin, '--clear-cache', '--port', '1']), { code: 1 });
});

test('CLI without --origin or --clear-cache prints usage, exits 1', async () => {
  await assert.rejects(run('node', [bin]), { code: 1, stderr: /Usage/ });
});

test('CLI start prints ready line', async () => {
  const probe = http.createServer().listen(0);
  const { port } = probe.address();
  probe.close();
  const child = spawn('node', [bin, '--port', String(port), '--origin', 'http://localhost:4000']);
  const [line] = await once(child.stdout, 'data');
  child.kill();
  assert.equal(line.toString(), `Caching proxy listening on http://localhost:${port} -> http://localhost:4000\n`);
});
