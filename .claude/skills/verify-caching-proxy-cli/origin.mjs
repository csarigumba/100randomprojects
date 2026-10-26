// Fake origin for verification: logs every request to stdout and echoes a hit counter.
import { createServer } from 'node:http';

let n = 0;
createServer((req, res) => {
  n++;
  console.log(`${req.method} ${req.url}`);
  const status = req.url.startsWith('/missing') ? 404 : 200;
  res.writeHead(status, { 'content-type': 'application/json', 'x-origin': 'yes' });
  res.end(JSON.stringify({ method: req.method, url: req.url, n }));
}).listen(Number(process.argv[2] ?? 4199), () => console.log('origin ready'));
