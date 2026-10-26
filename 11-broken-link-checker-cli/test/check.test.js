import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { checkSite } from '../src/check.js';

const bin = new URL('../bin/link-check.js', import.meta.url).pathname;
const requests = [];
const html = (body) => ['text/html; charset=utf-8', `<!doctype html>${body}`];
const site = {};
const ext = {};
const servers = [];
let base, extBase, refused;

const listen = (pages) => new Promise((resolve) => {
  const server = http.createServer((req, res) => {
    requests.push(`http://127.0.0.1:${server.address().port}${req.url}`);
    const page = pages[req.url];
    if (!page) return res.writeHead(404).end('not found');
    res.writeHead(200, { 'content-type': page[0] }).end(page[1]);
  }).listen(0, '127.0.0.1', () => resolve(server));
});
const urlOf = (server) => `http://127.0.0.1:${server.address().port}`;

before(async () => {
  servers.push(await listen(site), await listen(ext));
  [base, extBase] = servers.map(urlOf);
  const closed = await listen({});
  refused = `${urlOf(closed)}/`;
  closed.close();
  Object.assign(site, {
    '/': html(`<a href="/about">About</a> <a href="/missing">x</a> <a href="#top">top</a> <a href="mailto:a@b.c">m</a>
      <a href="tel:1">t</a> <a href='${extBase}/ok'>ok</a> <a href=${extBase}/gone>gone</a>
      <img src="/logo.png"> <img alt="x" src="/nope.png"> <a class="x" href="/about#again">About</a>`),
    '/about': html(`<a href="/">Home</a> <a href="deep#x">Deep</a> <a href="${refused}">refused</a>`),
    '/deep': html('<a href="/about">About</a> <a href="/missing">Missing again</a>'),
    '/logo.png': ['image/png', 'png'],
    '/clean': html('<a href="/clean/a">A</a> <img src="/logo.png">'),
    '/clean/a': html('<a href="/clean">back</a>'),
    '/many': html([1, 2, 3, 4, 5].map((i) => `<a href="/many/${i}">${i}</a>`).join(' ')),
  });
  for (let i = 1; i <= 5; i++) site[`/many/${i}`] = html('leaf');
  Object.assign(ext, { '/ok': html(`<a href="${extBase}/secret">secret</a>`), '/secret': html('secret') });
});
after(() => servers.forEach((s) => s.close()));

const run = (...args) => new Promise((resolve) =>
  execFile(process.execPath, [bin, ...args], (err, stdout, stderr) => resolve({ code: err?.code ?? 0, stdout, stderr })));

test('crawls same-origin pages once, checks external without crawling, lists broken per page', async () => {
  requests.length = 0;
  const result = await checkSite(`${base}/`);
  assert.deepEqual(result.pages, [`${base}/`, `${base}/about`, `${base}/deep`]);
  assert.equal(new Set(requests).size, requests.length);
  assert.ok(requests.includes(`${extBase}/ok`));
  assert.ok(!requests.includes(`${extBase}/secret`));
  assert.deepEqual(result.broken, [
    { url: `${base}/missing`, page: `${base}/`, status: 404 },
    { url: `${extBase}/gone`, page: `${base}/`, status: 404 },
    { url: `${base}/nope.png`, page: `${base}/`, status: 404 },
    { url: refused, page: `${base}/about`, error: 'ECONNREFUSED' },
    { url: `${base}/missing`, page: `${base}/deep`, status: 404 },
  ]);
  assert.equal(result.checked, 9);
});

test('maxPages caps crawled pages', async () => {
  const result = await checkSite(`${base}/many`, { maxPages: 3 });
  assert.deepEqual(result.pages, [`${base}/many`, `${base}/many/1`, `${base}/many/2`]);
  assert.equal(result.checked, 6);
});

test('cli prints broken links and total, exits 1', async () => {
  const { code, stdout } = await run(`${base}/`);
  assert.equal(code, 1);
  assert.equal(stdout, [
    `404  ${base}/missing  on ${base}/`,
    `404  ${extBase}/gone  on ${base}/`,
    `404  ${base}/nope.png  on ${base}/`,
    `ECONNREFUSED  ${refused}  on ${base}/about`,
    `404  ${base}/missing  on ${base}/deep`,
    '5 broken link(s) — 3 page(s) crawled, 9 link(s) checked',
    '',
  ].join('\n'));
});

test('cli exits 0 on a clean site', async () => {
  const { code, stdout } = await run(`${base}/clean`);
  assert.equal(code, 0);
  assert.equal(stdout, '0 broken link(s) — 2 page(s) crawled, 3 link(s) checked\n');
});

test('cli --max-pages caps the crawl', async () => {
  const { code, stdout } = await run(`${base}/many`, '--max-pages', '2');
  assert.equal(code, 0);
  assert.equal(stdout, '0 broken link(s) — 2 page(s) crawled, 6 link(s) checked\n');
});

test('cli exits 2 on usage errors', async () => {
  for (const args of [[], ['not a url'], ['ftp://x'], [`${base}/`, '--max-pages', '0'], [`${base}/`, '--max-pages', 'abc'], [`${base}/`, '--bogus']]) {
    const { code, stdout, stderr } = await run(...args);
    assert.equal(code, 2, args.join(' '));
    assert.equal(stdout, '');
    assert.match(stderr, /usage: link-check/);
  }
});
