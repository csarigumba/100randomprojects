#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const usage = 'Usage: expense-tracker <add|list|delete|summary|export> [flags]';
const file = process.env.EXPENSES_FILE || 'expenses.json';
const load = () => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []);
const save = (list) => writeFileSync(file, JSON.stringify(list, null, 2) + '\n');
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};
const money = (n) => `$${Math.round(n * 100) / 100}`;
const csv = (v) => (/[",\n\r]/.test(v) ? `"${String(v).replaceAll('"', '""')}"` : v);

// parseArgs refuses `--amount -5`; join a negative number onto its flag so it reads as the value.
const args = [];
for (const a of process.argv.slice(2)) {
  if (/^-[\d.]/.test(a) && /^--[^=]+$/.test(args.at(-1))) args.push(`${args.pop()}=${a}`);
  else args.push(a);
}

let values, command;
try {
  ({ values, positionals: [command] } = parseArgs({
    args,
    allowPositionals: true,
    options: { description: { type: 'string' }, amount: { type: 'string' }, id: { type: 'string' }, month: { type: 'string' }, file: { type: 'string' } },
  }));
} catch (e) {
  fail(`Error: ${e.message}`);
}

if (command === 'add') {
  const description = values.description?.trim();
  if (!description) fail('Error: --description is required');
  if (values.amount === undefined) fail('Error: --amount is required');
  const amount = Number(values.amount);
  if (!Number.isFinite(amount) || amount <= 0) fail('Error: Amount must be a positive number');
  const list = load();
  const id = Math.max(0, ...list.map((e) => e.id)) + 1;
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  save([...list, { id, date, description, amount }]);
  console.log(`Expense added successfully (ID: ${id})`);
} else if (command === 'list') {
  const rows = [['ID', 'Date', 'Description', 'Amount'], ...load().map((e) => [e.id, e.date, e.description, money(e.amount)])].map((r) => r.map(String));
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  for (const r of rows) console.log(r.map((c, i) => (i < 3 ? c.padEnd(widths[i]) : c)).join('  '));
} else if (command === 'delete') {
  if (values.id === undefined) fail('Error: --id is required');
  const list = load();
  const rest = list.filter((e) => e.id !== Number(values.id));
  if (rest.length === list.length) fail(`Error: Expense ${values.id} not found`);
  save(rest);
  console.log('Expense deleted successfully');
} else if (command === 'summary') {
  let list = load();
  let label = '';
  if (values.month !== undefined) {
    const m = Number(values.month);
    if (!Number.isInteger(m) || m < 1 || m > 12) fail('Error: --month must be an integer from 1 to 12');
    const prefix = `${new Date().getFullYear()}-${String(m).padStart(2, '0')}-`;
    list = list.filter((e) => e.date.startsWith(prefix));
    label = ` for ${new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'long' })}`;
  }
  console.log(`Total expenses${label}: ${money(list.reduce((s, e) => s + e.amount, 0))}`);
} else if (command === 'export') {
  if (!values.file) fail('Error: --file is required');
  const list = load();
  const lines = ['id,date,description,amount', ...list.map((e) => [e.id, e.date, e.description, e.amount].map(csv).join(','))];
  writeFileSync(values.file, lines.join('\n') + '\n');
  console.log(`Exported ${list.length} expenses to ${values.file}`);
} else {
  fail(usage);
}
