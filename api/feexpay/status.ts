import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FEEXPAY_BASE, authHeaders, getCreds } from '../_feexpay.js'

// Vérifie le statut d'une transaction FeexPay (PENDING / SUCCESSFUL / FAILED)
// via l'API v2 publique.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const creds = getCreds()
  if (!creds) {
    return res.status(500).json({
      error: 'Paiement non configuré côté serveur (FEEXPAY_TOKEN manquant dans Vercel).',
    })
  }

  const ref = String(req.query.ref ?? '').trim()
  if (!ref) {
    return res.status(400).json({ error: 'Référence de transaction manquante.' })
  }

  try {
    const upstream = await fetch(
      `${FEEXPAY_BASE}/api/transactions/public/single/status/${encodeURIComponent(ref)}`,
      { headers: authHeaders(creds.apiKey) },
    )
    const raw = await upstream.text()
    let data: any = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }
    console.log('[feexpay:status] ←', upstream.status, raw ? raw.slice(0, 300) : '(vide)')

    if (!upstream.ok) {
      return res.status(502).json({
        error: (data && (data.message || data.error)) || 'Statut indisponible.',
      })
    }
    return res.status(200).json({
      status: data.status ?? 'PENDING',
      reason: data.reason ?? data.message ?? '',
    })
  } catch (err) {
    return res
      .status(502)
      .json({ error: err instanceof Error ? err.message : 'Échec de contact avec FeexPay.' })
  }
}
