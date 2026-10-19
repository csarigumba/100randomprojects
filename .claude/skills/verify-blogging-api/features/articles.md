# Articles API

## Sub-features
List with `?tag=`, `?publishedAfter=`, `?publishedBefore=`; get by id; create; full update; delete.

## How to get to it (user POV)
HTTP on `localhost:3199` (verify port). Article JSON: `id,title,content,tags[],publishedAt,createdAt,updatedAt`.

## Driving it with curl
- Create: `curl -si -X POST localhost:3199/articles -H 'content-type: application/json' -d '{"title":"t","content":"c","tags":["a"]}'` → 201 + article.
- Get/List: `curl -si localhost:3199/articles/1`, `curl -si 'localhost:3199/articles?tag=a'`.
- Update: `curl -si -X PUT localhost:3199/articles/1 -H 'content-type: application/json' -d '{...}'`.
- Delete: `curl -si -X DELETE localhost:3199/articles/1` → 204, then GET → 404.
- Missing id on GET/PUT/DELETE → 404; missing title/content on POST → 400.

## Gotchas
Fresh temp DB per launch; ids restart at 1. Use `-i` to capture status codes.
