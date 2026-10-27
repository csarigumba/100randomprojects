# bookmark-manager-api

REST API (Node 24.2+, `node:http` + `node:sqlite`, zero deps) that saves bookmarks with tags and searches them.

## Run

```
npm start      # listens on PORT (default 3000), stores data in DB_PATH (default bookmarks.db)
npm test       # node --test
```

## Endpoints

Create → 201 `{id, url, title, tags, createdAt}` (400 if `url` is not http(s) or `title` is blank, 409 if the url is already saved)

```
curl -i -X POST localhost:3000/bookmarks -H 'content-type: application/json' -d '{"url":"https://nodejs.org","title":"Node.js","tags":["js","docs"]}'
```

List → 200 `[bookmark]`, optional `tag` (exact tag) and `q` (case-insensitive text in title or url)

```
curl -i 'localhost:3000/bookmarks?tag=js&q=node'
```

Update → 200, changes only `title` and/or `tags` (tags replace the whole set; 400 on wrong types, 404 if unknown)

```
curl -i -X PATCH localhost:3000/bookmarks/1 -H 'content-type: application/json' -d '{"tags":["runtime"]}'
```

Tags → 200 `[{tag, count}]`, most used first

```
curl -i localhost:3000/tags
```

Delete → 204 (404 if unknown)

```
curl -i -X DELETE localhost:3000/bookmarks/1
```
