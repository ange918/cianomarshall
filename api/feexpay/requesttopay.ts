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

// Lance une demande de paiement Mobile Money (request-to-pay) via FeexPay.
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

  try {
    const upstream = await fetch(
      `${FEEXPAY_BASE}/api/transactions/public/requesttopay/${network}`,
      {
        method: 'POST',
        headers: authHeaders(creds.apiKey),
        body: JSON.stringify({
          shop: creds.shopId,
          amount,
          phoneNumber,
          first_name: str(body.firstName),
          last_name: str(body.lastName),
          description: 'Don Africa Fashion Awards 2026',
        }),
      },
    )

    const data: any = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      return res.status(502).json({
        error: (data && (data.message || data.error)) || 'FeexPay a refusé la demande.',
        details: data,
      })
    }

    return res.status(200).json({
      reference: data.reference,
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
