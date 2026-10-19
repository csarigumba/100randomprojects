import Fastify from 'fastify'
import { DatabaseSync } from 'node:sqlite'

const toArticle = (r) => ({ ...r, tags: JSON.parse(r.tags) })
const iso = (v) => {
  const d = new Date(v)
  return isNaN(d) ? null : d.toISOString()
}

// Returns { value } or { error }
function parseBody(body) {
  const { title, content, tags = [], publishedAt } = body ?? {}
  if (typeof title !== 'string' || !title.trim()) return { error: 'title must be a non-empty string' }
  if (typeof content !== 'string' || !content.trim()) return { error: 'content must be a non-empty string' }
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) return { error: 'tags must be an array of strings' }
  const pub = publishedAt === undefined ? new Date().toISOString() : iso(publishedAt)
  if (!pub) return { error: 'publishedAt must be a valid date' }
  return { value: { title, content, tags: JSON.stringify(tags), publishedAt: pub } }
}

export function build({ dbPath = process.env.DB_PATH || 'blog.db' } = {}) {
  const db = new DatabaseSync(dbPath)
  db.exec(`CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    publishedAt TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`)
  const get = (id) => db.prepare('SELECT * FROM articles WHERE id = ?').get(id)

  const app = Fastify()
  app.addHook('onClose', async () => db.close())
  app.get('/health', async () => ({ ok: true }))

  app.get('/articles', async (req, reply) => {
    const where = []
    const args = []
    const { tag, publishedAfter, publishedBefore } = req.query
    if (tag !== undefined) {
      where.push('EXISTS (SELECT 1 FROM json_each(articles.tags) WHERE value = ?)')
      args.push(tag)
    }
    for (const [name, op, val] of [['publishedAfter', '>', publishedAfter], ['publishedBefore', '<', publishedBefore]]) {
      if (val === undefined) continue
      const d = iso(val)
      if (!d) return reply.code(400).send({ error: `${name} must be a valid date` })
      where.push(`publishedAt ${op} ?`)
      args.push(d)
    }
    const sql = `SELECT * FROM articles${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY publishedAt DESC, id DESC`
    return db.prepare(sql).all(...args).map(toArticle)
  })

  app.get('/articles/:id', async (req, reply) => {
    const row = get(req.params.id)
    return row ? toArticle(row) : reply.code(404).send({ error: 'Not found' })
  })

  app.post('/articles', async (req, reply) => {
    const { value: v, error } = parseBody(req.body)
    if (error) return reply.code(400).send({ error })
    const now = new Date().toISOString()
    const { lastInsertRowid } = db
      .prepare('INSERT INTO articles (title, content, tags, publishedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(v.title, v.content, v.tags, v.publishedAt, now, now)
    return reply.code(201).send(toArticle(get(lastInsertRowid)))
  })

  app.put('/articles/:id', async (req, reply) => {
    if (!get(req.params.id)) return reply.code(404).send({ error: 'Not found' })
    const { value: v, error } = parseBody(req.body)
    if (error) return reply.code(400).send({ error })
    db.prepare('UPDATE articles SET title = ?, content = ?, tags = ?, publishedAt = ?, updatedAt = ? WHERE id = ?')
      .run(v.title, v.content, v.tags, v.publishedAt, new Date().toISOString(), req.params.id)
    return toArticle(get(req.params.id))
  })

  app.delete('/articles/:id', async (req, reply) => {
    const { changes } = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id)
    return changes ? reply.code(204).send() : reply.code(404).send({ error: 'Not found' })
  })

  return app
}

if (import.meta.main) {
  await build().listen({ port: Number(process.env.PORT) || 3000 })
}
