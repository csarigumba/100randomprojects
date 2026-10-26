import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { render } from './markdown.js';

const ok = (s) => typeof s === 'string' && s.trim() !== '';

// Returns {title, markdown} from a JSON body, or null if invalid or over 1 MB.
async function readNote(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 1024 * 1024) return null;
    chunks.push(chunk);
  }
  try {
    const { title, markdown } = JSON.parse(Buffer.concat(chunks));
    return ok(title) && ok(markdown) ? { title, markdown } : null;
  } catch {
    return null;
  }
}

export function build({ dbPath = process.env.DB_PATH || 'notes.db' } = {}) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    markdown TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`);
  const insert = db.prepare('INSERT INTO notes (title, markdown, createdAt) VALUES (?, ?, ?) RETURNING id, title, createdAt');
  const list = db.prepare('SELECT id, title, createdAt FROM notes ORDER BY createdAt DESC, id DESC');
  const select = db.prepare('SELECT id, title, markdown, createdAt FROM notes WHERE id = ?');
  const remove = db.prepare('DELETE FROM notes WHERE id = ?');

  const server = createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const notFound = () => send(404, { error: 'Not found' });
    try {
      const path = req.url.split('?')[0];
      const [, id, isHtml] = path.match(/^\/notes\/(\d+)(\/html)?$/) ?? [];
      const m = req.method;

      if (m === 'POST' && path === '/notes') {
        const note = await readNote(req);
        if (!note) return send(400, { error: 'title and markdown must be non-empty strings in a JSON body under 1 MB' });
        return send(201, insert.get(note.title, note.markdown, new Date().toISOString()));
      }
      if (m === 'GET' && path === '/notes') return send(200, list.all());
      if (m === 'GET' && id) {
        const row = select.get(id);
        if (!row) return notFound();
        if (!isHtml) return send(200, row);
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        return res.end(render(row.markdown));
      }
      if (m === 'DELETE' && id && !isHtml) {
        if (!remove.run(id).changes) return notFound();
        return res.writeHead(204).end();
      }
      notFound();
    } catch {
      if (!res.headersSent) send(500, { error: 'Internal server error' });
      else res.destroy();
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (import.meta.main) {
  const raw = process.env.PORT ?? '3000';
  if (!/^\d{1,5}$/.test(raw) || +raw > 65535) {
    console.error(`Invalid PORT: ${raw}`);
    process.exit(1);
  }
  build().listen(+raw);
}
