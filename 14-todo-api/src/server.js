import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const cols = 'id, title, done, createdAt';
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTitle = (v) => typeof v === 'string' && v.trim() !== '';
const toTodo = (row) => row && { ...row, done: row.done === 1 };

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

// Returns the integer in a query param, its default if absent, or NaN if not a positive integer.
const intParam = (v, def) => (v === null ? def : /^\d{1,15}$/.test(v) ? Number(v) : NaN);

export function build({ dbPath = process.env.DB_PATH || 'todos.db' } = {}) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`);
  const insert = db.prepare(`INSERT INTO todos (title, createdAt) VALUES (?, ?) RETURNING ${cols}`);
  const update = db.prepare(`UPDATE todos SET title = COALESCE(?, title), done = COALESCE(?, done) WHERE id = ? RETURNING ${cols}`);
  const remove = db.prepare('DELETE FROM todos WHERE id = ?');
  const where = 'WHERE :done IS NULL OR done = :done';
  const list = db.prepare(`SELECT ${cols} FROM todos ${where} ORDER BY id LIMIT :limit OFFSET (:page - 1) * :limit`);
  const count = db.prepare(`SELECT count(*) AS n FROM todos ${where}`);

  const server = createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const notFound = () => send(404, { error: 'Not found' });
    try {
      const url = new URL(req.url, 'http://x');
      const [, id] = url.pathname.match(/^\/todos\/(\d+)$/) ?? [];
      const m = req.method;

      if (m === 'POST' && url.pathname === '/todos') {
        const body = await readJson(req);
        if (!isObject(body) || !isTitle(body.title)) return send(400, { error: 'title must be a non-empty string' });
        return send(201, toTodo(insert.get(body.title, new Date().toISOString())));
      }
      if (m === 'GET' && url.pathname === '/todos') {
        const q = url.searchParams;
        const d = q.get('done');
        const done = d === null ? null : d === 'true' ? 1 : d === 'false' ? 0 : undefined;
        const page = intParam(q.get('page'), 1);
        const limit = intParam(q.get('limit'), 10);
        if (done === undefined) return send(400, { error: 'done must be true or false' });
        if (!(page >= 1)) return send(400, { error: 'page must be an integer >= 1' });
        if (!(limit >= 1 && limit <= 100)) return send(400, { error: 'limit must be an integer 1-100' });
        const data = list.all({ done, page, limit }).map(toTodo);
        return send(200, { data, page, limit, total: count.get({ done }).n });
      }
      if (m === 'PATCH' && id) {
        const body = await readJson(req);
        const { title, done } = isObject(body) ? body : {};
        if ((title === undefined && done === undefined) || (title !== undefined && !isTitle(title)) || (done !== undefined && typeof done !== 'boolean')) {
          return send(400, { error: 'body needs title (non-empty string) and/or done (boolean)' });
        }
        const row = update.get(title ?? null, done === undefined ? null : Number(done), id);
        return row ? send(200, toTodo(row)) : notFound();
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
