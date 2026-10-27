import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const cols = 'id, url, title, tags, createdAt';
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTitle = (v) => typeof v === 'string' && v.trim() !== '';
// Returns tags trimmed and de-duplicated, or undefined if not an array of non-empty strings.
const toTags = (v) => (Array.isArray(v) && v.every(isTitle) ? [...new Set(v.map((t) => t.trim()))] : undefined);
// Returns the normalised http(s) URL, or undefined.
const toUrl = (v) => {
  const u = typeof v === 'string' ? URL.parse(v) : null;
  return u && (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : undefined;
};
const toBookmark = (row) => row && { ...row, tags: JSON.parse(row.tags) };

// Returns the parsed JSON body, or undefined if malformed or over 8KB.
async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 8192) return;
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks));
  } catch {}
}

export function build({ dbPath = process.env.DB_PATH || 'bookmarks.db' } = {}) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    tags TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`);
  const insert = db.prepare(`INSERT INTO bookmarks (url, title, tags, createdAt) VALUES (?, ?, ?, ?) ON CONFLICT(url) DO NOTHING RETURNING ${cols}`);
  const update = db.prepare(`UPDATE bookmarks SET title = COALESCE(?, title), tags = COALESCE(?, tags) WHERE id = ? RETURNING ${cols}`);
  const remove = db.prepare('DELETE FROM bookmarks WHERE id = ?');
  const list = db.prepare(`SELECT ${cols} FROM bookmarks
    WHERE (:tag IS NULL OR EXISTS (SELECT 1 FROM json_each(tags) WHERE value = :tag))
      AND (:q IS NULL OR instr(lower(title), lower(:q)) OR instr(lower(url), lower(:q)))
    ORDER BY id`);
  const tagCounts = db.prepare('SELECT value AS tag, count(*) AS count FROM bookmarks, json_each(bookmarks.tags) GROUP BY value ORDER BY count DESC, tag');

  const server = createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const notFound = () => send(404, { error: 'Not found' });
    try {
      const url = new URL(req.url, 'http://x');
      const [, id] = url.pathname.match(/^\/bookmarks\/(\d+)$/) ?? [];
      const m = req.method;

      if (m === 'POST' && url.pathname === '/bookmarks') {
        const body = await readJson(req);
        if (!isObject(body)) return send(400, { error: 'body must be a JSON object' });
        const link = toUrl(body.url);
        const tags = body.tags === undefined ? [] : toTags(body.tags);
        if (!link) return send(400, { error: 'url must be an http(s) URL' });
        if (!isTitle(body.title)) return send(400, { error: 'title must be a non-empty string' });
        if (!tags) return send(400, { error: 'tags must be an array of non-empty strings' });
        const row = insert.get(link, body.title, JSON.stringify(tags), new Date().toISOString());
        return row ? send(201, toBookmark(row)) : send(409, { error: 'url already saved' });
      }
      if (m === 'GET' && url.pathname === '/bookmarks') {
        const q = url.searchParams;
        return send(200, list.all({ tag: q.get('tag'), q: q.get('q') }).map(toBookmark));
      }
      if (m === 'GET' && url.pathname === '/tags') return send(200, tagCounts.all());
      if (m === 'PATCH' && id) {
        const body = await readJson(req);
        const { title, tags } = isObject(body) ? body : {};
        const newTags = tags === undefined ? undefined : toTags(tags);
        if ((title === undefined && tags === undefined) || (title !== undefined && !isTitle(title)) || (tags !== undefined && !newTags)) {
          return send(400, { error: 'body needs title (non-empty string) and/or tags (array of non-empty strings)' });
        }
        const row = update.get(title ?? null, newTags ? JSON.stringify(newTags) : null, id);
        return row ? send(200, toBookmark(row)) : notFound();
      }
      if (m === 'DELETE' && id) {
        if (!remove.run(id).changes) return notFound();
        return res.writeHead(204).end();
      }
      notFound();
    } catch {
      send(500, { error: 'Internal server error' });
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (import.meta.main) {
  const port = process.env.PORT ?? '3000';
  if (!/^\d{1,5}$/.test(port) || Number(port) > 65535) {
    console.error(`PORT must be an integer 0-65535, got "${port}"`);
    process.exit(1);
  }
  build().listen(Number(port));
}
