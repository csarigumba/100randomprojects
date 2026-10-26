const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const emphasis = (s) => s
  .replace(/\*\*(?!\s)(.+?)(?<!\s)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(?![\s*])(.+?)(?<![\s*])\*|(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)/g, (_, a, b) => `<em>${a ?? b}</em>`);

// Code spans and links are split out first so emphasis never touches code or URLs.
const inline = (s) => s.split(/(`[^`]+`|\[[^\]]+\]\([^)\s]+\))/).map((part, i) => {
  if (i % 2 === 0) return emphasis(part);
  if (part[0] === '`') return `<code>${part.slice(1, -1)}</code>`;
  const [, text, url] = part.match(/^\[(.+)\]\((.+)\)$/);
  return /^(https?:\/\/|mailto:|\/|#)/.test(url) ? `<a href="${url}">${emphasis(text)}</a>` : emphasis(text);
}).join('');

// Escapes the whole input first, so no input character ever becomes a raw tag.
export function render(markdown) {
  const out = [];
  let para = [], list = [];
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join('\n'))}</p>`);
    if (list.length) out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`);
    para = [];
    list = [];
  };
  for (const line of markdown.replace(/[&<>"']/g, (c) => entities[c]).split(/\r?\n/)) {
    const h = line.match(/^(#{1,6}) (.*)$/);
    const li = line.match(/^[-*] (.*)$/);
    if (h) {
      flush();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
    } else if (li) {
      if (para.length) flush();
      list.push(li[1]);
    } else if (!line.trim()) flush();
    else {
      if (list.length) flush();
      para.push(line);
    }
  }
  flush();
  return out.join('\n');
}
