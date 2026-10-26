import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateQuestions } from './public/quiz.js';

const file = join(import.meta.dirname, 'questions.json');
let questions;

// ponytail: fixed route map, no directory walking, so no path traversal
const routes = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/quiz.js': ['quiz.js', 'text/javascript; charset=utf-8'],
};

export function loadQuestions(path) {
  return validateQuestions(JSON.parse(readFileSync(path, 'utf8')));
}

export const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://x').pathname;
    if (path === '/questions.json') {
      questions ??= loadQuestions(file);
      return res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end(JSON.stringify(questions));
    }
    const route = routes[path];
    if (!route) return res.writeHead(404).end('Not found');
    const body = await readFile(join(import.meta.dirname, 'public', route[0]));
    res.writeHead(200, { 'content-type': route[1] }).end(body);
  } catch {
    res.writeHead(500).end('Server error');
  }
});

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT must be an integer from 1 to 65535');
    process.exit(1);
  }
  try {
    questions = loadQuestions(file);
  } catch (err) {
    console.error(`questions.json: ${err.message}`);
    process.exit(1);
  }
  server.listen(port, () => console.log(`http://localhost:${port}`));
}
