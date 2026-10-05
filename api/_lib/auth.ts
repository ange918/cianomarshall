import { createHmac } from 'node:crypto'

export const ADMIN_NAME = 'Gauthier ORE'
export const ADMIN_ROLE = 'Administrateur'

const COOKIE = 'afa_admin'
const TRY_COOKIE = 'afa_try'
const MAX_AGE = 60 * 60 * 8
const REMEMBER_AGE = 60 * 60 * 24 * 30
const MAX_TRIES = 5
const LOCK_MS = 15 * 60 * 1000

function secret() {
  return process.env.ADMIN_SESSION_SECRET || 'afa-2026-demo-session-key'
}

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || 'gauthier.ore@africafashionawards.com').trim().toLowerCase()
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'Audace2026'
}

export type Session = { email: string; name: string; exp: number }

export function readCookies(header: string | undefined) {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const key = part.slice(0, i).trim()
    const value = part.slice(i + 1).trim()
    try {
      out[key] = decodeURIComponent(value)
    } catch {
      out[key] = value
    }
  }
  return out
}

function sign(body: string) {
  const payload = Buffer.from(body).toString('base64url')
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function safeEqual(a: string, b: string) {
  const len = Math.max(a.length, b.length)
  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < len; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function unsign(token: string): string | null {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  if (!safeEqual(sig, expected)) return null
  return Buffer.from(payload, 'base64url').toString('utf8')
}

export function readSession(cookieHeader: string | undefined): Session | null {
  const token = readCookies(cookieHeader)[COOKIE]
  if (!token) return null
  const raw = unsign(token)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Session
    if (!data?.email || !data.exp || data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

function cookieFlags(maxAge: number, secure: boolean) {
  const parts = ['HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${maxAge}`]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function sessionCookie(remember: boolean, secure: boolean) {
  const maxAge = remember ? REMEMBER_AGE : MAX_AGE
  const session: Session = {
    email: adminEmail(),
    name: ADMIN_NAME,
    exp: Date.now() + maxAge * 1000,
  }
  const token = sign(JSON.stringify(session))
  return `${COOKIE}=${token}; ${cookieFlags(maxAge, secure)}`
}

export function clearSessionCookie(secure: boolean) {
  return `${COOKIE}=; ${cookieFlags(0, secure)}`
}

type TryState = { n: number; lockUntil: number }

function readTries(cookieHeader: string | undefined): TryState {
  const token = readCookies(cookieHeader)[TRY_COOKIE]
  if (!token) return { n: 0, lockUntil: 0 }
  const raw = unsign(token)
  if (!raw) return { n: 0, lockUntil: 0 }
  try {
    const data = JSON.parse(raw) as TryState
    return { n: Number(data.n) || 0, lockUntil: Number(data.lockUntil) || 0 }
  } catch {
    return { n: 0, lockUntil: 0 }
  }
}

function tryCookie(state: TryState, secure: boolean) {
  const token = sign(JSON.stringify(state))
  return `${TRY_COOKIE}=${token}; ${cookieFlags(60 * 30, secure)}`
}

export function clearTryCookie(secure: boolean) {
  return `${TRY_COOKIE}=; ${cookieFlags(0, secure)}`
}

export type LoginResult =
  | { ok: true; cookies: string[] }
  | { ok: false; status: number; error: string; cookies: string[] }

export function login(email: string, password: string, remember: boolean, cookieHeader: string | undefined, secure: boolean): LoginResult {
  const tries = readTries(cookieHeader)
  if (tries.lockUntil && tries.lockUntil > Date.now()) {
    return {
      ok: false,
      status: 429,
      error: 'Trop de tentatives. Réessayez dans quelques minutes.',
      cookies: [],
    }
  }
  const emailOk = safeEqual(String(email || '').trim().toLowerCase(), adminEmail())
  const passOk = safeEqual(String(password || ''), adminPassword())
  if (!emailOk || !passOk) {
    const n = tries.n + 1
    const lockUntil = n >= MAX_TRIES ? Date.now() + LOCK_MS : 0
    const remaining = Math.max(0, MAX_TRIES - n)
    const error =
      lockUntil > 0
        ? 'Trop de tentatives. Réessayez dans quelques minutes.'
        : `Identifiants incorrects. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`
    return {
      ok: false,
      status: 401,
      error,
      cookies: [tryCookie({ n, lockUntil }, secure)],
    }
  }
  return {
    ok: true,
    cookies: [sessionCookie(remember, secure), clearTryCookie(secure)],
  }
}
