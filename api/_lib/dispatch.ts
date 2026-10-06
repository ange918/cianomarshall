import { randomUUID } from 'node:crypto'
import {
  approveMessage,
  duplicateNames,
  findDemande,
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
  ADMIN_NOT_CONFIGURED,
  ADMIN_ROLE,
  adminConfigured,
  adminDisplayName,
  adminEmail,
  clearSessionCookie,
  login,
  readSession,
} from './auth.js'
import { snapshot, updateStore, withStore } from './store.js'
import { notifyApplicant, whatsappConfigured, whatsappLogDetail, type WhatsAppResult } from './whatsapp.js'

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
  const raw = String(url || '').trim()
  if (!raw) return null
  const href = raw.includes('://') ? raw : `https://${raw}`
  const ctrl = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const pending = fetch(href, { method: 'GET', redirect: 'follow', signal: ctrl.signal }).then(
    (res) => res.status < 400,
    () => false,
  )
  try {
    const result = await Promise.race([
      pending,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          ctrl.abort()
          resolve(null)
        }, 1200)
      }),
    ])
    return result
  } finally {
    if (timer) clearTimeout(timer)
    ctrl.abort()
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

function guardAdmin(session: ReturnType<typeof readSession>): DispatchRes | null {
  if (!adminConfigured()) return json(503, { configured: false, error: ADMIN_NOT_CONFIGURED })
  if (!session) return json(401, { configured: true, error: 'Non connecté' })
  return null
}

function publicWhatsApp(notice: WhatsAppResult) {
  return {
    sent: notice.sent,
    provider: notice.provider,
    warning: notice.warning,
  }
}

const PUBLIC_STATUS: Record<Status, string> = {
  nouvelle: 'Votre demande est en cours d’examen.',
  approuvee: 'Votre accréditation est validée.',
  refusee: 'Votre demande n’a pas été retenue.',
  complement: 'Un complément d’information est demandé. Consultez le WhatsApp reçu.',
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
      { email: adminEmail(), name: adminDisplayName(), role: ADMIN_ROLE },
      { 'Set-Cookie': result.cookies },
    )
  }

  if (path === '/api/admin/logout' && method === 'POST') {
    return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookie(req.secure) })
  }

  if (path === '/api/admin/session' && method === 'GET') {
    const denied = guardAdmin(session)
    if (denied) return denied
    return json(200, { email: session!.email, name: session!.name, role: ADMIN_ROLE, configured: true })
  }

  if (path === '/api/admin/settings' && method === 'PATCH') {
    const denied = guardAdmin(session)
    if (denied) return denied
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
    const denied = guardAdmin(session)
    if (denied) return denied
    const data = await withStore((store) => snapshot(store))
    return json(200, {
      items: sortItems(data.items),
      pressCapacity: data.pressCapacity,
      whatsappConfigured: whatsappConfigured(),
    })
  }

  if (path === '/api/accreditations/statut' && method === 'GET') {
    const code = String(req.query.get('code') || '')
      .trim()
      .toUpperCase()
    if (!/^AFA26-ACC-\d{4}$/.test(code)) return json(400, { error: 'Référence invalide.' })
    const found = await withStore((data) => data.items.find((item) => item.reference === code) || null)
    if (!found) return json(404, { error: 'Aucune demande pour cette référence.' })
    return json(200, {
      reference: found.reference,
      status: found.status,
      statusLabel: STATUS_LABEL[found.status],
      summary: PUBLIC_STATUS[found.status],
      updatedAt: found.updatedAt,
    })
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
        notifications: [],
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
    const denied = guardAdmin(session)
    if (denied) return denied

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
      const data = await withStore((store) => snapshot(store))
      const found = findDemande(data.items, idOrRef)
      if (!found) return json(404, { error: 'Demande introuvable.' })
      let viewed = found
      try {
        const saved = await updateStore((store) => {
          const current = findDemande(store.items, found.id)
          if (!current) return null
          if (!Array.isArray(current.history)) current.history = []
          const lastOpen = [...current.history].reverse().find((entry) => String(entry?.action || '').startsWith('Ouverte'))
          const recent = lastOpen && Date.now() - new Date(lastOpen.at).getTime() < 60 * 60 * 1000
          if (!recent) {
            const entry: HistoryEntry = {
              at: new Date().toISOString(),
              actor: session!.name || adminDisplayName(),
              action: 'Ouverte',
              detail: 'Consultation de la fiche',
            }
            current.history.push(entry)
            current.updatedAt = entry.at
          }
          return snapshot(store).items.find((it) => it.id === current.id) || current
        })
        if (saved) viewed = saved
      } catch (error) {
        console.error(error)
      }
      const linkOk = await probeLink(String(viewed.mediaLink || ''))
      return json(200, {
        item: viewed,
        controls: {
          engagements: Boolean(viewed.acceptAccuracy && viewed.acceptData),
          linkOk,
          duplicateNames: duplicateNames(viewed, data.items),
        },
        team: parseTeam(viewed.teamMembers),
      })
    }

    if (method === 'PATCH') {
      const body = asRecord(req.body)
      const action = String(body.action || '')
      const updated = await updateStore((data) => {
        const item = findDemande(data.items, idOrRef)
        if (!item) return { error: 'Demande introuvable.', status: 404 as const }
        const now = new Date().toISOString()
        const actor = session!.name || adminDisplayName()
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
        if (action === 'notes') {
          return json(200, { item: updated.item, statusLabel: STATUS_LABEL[updated.item.status] })
        }
        const current = snapshot({ seq: 0, pressCapacity: 0, items: [updated.item] }).items[0]
        let notice: WhatsAppResult
        try {
          notice = await notifyApplicant(current)
        } catch {
          notice = {
            sent: false,
            provider: 'none',
            to: current.phone,
            warning: 'Décision enregistrée. WhatsApp non envoyé : erreur technique.',
          }
        }
        const logged = await updateStore((data) => {
          const item = data.items.find((it) => it.id === current.id)
          if (!item) return { item: current, whatsapp: publicWhatsApp(notice) }
          const at = new Date().toISOString()
          item.notifications = item.notifications || []
          item.notifications.push({
            at,
            channel: 'whatsapp',
            to: notice.to,
            ok: notice.sent,
            provider: notice.provider,
            error: notice.warning,
          })
          item.history.push({
            at,
            actor: 'WhatsApp',
            action: notice.sent ? 'WhatsApp envoyé' : 'WhatsApp non envoyé',
            detail: whatsappLogDetail(notice),
          })
          item.updatedAt = at
          return { item, whatsapp: publicWhatsApp(notice) }
        })
        return json(200, {
          item: logged.item,
          statusLabel: STATUS_LABEL[logged.item.status],
          whatsapp: logged.whatsapp,
        })
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
