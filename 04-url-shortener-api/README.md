# url-shortener-api

REST API (Node 24.2+, `node:http` + `node:sqlite`, zero deps) that shortens long URLs, redirects short codes, and counts visits.

## Run

```
npm start      # listens on PORT (default 3000), stores data in DB_PATH (default urls.db)
npm test       # node --test
```

## Endpoints

Create → 201 (400 if `url` is not a valid http(s) URL)

```
curl -i -X POST localhost:3000/shorten -H 'content-type: application/json' -d '{"url":"https://example.com/a"}'
```

Read → 200 (404 if unknown)

```
curl -i localhost:3000/shorten/abc123
```

Update → 200

```
curl -i -X PUT localhost:3000/shorten/abc123 -H 'content-type: application/json' -d '{"url":"https://example.com/b"}'
```

Delete → 204

```
curl -i -X DELETE localhost:3000/shorten/abc123
```

Stats → 200 with `accessCount`

```
curl -i localhost:3000/shorten/abc123/stats
```

Redirect → 302 with `Location`, increments `accessCount`

```
curl -i localhost:3000/abc123
```
