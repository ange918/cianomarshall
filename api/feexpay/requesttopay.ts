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

  // Corps strictement conforme à l'exemple documenté FeexPay : phoneNumber
  // NUMÉRIQUE, et champs optionnels ajoutés seulement s'ils sont fournis.
  const payload: Record<string, unknown> = {
    shop: creds.shopId,
    amount,
    phoneNumber: Number(phoneNumber.replace(/\D/g, '')),
  }
  const firstName = str(body.firstName).trim()
  const lastName = str(body.lastName).trim()
  if (firstName) payload.first_name = firstName
  if (lastName) payload.last_name = lastName

  try {
    console.log(
      '[feexpay:requesttopay] →',
      network,
      JSON.stringify({ ...payload, shop: `${creds.shopId.slice(0, 4)}…` }),
    )
    const upstream = await fetch(
      `${FEEXPAY_BASE}/api/transactions/public/requesttopay/${network}`,
      {
        method: 'POST',
        headers: authHeaders(creds.apiKey),
        body: JSON.stringify(payload),
      },
    )

    // Lit le corps brut puis tente de le parser : on ne perd pas l'info si
    // FeexPay renvoie un corps non-JSON ou une erreur applicative en HTTP 2xx.
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

    // La référence peut arriver sous différentes clés selon l'endpoint FeexPay.
    const reference = data.reference ?? data.transref ?? data.transaction_id ?? data.id
    if (!reference) {
      // FeexPay a accepté (ex. {"received":true}) mais sans nous rendre de
      // référence exploitable pour le suivi : on remonte le corps exact.
      return res.status(502).json({
        error:
          (data && data.message)
            ? `FeexPay : ${data.message}`
            : `FeexPay a accepté la demande mais sans référence exploitable (réponse : ${
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
