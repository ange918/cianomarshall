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
// FeexPay (celui du SDK officiel), qui renvoie une référence de transaction
// exploitable pour le suivi (contrairement à l'endpoint v2 public qui répond
// seulement {"received":true}).
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

  // Corps en application/x-www-form-urlencoded, comme le SDK officiel.
  const form = new URLSearchParams({
    phoneNumber,
    amount: String(amount),
    reseau: reseauName(network),
    token: creds.apiKey,
    shop: creds.shopId,
    first_name: firstName,
    email,
  })

  try {
    console.log('[feexpay:requesttopay] →', reseauName(network), phoneNumber, amount)
    const upstream = await fetch(
      `${FEEXPAY_BASE}/api/transactions/requesttopay/integration`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      },
    )

    const raw = await upstream.text()
    let data: any = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }
    // Journalisé pour diagnostic (visible dans les logs runtime Vercel).
    console.log('[feexpay:requesttopay] ←', upstream.status, raw ? raw.slice(0, 800) : '(vide)')

    if (!upstream.ok) {
      return res.status(502).json({
        error:
          (data && (data.message || data.error)) ||
          `FeexPay a refusé la demande (HTTP ${upstream.status}).`,
        details: data,
      })
    }

    // FeexPay renvoie status "FAILED" quand le numéro est incorrect.
    if (data.status === 'FAILED') {
      return res.status(502).json({
        error: 'Numéro Mobile Money invalide ou paiement refusé par FeexPay.',
        details: data,
      })
    }

    const reference = data.reference ?? data.transref ?? data.transaction_id ?? data.id
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
