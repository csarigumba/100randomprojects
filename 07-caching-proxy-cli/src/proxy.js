import http from 'node:http';

const dropped = ['content-encoding', 'content-length', 'transfer-encoding', 'connection'];

export function createProxy(origin) {
  const cache = new Map();

  return http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/__cache/clear') {
      const cleared = cache.size;
      cache.clear();
      return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ cleared }));
    }

    const isGet = req.method === 'GET';
    const cached = isGet && cache.get(req.url);
    if (cached) return res.writeHead(cached.status, { ...cached.headers, 'x-cache': 'HIT' }).end(cached.body);

    // transfer-encoding is dropped too: fetch rejects it, and the body is buffered anyway
    const { host, 'transfer-encoding': _, ...headers } = req.headers;
    const body = Buffer.concat(await req.toArray());
    let upstream;
    try {
      upstream = await fetch(origin + req.url, {
        method: req.method,
        headers,
        body: body.length ? body : undefined,
        redirect: 'manual',
      });
    } catch {
      return res.writeHead(502).end('Bad Gateway');
    }

    const entry = {
      status: upstream.status,
      headers: Object.fromEntries([...upstream.headers].filter(([k]) => !dropped.includes(k))),
      body: Buffer.from(await upstream.arrayBuffer()),
    };
    if (!isGet) return res.writeHead(entry.status, entry.headers).end(entry.body);
    cache.set(req.url, entry);
    res.writeHead(entry.status, { ...entry.headers, 'x-cache': 'MISS' }).end(entry.body);
  });
}
