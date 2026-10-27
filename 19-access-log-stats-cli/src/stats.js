const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/;
const CLF = /^\S+ \S+ \S+ \[(\d{2})\/(\w{3})\/(\d{4}):(\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})\] "\S+ (\S+)[^"]*" (\d{3}) (?:\d+|-)(?: .*)?$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toTime(iso) {
  const m = ISO.exec(iso);
  if (!m || new Date(Date.UTC(m[1], m[2] - 1, m[3])).getUTCDate() !== Number(m[3])) return NaN;
  return Date.parse(iso);
}

export function parseLine(line) {
  const m = CLF.exec(line);
  const month = MONTHS.indexOf(m?.[2]) + 1;
  if (!month) return null;
  const time = toTime(`${m[3]}-${String(month).padStart(2, '0')}-${m[1]}T${m[4]}${m[5]}:${m[6]}`);
  if (Number.isNaN(time)) return null;
  return { time, status: m[8], path: m[7].split('?')[0] };
}

export async function summarize(lines, { top = 5, since = -Infinity } = {}) {
  const classes = Array(10).fill(0);
  const paths = new Map();
  let total = 0, skipped = 0;
  for await (const line of lines) {
    const req = parseLine(line);
    if (!req) { skipped++; continue; }
    if (req.time < since) continue;
    total++;
    classes[req.status[0]]++;
    paths.set(req.path, (paths.get(req.path) ?? 0) + 1);
  }
  const ranked = [...paths].sort((a, b) => b[1] - a[1]).slice(0, top);
  return [
    `total\t${total}`,
    ...[2, 3, 4, 5].map((c) => `${c}xx\t${classes[c]}`),
    'top paths',
    ...ranked.map(([path, count]) => `${count}\t${path}`),
    `skipped\t${skipped}`,
  ];
}
