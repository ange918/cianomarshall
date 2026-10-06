import type { VercelRequest, VercelResponse } from '@vercel/node'
import { dispatch, type DispatchReq, type DispatchRes } from './dispatch.js'
import { PersistError } from './store.js'

function parseBody(body: unknown) {
  if (typeof body !== 'string') return body
  try {
    return JSON.parse(body) as unknown
  } catch {
    return {}
  }
}

function queryValue(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw == null) return ''
  const text = String(raw).split('?')[0]
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

/**
 * Sur Vercel, le segment dynamique de `/api/accreditations/[id]` est parfois
 * seulement dans `req.query.id` (pathname `/` ou `/api/accreditations`).
 * On le remet dans le chemin pour que le routeur retrouve la demande.
 */
export function resolveApiPath(url: string | undefined, query: Record<string, unknown> | undefined) {
  let parsed: URL
  try {
    parsed = new URL(url || '/', 'http://localhost')
  } catch {
    parsed = new URL('/', 'http://localhost')
  }
  const search = new URLSearchParams(parsed.searchParams)
  const source = query || {}
  for (const [key, value] of Object.entries(source)) {
    const text = queryValue(value)
    if (text && !search.has(key)) search.set(key, text)
  }
  let path = parsed.pathname
  const id = queryValue(source.id) || search.get('id') || ''
  if (id) {
    const encoded = encodeURIComponent(id)
    if (/\[id\]|%5Bid%5D/i.test(path)) path = path.replace(/\[id\]|%5Bid%5D/gi, encoded)
    else if (path === '/' || /^\/api\/accreditations\/?$/.test(path)) path = `/api/accreditations/${encoded}`
  }
  return { path, query: search }
}

export function fromVercel(req: VercelRequest): DispatchReq {
  const resolved = resolveApiPath(req.url, req.query as Record<string, unknown> | undefined)
  const proto = String(req.headers['x-forwarded-proto'] || '')
  return {
    method: req.method || 'GET',
    path: resolved.path,
    query: resolved.query,
    body: parseBody(req.body),
    cookie: req.headers.cookie,
    secure: proto === 'https',
  }
}

export function send(res: VercelResponse, result: DispatchRes) {
  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value)
  }
  res.status(result.status)
  if (result.text != null) {
    res.setHeader('Content-Type', result.contentType || 'text/plain; charset=utf-8')
    res.send(result.text)
    return
  }
  res.json(result.json ?? {})
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await dispatch(fromVercel(req))
    send(res, result)
  } catch (error) {
    console.error(error)
    if (error instanceof PersistError) {
      res.status(503).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Erreur interne du serveur.' })
  }
}
