import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const files = { '/': 'index.html', '/index.html': 'index.html', '/app.js': 'app.js', '/game.js': 'game.js' };

export const server = createServer(async (req, res) => {
  const name = files[new URL(req.url, 'http://x').pathname];
  if (!name) return res.writeHead(404).end('Not found');
  try {
    const body = await readFile(new URL(`../public/${name}`, import.meta.url));
    res.writeHead(200, { 'content-type': types[extname(name)] }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

if (import.meta.main) {
  const port = process.env.PORT ?? 3000;
  server.listen(port, () => console.log(`http://localhost:${port}`));
}
