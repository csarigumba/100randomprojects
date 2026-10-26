const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
const show = (v) => JSON.stringify(v);
const child = (path, k) =>
  typeof k === 'number' ? `${path}[${k}]`
  : /^[A-Za-z_$][\w$]*$/.test(k) ? (path ? `${path}.${k}` : k)
  : `${path}[${JSON.stringify(k)}]`;

export function diff(a, b, { ignore = [] } = {}) {
  const out = [];
  const walk = (x, y, path) => {
    if (ignore.some((p) => path === p || path.startsWith(`${p}.`) || path.startsWith(`${p}[`))) return;
    const name = path || '(root)';
    if (x === undefined) return out.push(`+ ${name}: ${show(y)}`);
    if (y === undefined) return out.push(`- ${name}: ${show(x)}`);
    const t = kind(x);
    if (t !== kind(y) || (t !== 'object' && t !== 'array')) {
      if (x !== y) out.push(`~ ${name}: ${show(x)} -> ${show(y)}`);
      return;
    }
    const keys = t === 'array'
      ? [...Array(Math.max(x.length, y.length)).keys()]
      : new Set([...Object.keys(x), ...Object.keys(y)]);
    for (const k of keys) walk(Object.hasOwn(x, k) ? x[k] : undefined, Object.hasOwn(y, k) ? y[k] : undefined, child(path, k));
  };
  walk(a, b, '');
  return out;
}
