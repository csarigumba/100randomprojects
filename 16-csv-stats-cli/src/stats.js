export function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\n$/, '');
  const records = [];
  let fields = [], field = '', quoted = false, line = 1, start = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else { field += c; if (c === '\n') line++; }
    } else if (c === '"' && field === '') quoted = true;
    else if (c === ',') { fields.push(field); field = ''; }
    else if (c === '\n') { fields.push(field); records.push({ line: start, fields }); fields = []; field = ''; start = ++line; }
    else field += c;
  }
  if (quoted) throw new Error(`line ${start}: unterminated quote`);
  fields.push(field);
  records.push({ line: start, fields });
  return records.filter((r) => r.fields.length > 1 || r.fields[0] !== '');
}

function describe(name, cells) {
  const nums = cells.map(Number);
  if (!cells.length || !nums.every(Number.isFinite)) return [name, 'text', `count=${cells.length}`, `distinct=${new Set(cells).size}`];
  const min = nums.reduce((a, b) => Math.min(a, b));
  const max = nums.reduce((a, b) => Math.max(a, b));
  const mean = Math.round((nums.reduce((a, b) => a + b) / nums.length) * 100) / 100;
  return [name, 'numeric', `count=${nums.length}`, `min=${min}`, `max=${max}`, `mean=${mean}`];
}

export function stats(text, column) {
  const records = parseCsv(text);
  if (!records.length) throw new Error('empty file');
  const [{ fields: header }, ...rows] = records;
  for (const { line, fields } of rows) {
    if (fields.length !== header.length) throw new Error(`line ${line}: expected ${header.length} fields, got ${fields.length}`);
  }
  if (column !== undefined && !header.includes(column)) throw new Error(`unknown column: ${column}`);
  return header.flatMap((name, i) => column !== undefined && name !== column ? []
    : [describe(name, rows.map((r) => r.fields[i].trim()).filter(Boolean)).join('\t')]);
}
