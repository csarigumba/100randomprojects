import Fastify from 'fastify'

export function build() {
  const app = Fastify()
  app.get('/health', async () => ({ ok: true }))
  return app
}

if (import.meta.main) {
  await build().listen({ port: Number(process.env.PORT) || 3000 })
}
