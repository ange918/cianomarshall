import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getCreds } from '../_feexpay.js'

// Fournit au navigateur les identifiants publics nécessaires au SDK FeexPay
// (id boutique + token). Lit les mêmes variables serveur déjà configurées
// dans Vercel (FEEXPAY_SHOP_ID + FEEXPAY_TOKEN), donc rien de nouveau à créer.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }
  const creds = getCreds()
  if (!creds) {
    return res.status(500).json({
      error:
        'Paiement non configuré côté serveur (FEEXPAY_TOKEN / FEEXPAY_SHOP_ID manquants dans Vercel).',
    })
  }
  // Cache court : la config change rarement.
  res.setHeader('Cache-Control', 'public, max-age=300')
  return res.status(200).json({ id: creds.shopId, token: creds.apiKey })
}
