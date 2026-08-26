import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  FEEXPAY_BASE,
  authHeaders,
  getCreds,
  isNetwork,
  normalizePhone,
} from '../_feexpay.js'

// Lance une demande de paiement Mobile Money via l'API v2 publique de FeexPay,
// exactement comme l'exemple de la documentation : corps minimal
// { shop, amount, phoneNumber } (numéro NUMÉRIQUE) + en-tête Bearer.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const creds = getCreds()
  if (!creds) {
    return res.status(500).json({
      error:
        'Paiement non configuré côté serveur (FEEXPAY_TOKEN manquant dans Vercel).',
    })
  }

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) ?? {}
  const amount = Math.round(Number(body.amount))
  const network = body.network
  const phoneDigits = normalizePhone(String(body.phoneNumber ?? '')).replace(/\D/g, '')

  if (!Number.isFinite(amount) || amount < AMOUNT_MIN || amount > AMOUNT_MAX) {
    return res
      .status(400)
      .json({ error: `Montant invalide (min ${AMOUNT_MIN}, max ${AMOUNT_MAX} XOF).` })
  }
  if (!isNetwork(network)) {
    return res.status(400).json({ error: 'Réseau invalide (mtn, moov ou celtiis).' })
  }
  if (phoneDigits.length < 12) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide.' })
  }

  const origin =
    (typeof req.headers.origin === 'string' && req.headers.origin) ||
    (req.headers.host ? `https://${req.headers.host}` : 'https://africafashionawards.com')

  // Corps conforme à l'exemple documenté v2 (numéro numérique) + callback pour
  // le mode asynchrone (FeexPay accuse réception puis notifie le callback).
  const payload = {
    shop: creds.shopId,
    amount,
    phoneNumber: Number(phoneDigits),
    callback_url: origin,
    callback_info: { source: 'afa-2026' },
  }

  try {
    console.log('[feexpay:requesttopay] →', network, phoneDigits, amount)
    const upstream = await fetch(
      `${FEEXPAY_BASE}/api/transactions/public/requesttopay/${network}`,
      {
        method: 'POST',
        headers: authHeaders(creds.apiKey),
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

    // FeexPay a accepté la demande. En mode synchrone il renvoie une référence ;
    // en mode asynchrone il répond seulement { received: true } — dans les deux
    // cas la demande est partie (le donateur valide sur son téléphone).
    const reference = data.reference ?? data.transaction_id ?? data.transref ?? data.id
    return res.status(200).json({
      accepted: true,
      reference: reference ?? null,
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
