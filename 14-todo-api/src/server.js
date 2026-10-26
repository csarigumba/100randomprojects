import { createServer } from 'node:http';

export function build() {
  return createServer((req, res) => {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}

if (import.meta.main) build().listen(Number(process.env.PORT) || 3000);
