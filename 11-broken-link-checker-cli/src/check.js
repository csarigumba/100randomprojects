// ponytail: regex extraction, decodes only &amp;; swap for an HTML parser if other entities in hrefs bite.
const LINK = /<(?:a\s[^>]*?\bhref|img\s[^>]*?\bsrc)\s*=\s*["']?([^"'\s>]+)/gi;

function extractLinks(html, page) {
  const links = new Set();
  for (const [, href] of html.matchAll(LINK)) {
    const url = URL.parse(href.replaceAll('&amp;', '&'), page);
    if (!/^https?:$/.test(url?.protocol)) continue;
    url.hash = '';
    links.add(url.href);
  }
  return links;
}

export async function checkSite(startUrl, { maxPages = 100 } = {}) {
  let origin;
  const results = new Map();
  const queue = [];
  const broken = [];

  async function check(url, page) {
    if (!results.has(url)) {
      let result;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        result = { status: res.status };
        origin ??= new URL(res.url).origin;
        const crawl = res.status < 400 && new URL(res.url).origin === origin
          && res.headers.get('content-type')?.includes('text/html') && queue.length < maxPages
          && !queue.some(([page]) => page === res.url);
        if (crawl) queue.push([res.url, await res.text()]);
        else await res.body?.cancel();
      } catch (err) {
        result = { error: err.cause?.code ?? err.message };
      }
      results.set(url, result);
    }
    const result = results.get(url);
    if (result.error || result.status >= 400) broken.push({ url, page, ...result });
  }

  const start = new URL(startUrl);
  start.hash = '';
  await check(start.href, start.href);
  for (let i = 0; i < queue.length; i++) {
    const [page, html] = queue[i];
    for (const url of extractLinks(html, page)) await check(url, page);
  }
  return { broken, pages: queue.map(([url]) => url), checked: results.size };
}
