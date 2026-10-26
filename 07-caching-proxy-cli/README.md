# Caching Proxy CLI

HTTP proxy in front of an origin server that caches GET responses in memory. Node 24+, no dependencies.

GET responses (any status) are cached by path + query and served with `X-Cache: MISS` the first time, `X-Cache: HIT` after. Other methods are always forwarded and never cached. Cache lives until the process exits or is cleared.

## Run

```
npm install -g .   # installs the caching-proxy command
npm test
```

## Commands

```
# start: listen on --port (default 3000), forward to --origin
caching-proxy --port 3000 --origin http://dummyjson.com
curl -i localhost:3000/products/1   # X-Cache: MISS
curl -i localhost:3000/products/1   # X-Cache: HIT

# clear the cache of the proxy running on --port (default 3000)
caching-proxy --clear-cache --port 3000
```

## Admin endpoint

```
# empty the cache; returns {"cleared": N}
curl -X POST localhost:3000/__cache/clear
```
