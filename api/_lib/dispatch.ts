import { randomUUID } from 'node:crypto'
import {
  approveMessage,
  duplicateNames,
  normalizeForm,
  parseTeam,
  REFUSAL_REASONS,
  STATUS_LABEL,
  teamCount,
  toCsv,
  validateForm,
  type Accreditation,
  type HistoryEntry,
  type Status,
} from '../../src/lib/accreditation/model.js'
import {
  ADMIN_NAME,
  ADMIN_ROLE,
  adminEmail,
  clearSessionCookie,
  login,
  readSession,
} from './auth.js'
import { snapshot, updateStore, withStore } from './store.js'

export type DispatchReq = {
  method: string
  path: string
  query: URLSearchParams
  body: unknown
  cookie: string | undefined
  secure: boolean
}

export type DispatchRes = {
  status: number
  headers?: Record<string, string | string[]>
  json?: unknown
  text?: string
  contentType?: string
}

function json(status: number, body: unknown, headers?: Record<string, string | string[]>): DispatchRes {
  return { status, json: body, headers }
}

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
}

function isStatus(v: string): v is Status {
  return v === 'nouvelle' || v === 'approuvee' || v === 'refusee' || v === 'complement'
}

async function probeLink(url: string): Promise<boolean | null> {
  const raw = url.trim()
  if (!raw) return null
  const href = raw.includes('://') ? raw : `https://${raw}`
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 1500)
    const res = await fetch(href, { method: 'GET', redirect: 'follow', signal: ctrl.signal })
    clearTimeout(timer)
    return res.status < 400
  } catch {
    return false
  }
}

function nextReference(items: Accreditation[], seq: number) {
  const maxExisting = items.reduce((max, item) => {
    const n = Number(item.reference.split('-').pop())
    return Number.isFinite(n) ? Math.max(max, n) : max
  }, seq)
  return maxExisting + 1
}

function sortItems(items: Accreditation[]) {
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function dispatch(req: DispatchReq): Promise<DispatchRes> {
  const method = req.method.toUpperCase()
  const path = req.path.replace(/\/+$/, '') || '/'
  const session = readSession(req.cookie)

  if (path === '/api/admin/login' && method === 'POST') {
    const body = asRecord(req.body)
    const result = login(
      String(body.email ?? ''),
      String(body.password ?? ''),
      Boolean(body.remember),
      req.cookie,
      req.secure,
    )
    if (!result.ok) {
      return json(result.status, { error: result.error }, { 'Set-Cookie': result.cookies })
    }
    return json(
      200,
      { email: adminEmail(), name: ADMIN_NAME, role: ADMIN_ROLE },
      { 'Set-Cookie': result.cookies },
    )
  }

  if (path === '/api/admin/logout' && method === 'POST') {
    return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookie(req.secure) })
  }

  if (path === '/api/admin/session' && method === 'GET') {
    if (!session) return json(401, { error: 'Non connecté' })
    return json(200, { email: session.email, name: session.name, role: ADMIN_ROLE })
  }

  if (path === '/api/admin/settings' && method === 'PATCH') {
    if (!session) return json(401, { error: 'Non connecté' })
    const body = asRecord(req.body)
    const capacity = Math.round(Number(body.pressCapacity))
    if (!Number.isFinite(capacity) || capacity < 1 || capacity > 5000) {
      return json(400, { error: 'Capacité invalide.' })
    }
    const saved = await updateStore((data) => {
      data.pressCapacity = capacity
      return capacity
    })
    return json(200, { pressCapacity: saved })
  }

  if (path === '/api/accreditations' && method === 'GET') {
    if (!session) return json(401, { error: 'Non connecté' })
    const data = await withStore((store) => snapshot(store))
    return json(200, { items: sortItems(data.items), pressCapacity: data.pressCapacity })
  }

  if (path === '/api/accreditations' && method === 'POST') {
    const values = normalizeForm(asRecord(req.body))
    const errors = validateForm(values)
    if (Object.keys(errors).length) {
      return json(400, { error: 'Le formulaire contient des erreurs.', errors })
    }
    const created = await updateStore((data) => {
      const n = nextReference(data.items, data.seq)
      data.seq = n
      const now = new Date().toISOString()
      const reference = `AFA26-ACC-${String(n).padStart(4, '0')}`
      const record: Accreditation = {
        ...values,
        id: randomUUID(),
        reference,
        status: 'nouvelle',
        createdAt: now,
        updatedAt: now,
        internalNotes: '',
        complementFields: [],
        decisionMessage: '',
        refusalReason: '',
        history: [
          {
            at: now,
            actor: 'Formulaire public',
            action: 'Demande envoyée',
            detail: 'Formulaire public',
          },
        ],
      }
      data.items.push(record)
      return {
        reference: record.reference,
        status: record.status,
        statusLabel: STATUS_LABEL[record.status],
        fullName: record.fullName,
        mediaName: record.mediaName,
        teamCount: teamCount(record),
        createdAt: record.createdAt,
      }
    })
    return json(201, created)
  }

  const itemMatch = path.match(/^\/api\/accreditations\/([^/]+)$/)
  if (itemMatch) {
    const idOrRef = decodeURIComponent(itemMatch[1] || '')
    if (!session) return json(401, { error: 'Non connecté' })

    if (idOrRef === 'export' && method === 'GET') {
      const data = await withStore((store) => snapshot(store))
      const ids = req.query.get('ids')
      let items = sortItems(data.items)
      if (ids) {
        const set = new Set(ids.split(',').filter(Boolean))
        items = items.filter((item) => set.has(item.id))
      }
      const status = req.query.get('statut')
      if (status && isStatus(status)) items = items.filter((item) => item.status === status)
      return {
        status: 200,
        text: toCsv(items),
        contentType: 'text/csv; charset=utf-8',
        headers: {
          'Content-Disposition': 'attachment; filename="accreditations-afa-2026.csv"',
        },
      }
    }

    if (method === 'GET') {
      const result = await updateStore(async (data) => {
        const item = data.items.find((it) => it.id === idOrRef || it.reference === idOrRef)
        if (!item) return null
        const lastOpen = [...item.history].reverse().find((h) => h.action.startsWith('Ouverte'))
        const recent = lastOpen && Date.now() - new Date(lastOpen.at).getTime() < 60 * 60 * 1000
        if (!recent) {
          const entry: HistoryEntry = {
            at: new Date().toISOString(),
            actor: session.name || ADMIN_NAME,
            action: 'Ouverte',
            detail: 'Consultation de la fiche',
          }
          item.history.push(entry)
          item.updatedAt = entry.at
        }
        const linkOk = await probeLink(item.mediaLink)
        return {
          item: snapshot({ seq: data.seq, pressCapacity: data.pressCapacity, items: [item] }).items[0],
          controls: {
            engagements: item.acceptAccuracy && item.acceptData,
            linkOk,
            duplicateNames: duplicateNames(item, data.items),
          },
          team: parseTeam(item.teamMembers),
        }
      })
      if (!result) return json(404, { error: 'Demande introuvable.' })
      return json(200, result)
    }

    if (method === 'PATCH') {
      const body = asRecord(req.body)
      const action = String(body.action || '')
      const updated = await updateStore((data) => {
        const item = data.items.find((it) => it.id === idOrRef || it.reference === idOrRef)
        if (!item) return { error: 'Demande introuvable.', status: 404 as const }
        const now = new Date().toISOString()
        const actor = session.name || ADMIN_NAME
        if (action === 'notes') {
          item.internalNotes = String(body.internalNotes ?? '').slice(0, 4000)
          item.updatedAt = now
          item.history.push({ at: now, actor, action: 'Note interne mise à jour' })
          return { item }
        }
        const message = String(body.message ?? '').trim().slice(0, 4000)
        if (action === 'approve') {
          item.status = 'approuvee'
          item.decisionMessage = message || approveMessage(item)
          item.refusalReason = ''
          item.complementFields = []
          item.updatedAt = now
          item.history.push({
            at: now,
            actor,
            action: 'Demande approuvée',
            detail: `${teamCount(item)} badge${teamCount(item) > 1 ? 's' : ''} nominatif${teamCount(item) > 1 ? 's' : ''}`,
          })
          return { item }
        }
        if (action === 'refuse') {
          const reason = REFUSAL_REASONS.find((r) => r.id === String(body.reason || ''))
          if (!reason) return { error: 'Motif de refus requis.', status: 400 as const }
          item.status = 'refusee'
          item.refusalReason = reason.id
          item.decisionMessage = message || reason.message
          item.complementFields = []
          item.updatedAt = now
          item.history.push({
            at: now,
            actor,
            action: 'Demande refusée',
            detail: reason.label,
          })
          return { item }
        }
        if (action === 'complement') {
          const fields = Array.isArray(body.fields) ? body.fields.map(String).slice(0, 8) : []
          if (!fields.length && !message) {
            return { error: 'Précisez au moins un champ ou un message.', status: 400 as const }
          }
          item.status = 'complement'
          item.complementFields = fields
          item.decisionMessage = message
          item.refusalReason = ''
          item.updatedAt = now
          item.history.push({
            at: now,
            actor,
            action: 'Complément demandé',
            detail: fields.join(', ') || message,
          })
          return { item }
        }
        return { error: 'Action inconnue.', status: 400 as const }
      })
      if ('item' in updated && updated.item) {
        return json(200, { item: updated.item, statusLabel: STATUS_LABEL[updated.item.status] })
      }
      const failure = updated as { error?: string; status?: number }
      return json(failure.status || 400, { error: failure.error || 'Action impossible.' })
    }

    return json(405, { error: 'Méthode non autorisée' }, { Allow: 'GET, PATCH' })
  }

  if (path === '/api/accreditations' || path === '/api/admin/login' || path === '/api/admin/logout' || path === '/api/admin/session' || path === '/api/admin/settings') {
    return json(405, { error: 'Méthode non autorisée' })
  }

  return json(404, { error: 'Introuvable' })
}
