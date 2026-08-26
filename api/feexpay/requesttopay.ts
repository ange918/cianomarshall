import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  FEEXPAY_BASE,
  getCreds,
  isNetwork,
  normalizePhone,
  reseauName,
} from '../_feexpay.js'

// Lance une demande de paiement Mobile Money via le flux « integration » de
// FeexPay, en reproduisant EXACTEMENT la requête du SDK React officiel :
// corps JSON + en-tête Authorization: Bearer, champ « reseau » mappé
// (Celtiis Bénin = "CELTIIS BJ"). Renvoie une référence de transaction
// exploitable pour le suivi de statut.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const creds = getCreds()
  if (!creds) {
    return res.status(500).json({
      error:
        'Paiement non configuré côté serveur (FEEXPAY_API_KEY / FEEXPAY_SHOP_ID manquants dans Vercel).',
    })
  }

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) ?? {}
  const amount = Math.round(Number(body.amount))
  const network = body.network
  const phoneNumber = normalizePhone(String(body.phoneNumber ?? ''))

  if (!Number.isFinite(amount) || amount < AMOUNT_MIN || amount > AMOUNT_MAX) {
    return res
      .status(400)
      .json({ error: `Montant invalide (min ${AMOUNT_MIN}, max ${AMOUNT_MAX} XOF).` })
  }
  if (!isNetwork(network)) {
    return res.status(400).json({ error: 'Réseau invalide (mtn, moov ou celtiis).' })
  }
  if (phoneNumber.replace(/\D/g, '').length < 12) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide.' })
  }

  const firstName = str(body.firstName).trim() || 'Donateur'
  const email = str(body.email).trim() || 'don@africafashionawards.com'
  // Description sans caractères spéciaux (contrainte MTN).
  const description = 'Don Africa Fashion Awards 2026'
  const merchantDomain =
    (typeof req.headers.origin === 'string' && req.headers.origin) ||
    (req.headers.host ? `https://${req.headers.host}` : 'https://africafashionawards.com')
  const forwarded = req.headers['x-forwarded-for']
  const merchantIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded || '').split(',')[0].trim() || 'unknown'

  // Corps JSON identique au SDK officiel FeexPay (payment_interface REACT).
  const payload = {
    phoneNumber,
    amount,
    reseau: reseauName(network),
    description,
    customId: `afa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    shop: creds.shopId,
    token: creds.apiKey,
    merchant_domain: merchantDomain,
    merchant_ip: merchantIp,
    payment_interface: 'REACT',
    callback_info: {},
    currency: 'XOF',
    first_name: firstName,
    email,
    otp: '',
  }

  try {
    console.log('[feexpay:requesttopay] →', payload.reseau, phoneNumber, amount)
    const upstream = await fetch(
      `${FEEXPAY_BASE}/api/transactions/requesttopay/integration`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creds.apiKey}`,
        },
        body: JSON.stringify(payload),
      },
    )

    const raw = await upstream.text()
    let data: any = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }
    console.log('[feexpay:requesttopay] ←', upstream.status, raw ? raw.slice(0, 800) : '(vide)')

    if (!upstream.ok) {
      return res.status(502).json({
        error:
          (data && (data.message || data.error)) ||
          `FeexPay a refusé la demande (HTTP ${upstream.status}).`,
        details: data,
      })
    }

    if (data.status === 'FAILED') {
      return res.status(502).json({
        error: 'Numéro Mobile Money invalide ou paiement refusé par FeexPay.',
        details: data,
      })
    }

    const reference = data.reference ?? data.transaction_id
    if (!reference) {
      return res.status(502).json({
        error:
          (data && data.message)
            ? `FeexPay : ${data.message}`
            : `FeexPay n'a pas renvoyé de référence (réponse : ${
                raw ? raw.slice(0, 200) : 'vide'
              }).`,
        details: data,
      })
    }

    return res.status(200).json({
      reference,
      status: data.status ?? 'PENDING',
    })
  } catch (err) {
    return res
      .status(502)
      .json({ error: err instanceof Error ? err.message : 'Échec de contact avec FeexPay.' })
  }
}

function safeParse(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
