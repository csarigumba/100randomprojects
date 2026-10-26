#!/usr/bin/env node
// Verification scaffolding: a known site on :4000 and an "external" origin on :4001.
// :4002 is deliberately unused (connection refused). Every request is logged as "<port> <METHOD> <path>".
import http from 'node:http';

const html = (body) => ['text/html', `<!doctype html><title>t</title>${body}`];
const site = {
  '/': html('<a href="/about">About</a> <a href="/missing">Missing</a> <a href="#top">top</a> <a href="mailto:a@b.c">mail</a>'
    + '<a href="http://localhost:4001/ok">ext ok</a> <a href="http://localhost:4001/gone">ext gone</a>'
    + '<img src="/logo.png"> <img src="/nope.png">'),
  '/about': html('<a href="/">Home</a> <a href="/deep#x">Deep</a> <a href="http://localhost:4002/">refused</a>'),
  '/deep': html('<a href="/about">About</a> <a href="/missing">Missing again</a>'),
  '/logo.png': ['image/png', 'png'],
  '/clean': html('<a href="/clean/a">A</a> <img src="/logo.png">'),
  '/clean/a': html('<a href="/clean">back</a>'),
  '/many': html(Array.from({ length: 20 }, (_, i) => `<a href="/many/${i + 1}">${i + 1}</a>`).join(' ')),
};
for (let i = 1; i <= 20; i++) site[`/many/${i}`] = html(`<a href="/many">up</a> <a href="/many/${i}/leaf">leaf</a>`);
for (let i = 1; i <= 20; i++) site[`/many/${i}/leaf`] = html('leaf');
const external = {
  '/ok': html('<a href="http://localhost:4001/secret">must never be crawled</a>'),
  '/secret': html('secret'),
};

const serve = (port, pages) => http.createServer((req, res) => {
  console.log(`${port} ${req.method} ${req.url}`);
  const page = pages[req.url];
  if (!page) return res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  res.writeHead(200, { 'content-type': page[0] }).end(page[1]);
}).listen(port);

serve(4000, site);
serve(4001, external);
console.log('fixture ready');
