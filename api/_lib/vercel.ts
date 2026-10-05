import type { VercelRequest, VercelResponse } from '@vercel/node'
import { dispatch, type DispatchReq, type DispatchRes } from './dispatch.js'

function parseBody(body: unknown) {
  if (typeof body !== 'string') return body
  try {
    return JSON.parse(body) as unknown
  } catch {
    return {}
  }
}

export function fromVercel(req: VercelRequest): DispatchReq {
  const host = String(req.headers.host || 'localhost')
  const url = new URL(req.url || '/', `http://${host}`)
  const proto = String(req.headers['x-forwarded-proto'] || '')
  return {
    method: req.method || 'GET',
    path: url.pathname,
    query: url.searchParams,
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
    res.status(500).json({ error: 'Erreur interne du serveur.' })
  }
}
