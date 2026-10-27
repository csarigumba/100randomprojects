#!/usr/bin/env node
import { open } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import { summarize, toTime } from '../src/stats.js';

async function run() {
  let args;
  try {
    args = parseArgs({ allowPositionals: true, options: { top: { type: 'string' }, since: { type: 'string' } } });
  } catch {}
  if (args?.positionals.length !== 1) {
    console.error('usage: log-stats <file> [--top N] [--since <ISO date>]');
    return 1;
  }
  const { top = '5', since } = args.values;
  if (!/^[1-9]\d*$/.test(top)) {
    console.error(`log-stats: --top must be a positive integer, got ${top}`);
    return 1;
  }
  const sinceTime = since === undefined ? -Infinity : toTime(since);
  if (Number.isNaN(sinceTime)) {
    console.error(`log-stats: --since must be an ISO date, got ${since}`);
    return 1;
  }
  const [file] = args.positionals;
  try {
    const fh = await open(file);
    const lines = createInterface({ input: fh.createReadStream(), crlfDelay: Infinity });
    console.log((await summarize(lines, { top: Number(top), since: sinceTime })).join('\n'));
    return 0;
  } catch (err) {
    console.error(`log-stats: cannot read ${file}: ${err.code ?? err.message}`);
    return 1;
  }
}

process.exitCode = await run();
