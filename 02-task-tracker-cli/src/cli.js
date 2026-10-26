#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const FILE = 'tasks.json';
const STATUSES = ['todo', 'in-progress', 'done'];
const USAGE = `Usage: task-cli <command>

Commands:
  add <description>
  update <id> <description>
  delete <id>
  mark-in-progress <id>
  mark-done <id>
  list [todo|in-progress|done]`;

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const [cmd, arg, text] = process.argv.slice(2);
const tasks = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : [];
const save = () => writeFileSync(FILE, JSON.stringify(tasks, null, 2) + '\n');
const now = new Date().toISOString();

const find = () => {
  const task = tasks.find((t) => t.id === Number(arg));
  if (!task) fail(`Task not found (ID: ${arg})`);
  task.updatedAt = now;
  return task;
};

if (cmd === 'add' && arg) {
  const id = Math.max(0, ...tasks.map((t) => t.id)) + 1;
  tasks.push({ id, description: arg, status: 'todo', createdAt: now, updatedAt: now });
  save();
  console.log(`Task added (ID: ${id})`);
} else if (cmd === 'update' && arg && text) {
  find().description = text;
  save();
  console.log(`Task updated (ID: ${arg})`);
} else if (cmd === 'delete' && arg) {
  tasks.splice(tasks.indexOf(find()), 1);
  save();
  console.log(`Task deleted (ID: ${arg})`);
} else if ((cmd === 'mark-in-progress' || cmd === 'mark-done') && arg) {
  const status = cmd.slice(5);
  find().status = status;
  save();
  console.log(`Task marked ${status} (ID: ${arg})`);
} else if (cmd === 'list' && (!arg || STATUSES.includes(arg))) {
  const shown = tasks.filter((t) => !arg || t.status === arg).sort((a, b) => a.id - b.id);
  console.log(shown.map((t) => `${t.id} [${t.status}] ${t.description}`).join('\n') || 'No tasks');
} else {
  fail(USAGE);
}
