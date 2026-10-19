import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from '../src/server.js'

const setup = async (t) => {
  const app = build({ dbPath: ':memory:' })
  t.after(() => app.close())
  await app.ready()
  const req = (method, url, payload) => app.inject({ method, url, payload })
  return req
}

test('create + get + list', async (t) => {
  const req = await setup(t)
  const r = await req('POST', '/articles', { title: 'a', content: 'b' })
  assert.equal(r.statusCode, 201)
  const a = r.json()
  assert.deepEqual(a.tags, [])
  for (const k of ['id', 'createdAt', 'updatedAt', 'publishedAt']) assert.ok(a[k])
  assert.deepEqual((await req('GET', `/articles/${a.id}`)).json(), a)
  assert.deepEqual((await req('GET', '/articles')).json(), [a])
})

test('404s', async (t) => {
  const req = await setup(t)
  const body = { title: 'a', content: 'b' }
  for (const [m, p] of [['GET'], ['PUT', body], ['DELETE']]) {
    const r = await req(m, '/articles/99', p)
    assert.equal(r.statusCode, 404)
    assert.deepEqual(r.json(), { error: 'Not found' })
  }
})

test('validation 400', async (t) => {
  const req = await setup(t)
  const bad = [
    {}, { title: 'a' }, { content: 'b' }, { title: '', content: 'b' }, { title: 'a', content: '' },
    { title: 1, content: 'b' }, { title: 'a', content: 2 },
    { title: 'a', content: 'b', tags: 'x' }, { title: 'a', content: 'b', tags: [1] },
    { title: 'a', content: 'b', publishedAt: 'nope' },
  ]
  const { id } = (await req('POST', '/articles', { title: 'a', content: 'b' })).json()
  for (const b of bad) {
    assert.equal((await req('POST', '/articles', b)).statusCode, 400, JSON.stringify(b))
    assert.equal((await req('PUT', `/articles/${id}`, b)).statusCode, 400, JSON.stringify(b))
  }
})

test('filters', async (t) => {
  const req = await setup(t)
  const mk = (title, tags, publishedAt) => req('POST', '/articles', { title, content: 'c', tags, publishedAt })
  await mk('old', ['x'], '2020-01-01')
  await mk('mid', ['x', 'y'], '2021-01-01')
  await mk('new', ['y'], '2022-01-01')
  const titles = async (q) => (await req('GET', '/articles' + q)).json().map((a) => a.title)
  assert.deepEqual(await titles(''), ['new', 'mid', 'old'])
  assert.deepEqual(await titles('?tag=x'), ['mid', 'old'])
  assert.deepEqual(await titles('?tag=nope'), [])
  assert.deepEqual(await titles('?publishedAfter=2020-06-01'), ['new', 'mid'])
  assert.deepEqual(await titles('?publishedBefore=2021-06-01'), ['mid', 'old'])
  assert.deepEqual(await titles('?tag=y&publishedAfter=2020-06-01&publishedBefore=2021-06-01'), ['mid'])
  assert.equal((await req('GET', '/articles?publishedAfter=garbage')).statusCode, 400)
  assert.equal((await req('GET', '/articles?publishedBefore=garbage')).statusCode, 400)
})

test('put replaces and bumps updatedAt; delete then 404', async (t) => {
  const req = await setup(t)
  const a = (await req('POST', '/articles', { title: 'a', content: 'b', tags: ['t'] })).json()
  await new Promise((r) => setTimeout(r, 5))
  const r = await req('PUT', `/articles/${a.id}`, { title: 'A', content: 'B', publishedAt: '2020-01-01' })
  assert.equal(r.statusCode, 200)
  const u = r.json()
  assert.deepEqual([u.title, u.content, u.tags, u.publishedAt], ['A', 'B', [], '2020-01-01T00:00:00.000Z'])
  assert.equal(u.createdAt, a.createdAt)
  assert.ok(u.updatedAt > a.updatedAt)
  const d = await req('DELETE', `/articles/${a.id}`)
  assert.equal(d.statusCode, 204)
  assert.equal(d.body, '')
  assert.equal((await req('GET', `/articles/${a.id}`)).statusCode, 404)
})

test('array query params -> 400', async (t) => {
  const req = await setup(t)
  for (const q of ['tag=a&tag=b', 'publishedAfter=2020-01-01&publishedAfter=2021-01-01', 'publishedBefore=2020-01-01&publishedBefore=2021-01-01']) {
    assert.equal((await req('GET', '/articles?' + q)).statusCode, 400, q)
  }
})

test('non-string publishedAt -> 400', async (t) => {
  const req = await setup(t)
  const { id } = (await req('POST', '/articles', { title: 'a', content: 'b' })).json()
  for (const publishedAt of [null, 0, true]) {
    const b = { title: 'a', content: 'b', publishedAt }
    assert.equal((await req('POST', '/articles', b)).statusCode, 400, String(publishedAt))
    assert.equal((await req('PUT', `/articles/${id}`, b)).statusCode, 400, String(publishedAt))
  }
})

test('PUT without publishedAt/tags resets them', async (t) => {
  const req = await setup(t)
  const a = (await req('POST', '/articles', { title: 'a', content: 'b', tags: ['t'], publishedAt: '2020-01-01' })).json()
  const u = (await req('PUT', `/articles/${a.id}`, { title: 'a', content: 'b' })).json()
  assert.deepEqual(u.tags, [])
  assert.ok(u.publishedAt > '2024-01-01')
})
