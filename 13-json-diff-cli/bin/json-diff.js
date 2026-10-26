#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { diff } from '../src/diff.js';

function usage() {
  console.error('usage: json-diff <a.json> <b.json> [--ignore <path>]...');
  process.exit(2);
}

function fail(message) {
  console.error(`json-diff: ${message}`);
  process.exit(2);
}

function load(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    fail(`cannot read ${file}: ${err.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    fail(`invalid JSON in ${file}: ${err.message}`);
  }
}

let args;
try {
  args = parseArgs({ allowPositionals: true, options: { ignore: { type: 'string', multiple: true, default: [] } } });
} catch {
  usage();
}
if (args.positionals.length !== 2) usage();

const [a, b] = args.positionals.map(load);
const lines = diff(a, b, { ignore: args.values.ignore });
for (const line of lines) console.log(line);
process.exitCode = lines.length ? 1 : 0;
