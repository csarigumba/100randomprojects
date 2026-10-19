# Blogging Platform API

Fastify 5 + SQLite (`node:sqlite`). Needs a Node version with `node:sqlite`.

## Run

```
npm install
npm start          # listens on PORT (default 3000)
npm test
```

Env: `PORT` (default 3000), `DB_PATH` (default `blog.db`, `:memory:` works).

## Endpoints

Article: `{id, title, content, tags[], publishedAt, createdAt, updatedAt}`. Errors: `{"error": "..."}`.

```
# health
curl localhost:3000/health

# create (tags, publishedAt optional)
curl -X POST localhost:3000/articles -H 'content-type: application/json' \
  -d '{"title":"Hello","content":"World","tags":["intro"],"publishedAt":"2024-01-01"}'

# list (newest first); filters: tag (exact), publishedAfter, publishedBefore (ISO dates)
curl localhost:3000/articles
curl 'localhost:3000/articles?tag=intro&publishedAfter=2023-01-01&publishedBefore=2025-01-01'

# get one (404 if missing)
curl localhost:3000/articles/1

# full replace (404 if missing, 400 if invalid)
curl -X PUT localhost:3000/articles/1 -H 'content-type: application/json' \
  -d '{"title":"Hi","content":"Again","tags":["x"]}'

# delete (204, 404 if missing)
curl -X DELETE localhost:3000/articles/1
```
