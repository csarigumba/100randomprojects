# markdown-notes-api

REST API (Node 24.2+, `node:http` + `node:sqlite`, zero deps) that stores markdown notes and renders them to HTML.

## Run

Needs Node 24.2 or later (`import.meta.main`).

```
npm start      # listens on PORT (default 3000), stores data in DB_PATH (default notes.db)
npm test       # node --test
```

## Endpoints

Create → 201 `{id, title, createdAt}` (400 if `title` or `markdown` is missing, empty, or not a string, or the body is not JSON)

```
curl -i -X POST localhost:3000/notes -H 'content-type: application/json' -d '{"title":"Hi","markdown":"# Hello\n\n**bold**"}'
```

List → 200 `[{id, title, createdAt}]`, newest first

```
curl -i localhost:3000/notes
```

Read → 200 `{id, title, markdown, createdAt}` (404 if unknown)

```
curl -i localhost:3000/notes/1
```

Render → 200 `text/html` (404 if unknown)

```
curl -i localhost:3000/notes/1/html
```

Delete → 204 (404 if unknown)

```
curl -i -X DELETE localhost:3000/notes/1
```
