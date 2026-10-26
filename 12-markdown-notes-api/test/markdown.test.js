import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/markdown.js';

test('contract example', () => {
  assert.equal(
    render('# Hi\n\nA **b** *i* `c` [l](https://x.y)\n\n- one\n- two'),
    '<h1>Hi</h1>\n<p>A <strong>b</strong> <em>i</em> <code>c</code> <a href="https://x.y">l</a></p>\n<ul><li>one</li><li>two</li></ul>',
  );
});

test('headings h1-h6, not without space or past 6', () => {
  for (let n = 1; n <= 6; n++) assert.equal(render(`${'#'.repeat(n)} T **b**`), `<h${n}>T <strong>b</strong></h${n}>`);
  assert.equal(render('#nospace'), '<p>#nospace</p>');
  assert.equal(render('####### seven'), '<p>####### seven</p>');
});

test('paragraphs join lines, blank lines split blocks', () => {
  assert.equal(render('a\nb\n\n\nc'), '<p>a\nb</p>\n<p>c</p>');
  assert.equal(render('a\n- x\n* y\nb'), '<p>a</p>\n<ul><li>x</li><li>y</li></ul>\n<p>b</p>');
  assert.equal(render('# h\npara'), '<h1>h</h1>\n<p>para</p>');
});

test('emphasis', () => {
  assert.equal(render('**s** *e* _u_'), '<p><strong>s</strong> <em>e</em> <em>u</em></p>');
});

test('links: safe schemes get href, others are text', () => {
  assert.equal(render('[a](http://x) [b](mailto:m@x) [c](/p) [d](#h)'),
    '<p><a href="http://x">a</a> <a href="mailto:m@x">b</a> <a href="/p">c</a> <a href="#h">d</a></p>');
  assert.equal(render('[x](javascript:alert(1))'), '<p>x)</p>');
  assert.equal(render('[x](javascript:void)'), '<p>x</p>');
  assert.equal(render('[x](https://a.b/c_d_e)'), '<p><a href="https://a.b/c_d_e">x</a></p>');
});

test('inline code is literal', () => {
  assert.equal(render('`*a* _b_ **c** [l](https://x)`'), '<p><code>*a* _b_ **c** [l](https://x)</code></p>');
});

test('raw HTML and quotes are escaped', () => {
  assert.equal(render('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.equal(render('<img src=x onerror="alert(1)">'), '<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>');
  assert.equal(render(`a & "b" 'c'`), '<p>a &amp; &quot;b&quot; &#39;c&#39;</p>');
  assert.equal(render('[x](https://a"onmouseover="alert(1))'), '<p><a href="https://a&quot;onmouseover=&quot;alert(1">x</a>)</p>');
});

test('CRLF input and empty string', () => {
  assert.equal(render('# Hi\r\n\r\n- a\r\n- b\r\n'), '<h1>Hi</h1>\n<ul><li>a</li><li>b</li></ul>');
  assert.equal(render(''), '');
});
