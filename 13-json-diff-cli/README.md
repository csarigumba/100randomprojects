# JSON Diff CLI

Compares two JSON files and lists what changed by path, one line per difference: `+ path: value` added, `- path: value` removed, `~ path: old -> new` changed. Objects and arrays are compared deeply; arrays by index (no move detection). Paths use dot and bracket notation (`server.ports[1]`, `headers["content-type"]`); a root-level difference prints as `(root)`. Zero dependencies. Needs Node 24+.

## Run

```
npm install -g .   # then: json-diff <a.json> <b.json> [--ignore <path>]...
node bin/json-diff.js <a.json> <b.json> [--ignore <path>]...
npm test
```

Exit: `0` no differences, `1` differences found, `2` usage error, unreadable file, or invalid JSON.

## Examples

```
# plain diff
$ json-diff a.json b.json
~ debug: false -> true
~ server.ports[1]: 8081 -> 9090
+ server.ports[2]: 9091
~ server.tls: null -> {"cert":"c.pem"}
- features[1]: "logs"
~ meta.build: 41 -> 42
+ region: "eu-1"

# skip paths and everything under them (repeatable)
$ json-diff a.json b.json --ignore server --ignore meta.build
~ debug: false -> true
- features[1]: "logs"
+ region: "eu-1"
```
