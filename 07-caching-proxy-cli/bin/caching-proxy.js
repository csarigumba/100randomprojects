#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createProxy } from '../src/proxy.js';

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '3000' },
    origin: { type: 'string' },
    'clear-cache': { type: 'boolean' },
  },
});
const { port, origin } = values;

if (values['clear-cache']) {
  try {
    const res = await fetch(`http://localhost:${port}/__cache/clear`, { method: 'POST' });
    if (!res.ok) throw new Error(`proxy responded ${res.status}`);
    console.log(`Cache cleared (${(await res.json()).cleared} entries)`);
  } catch (err) {
    console.error(`Could not clear cache on port ${port}: ${err.message}`);
    process.exit(1);
  }
} else if (origin) {
  createProxy(origin).listen(port, () => console.log(`Caching proxy listening on http://localhost:${port} -> ${origin}`));
} else {
  console.error('Usage: caching-proxy --port <n> --origin <url>\n       caching-proxy --clear-cache [--port <n>]');
  process.exit(1);
}
