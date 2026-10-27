import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ponytail: fixed route map, no directory walking, so no path traversal
const routes = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/pomodoro.js': ['pomodoro.js', 'text/javascript; charset=utf-8'],
};

export const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET') return res.writeHead(404).end('Not found');
    const route = routes[new URL(req.url, 'http://x').pathname];
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
  server.listen(port, () => console.log(`http://localhost:${port}`));
}
