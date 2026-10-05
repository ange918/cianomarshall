import { CONTACT } from '../../src/data/content.js'
import { REFUSAL_REASONS, firstName, type Accreditation } from '../../src/lib/accreditation/model.js'
import { maskPhone, normalizeWhatsAppPhone } from './phone.js'

export type WhatsAppResult = {
  sent: boolean
  provider: 'twilio' | 'meta' | 'none'
  to: string
  warning?: string
}

const MISSING =
  'Décision enregistrée. WhatsApp non envoyé : la messagerie n’est pas configurée (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, ou META_WHATSAPP_TOKEN et META_WHATSAPP_PHONE_ID).'

type Provider = 'twilio' | 'meta'

function twilioReady() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
}

function metaReady() {
  return Boolean(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_ID)
}

export function whatsappProvider(): Provider | null {
  const prefer = (process.env.WHATSAPP_PROVIDER || '').trim().toLowerCase()
  if (prefer === 'twilio' && twilioReady()) return 'twilio'
  if (prefer === 'meta' && metaReady()) return 'meta'
  if (prefer === 'twilio' || prefer === 'meta') return null
  if (twilioReady()) return 'twilio'
  if (metaReady()) return 'meta'
  return null
}

export function whatsappConfigured() {
  return whatsappProvider() !== null
}

function siteBase() {
  const explicit = process.env.PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return `https://${production.replace(/^https?:\/\//, '')}`
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`
  return 'https://cianomarshall.vercel.app'
}

export function statusUrl(reference: string) {
  return `${siteBase()}/accreditation/statut?code=${encodeURIComponent(reference)}`
}

function decisionLine(item: Accreditation) {
  if (item.status === 'approuvee') return `Votre demande d’accréditation médias ${item.reference} est validée.`
  if (item.status === 'complement') return `Votre demande d’accréditation médias ${item.reference} nécessite un complément.`
  return `Votre demande d’accréditation médias ${item.reference} est refusée.`
}

function nextStep(item: Accreditation) {
  if (item.status === 'approuvee') {
    return 'Prochaine étape : conservez ce message et présentez-le avec une pièce d’identité à l’accueil presse le 15 novembre 2026.'
  }
  if (item.status === 'complement') {
    return 'Prochaine étape : répondez à ce WhatsApp avec les précisions demandées. Votre dossier reste ouvert.'
  }
  return `Pour toute question : ${CONTACT.phone}.`
}

export function buildWhatsAppText(item: Accreditation) {
  const reason = REFUSAL_REASONS.find((entry) => entry.id === item.refusalReason)
  const lines = [
    'Africa Fashion Awards — AFA 2026',
    '',
    `Bonjour ${firstName(item.fullName)},`,
    '',
    decisionLine(item),
  ]
  if (item.status === 'refusee' && reason) {
    lines.push('', `Motif : ${reason.label}.`)
  }
  if (item.status === 'complement' && item.complementFields.length) {
    lines.push('', `Éléments à préciser : ${item.complementFields.join(', ')}.`)
  }
  if (item.decisionMessage.trim()) {
    lines.push('', 'Message de l’équipe :', item.decisionMessage.trim())
  }
  lines.push('', nextStep(item), '', `Suivi : ${statusUrl(item.reference)}`, '', '— Équipe Africa Fashion Awards')
  return lines.join('\n')
}

async function postTwilio(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID || ''
  const token = process.env.TWILIO_AUTH_TOKEN || ''
  const fromRaw = process.env.TWILIO_WHATSAPP_FROM || ''
  const from = fromRaw.startsWith('whatsapp:') ? fromRaw : `whatsapp:${fromRaw}`
  const payload = new URLSearchParams({
    From: from,
    To: `whatsapp:${to}`,
    Body: body,
  })
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
      signal: ctrl.signal,
    })
    if (!res.ok) {
      const detail = (await res.json().catch(() => null)) as { message?: string } | null
      throw new Error(detail?.message || `Twilio ${res.status}`)
    }
  } finally {
    clearTimeout(timer)
  }
}

async function postMeta(to: string, body: string) {
  const token = process.env.META_WHATSAPP_TOKEN || ''
  const phoneId = process.env.META_WHATSAPP_PHONE_ID || ''
  const version = process.env.META_WHATSAPP_API_VERSION?.trim() || 'v21.0'
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneId)}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/^\+/, ''),
        type: 'text',
        text: { body },
      }),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      const detail = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      throw new Error(detail?.error?.message || `Meta WhatsApp ${res.status}`)
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function notifyApplicant(item: Accreditation): Promise<WhatsAppResult> {
  const provider = whatsappProvider()
  const to = normalizeWhatsAppPhone(item.phone)
  if (!to) {
    return {
      sent: false,
      provider: provider || 'none',
      to: item.phone.trim() || '—',
      warning: 'Décision enregistrée. WhatsApp non envoyé : le numéro indiqué n’est pas utilisable (format international attendu, ex. +229 01 …).',
    }
  }
  if (!provider) {
    return { sent: false, provider: 'none', to, warning: MISSING }
  }
  try {
    const text = buildWhatsAppText(item)
    if (provider === 'twilio') await postTwilio(to, text)
    else await postMeta(to, text)
    return { sent: true, provider, to }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'erreur technique'
    const safe = reason.replace(/\s+/g, ' ').slice(0, 180)
    return {
      sent: false,
      provider,
      to,
      warning: `Décision enregistrée. WhatsApp non envoyé (${provider}) : ${safe}`,
    }
  }
}

export function whatsappLogDetail(result: WhatsAppResult) {
  if (result.sent) return maskPhone(result.to)
  return result.warning || 'WhatsApp non envoyé'
}
