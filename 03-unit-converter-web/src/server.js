import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

// ponytail: fixed route map, no directory walking, so no path traversal
const routes = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/convert.js': ['convert.js', 'text/javascript; charset=utf-8'],
};

export const server = createServer(async (req, res) => {
  const route = routes[new URL(req.url, 'http://x').pathname];
  if (!route) return res.writeHead(404).end('Not found');
  const body = await readFile(new URL(`../public/${route[0]}`, import.meta.url));
  res.writeHead(200, { 'content-type': route[1] }).end(body);
});

if (import.meta.main) {
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () => console.log(`http://localhost:${port}`));
}
