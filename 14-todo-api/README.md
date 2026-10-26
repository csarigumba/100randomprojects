# todo-api

REST API (Node 24.2+, `node:http` + `node:sqlite`, zero deps) for a todo list with filtering and pagination.

## Run

```
npm start      # listens on PORT (default 3000), stores data in DB_PATH (default todos.db)
npm test       # node --test
```

## Endpoints

Create → 201 `{id, title, done, createdAt}` (400 if `title` is missing or blank)

```
curl -i -X POST localhost:3000/todos -H 'content-type: application/json' -d '{"title":"buy milk"}'
```

Update → 200, changes only the fields sent (400 on wrong types, 404 if unknown)

```
curl -i -X PATCH localhost:3000/todos/1 -H 'content-type: application/json' -d '{"done":true}'
```

List → 200 `{data, page, limit, total}`, optional `done=true|false`, `page` (default 1), `limit` (default 10, max 100)

```
curl -i 'localhost:3000/todos?done=false&page=1&limit=10'
```

Delete → 204 (404 if unknown)

```
curl -i -X DELETE localhost:3000/todos/1
```
