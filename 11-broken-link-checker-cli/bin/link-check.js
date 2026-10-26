#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { checkSite } from '../src/check.js';

function usage() {
  console.error('usage: link-check <start-url> [--max-pages N]');
  process.exit(2);
}

let args;
try {
  args = parseArgs({ allowPositionals: true, options: { 'max-pages': { type: 'string', default: '100' } } });
} catch {
  usage();
}
const [startUrl, ...extra] = args.positionals;
const maxPages = Number(args.values['max-pages']);
if (extra.length || !/^https?:$/.test(URL.parse(startUrl)?.protocol) || !Number.isInteger(maxPages) || maxPages < 1) usage();

const { broken, pages, checked } = await checkSite(startUrl, { maxPages });
for (const b of broken) console.log(`${b.status ?? b.error}  ${b.url}  on ${b.page}`);
console.log(`${broken.length} broken link(s) — ${pages.length} page(s) crawled, ${checked} link(s) checked`);
process.exitCode = broken.length ? 1 : 0;
