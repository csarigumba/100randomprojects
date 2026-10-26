import { createServer } from 'node:http';

const quote = { text: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' };

createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/quote') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(quote));
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
}).listen(process.env.PORT ?? 3000);
