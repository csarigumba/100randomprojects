import { createServer } from 'node:http';
import { createLimiter } from './limiter.js';

const quote = { text: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' };

export function createApp({ limit, windowMs, now }) {
  const take = createLimiter({ limit, windowMs, now });
  return createServer((req, res) => {
    const r = take(req.socket.remoteAddress);
    const headers = { 'content-type': 'application/json', 'x-ratelimit-limit': r.limit, 'x-ratelimit-remaining': r.remaining };
    if (!r.allowed) {
      res.writeHead(429, { ...headers, 'retry-after': Math.max(1, Math.ceil(r.retryAfterMs / 1000)) });
      return res.end(JSON.stringify({ error: 'rate limit exceeded' }));
    }
    if (req.method === 'GET' && req.url === '/api/quote') {
      res.writeHead(200, headers);
      return res.end(JSON.stringify(quote));
    }
    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: 'not found' }));
  });
}

if (import.meta.main) {
  createApp({ limit: Number(process.env.RATE_LIMIT ?? 5), windowMs: Number(process.env.RATE_WINDOW_MS ?? 10000) })
    .listen(process.env.PORT ?? 3000);
}
