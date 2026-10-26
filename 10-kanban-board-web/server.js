import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

// ponytail: fixed file map instead of a static-dir walker; no path traversal possible.
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/board.js': ['board.js', 'text/javascript; charset=utf-8'],
};

export const server = createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://x').pathname];
  if (!file) return res.writeHead(404).end('Not found');
  res.writeHead(200, { 'content-type': file[1] });
  res.end(await readFile(new URL(`public/${file[0]}`, import.meta.url)));
});

if (import.meta.main) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`http://localhost:${port}`));
}
