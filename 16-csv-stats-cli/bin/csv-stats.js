#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { stats } from '../src/stats.js';

function run() {
  let args;
  try {
    args = parseArgs({ allowPositionals: true, options: { column: { type: 'string' } } });
  } catch {}
  if (args?.positionals.length !== 1) {
    console.error('usage: csv-stats <file.csv> [--column <name>]');
    return 2;
  }
  const [file] = args.positionals;
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`csv-stats: cannot read ${file}: ${err.code ?? err.message}`);
    return 1;
  }
  try {
    console.log(stats(text, args.values.column).join('\n'));
    return 0;
  } catch (err) {
    console.error(`csv-stats: ${err.message}`);
    return 1;
  }
}

process.exitCode = run();
