import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: string[] = []
    let size = 0
    req.on('data', (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
      size += text.length
      if (size > 1_000_000) {
        reject(new Error('payload'))
        req.destroy()
        return
      }
      chunks.push(text)
    })
    req.on('end', () => resolve(chunks.join('')))
    req.on('error', reject)
  })
}

// Même routeur que les fonctions /api en production, pour le serveur Vite.
function apiPlugin(): Plugin {
  return {
    name: 'afa-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        // Les fonctions FeexPay restent servies par Vercel (/api/feexpay/*).
        // En local, Vite ne les exécute pas : on ne les intercepte pas ici.
        if (!url.startsWith('/api/') || url.startsWith('/api/feexpay')) {
          next()
          return
        }
        try {
          const mod = (await server.ssrLoadModule('/api/_lib/dispatch.ts')) as {
            dispatch: (input: {
              method: string
              path: string
              query: URLSearchParams
              body: unknown
              cookie: string | undefined
              secure: boolean
            }) => Promise<{
              status: number
              headers?: Record<string, string | string[]>
              json?: unknown
              text?: string
              contentType?: string
            }>
          }
          const host = req.headers.host || 'localhost'
          const parsed = new URL(url, `http://${host}`)
          let body: unknown = undefined
          if (req.method && !['GET', 'HEAD'].includes(req.method)) {
            const raw = await readBody(req)
            if (raw) {
              try {
                body = JSON.parse(raw) as unknown
              } catch {
                body = {}
              }
            }
          }
          const result = await mod.dispatch({
            method: req.method || 'GET',
            path: parsed.pathname,
            query: parsed.searchParams,
            body,
            cookie: req.headers.cookie,
            secure: false,
          })
          const out = res as ServerResponse
          if (result.headers) {
            for (const [key, value] of Object.entries(result.headers)) out.setHeader(key, value)
          }
          out.statusCode = result.status
          if (result.text != null) {
            out.setHeader('Content-Type', result.contentType || 'text/plain; charset=utf-8')
            out.end(result.text)
            return
          }
          out.setHeader('Content-Type', 'application/json; charset=utf-8')
          out.end(JSON.stringify(result.json ?? {}))
        } catch (error) {
          console.error(error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Erreur interne du serveur.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
  },
})
