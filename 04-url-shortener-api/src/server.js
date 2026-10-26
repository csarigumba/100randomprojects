import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';

const cols = 'id, url, shortCode, createdAt, updatedAt';

// Returns the normalized http(s) URL from a JSON body {"url"}, or null if invalid or over 8KB.
async function readUrl(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 8192) return null;
    chunks.push(chunk);
  }
  try {
    const { url } = JSON.parse(Buffer.concat(chunks));
    if (typeof url !== 'string') return null;
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

export function build({ dbPath = process.env.DB_PATH || 'urls.db' } = {}) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    shortCode TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    accessCount INTEGER NOT NULL DEFAULT 0
  )`);
  const insert = db.prepare(`INSERT INTO urls (url, shortCode, createdAt, updatedAt) VALUES (?, ?, ?, ?)
    ON CONFLICT(shortCode) DO NOTHING RETURNING ${cols}`);
  const select = db.prepare(`SELECT ${cols} FROM urls WHERE shortCode = ?`);
  const stats = db.prepare(`SELECT ${cols}, accessCount FROM urls WHERE shortCode = ?`);
  const update = db.prepare(`UPDATE urls SET url = ?, updatedAt = ? WHERE shortCode = ? RETURNING ${cols}`);
  const remove = db.prepare('DELETE FROM urls WHERE shortCode = ?');
  const hit = db.prepare('UPDATE urls SET accessCount = accessCount + 1 WHERE shortCode = ? RETURNING url');

  const server = createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const found = (row) => (row ? send(200, row) : send(404, { error: 'Not found' }));
    const invalid = () => send(400, { error: 'url must be a valid http(s) URL' });
    try {
      const path = req.url.split('?')[0];
      const [, code, isStats] = path.match(/^\/shorten\/([\w-]+)(\/stats)?$/) ?? [];
      const [, short] = path.match(/^\/([\w-]+)$/) ?? [];
      const m = req.method;

      if (m === 'POST' && path === '/shorten') {
        const url = await readUrl(req);
        if (!url) return invalid();
        const now = new Date().toISOString();
        // ponytail: 32-bit codes, no retry; 503 on collision. Widen randomBytes if the table grows large.
        const row = insert.get(url, randomBytes(4).toString('base64url'), now, now);
        return row ? send(201, row) : send(503, { error: 'Short code collision, try again' });
      }
      if (m === 'GET' && code) return found((isStats ? stats : select).get(code));
      if (m === 'PUT' && code && !isStats) {
        const url = await readUrl(req);
        if (!url) return invalid();
        return found(update.get(url, new Date().toISOString(), code));
      }
      if (m === 'DELETE' && code && !isStats) {
        if (!remove.run(code).changes) return send(404, { error: 'Not found' });
        return res.writeHead(204).end();
      }
      if (m === 'GET' && short) {
        const row = hit.get(short);
        if (row) return res.writeHead(302, { location: row.url }).end();
      }
      send(404, { error: 'Not found' });
    } catch {
      if (!res.headersSent) send(500, { error: 'Internal server error' });
      else res.destroy();
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (import.meta.main) build().listen(Number(process.env.PORT) || 3000);
