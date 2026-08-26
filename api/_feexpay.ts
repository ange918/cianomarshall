// Helper serveur FeexPay (API v2 « public ») — partagé par les fonctions
// serverless. La clé API vit uniquement côté serveur (jamais dans le bundle
// navigateur).

// API v2 publique de FeexPay (le serveur qui répond).
export const FEEXPAY_BASE = 'https://api-v2.feexpay.me'

export const NETWORKS = ['mtn', 'moov', 'celtiis'] as const
export type Network = (typeof NETWORKS)[number]

export const AMOUNT_MIN = 100
export const AMOUNT_MAX = 2_000_000

// Identifiant de la boutique FeexPay (public — il part de toute façon vers
// FeexPay). Défini ici : changer de boutique = changer cette valeur.
export const SHOP_ID = 'MGk7Dv1POaTTuY5'

export type FeexPayCreds = { apiKey: string; shopId: string }

// Lit la clé (secrète) depuis l'environnement serveur ; l'ID boutique vient
// du code. Accepte FEEXPAY_API_KEY ou FEEXPAY_TOKEN (noms interchangeables).
export function getCreds(): FeexPayCreds | null {
  const apiKey = process.env.FEEXPAY_API_KEY || process.env.FEEXPAY_TOKEN
  if (!apiKey) return null
  return { apiKey, shopId: SHOP_ID }
}

export function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

// Normalise un numéro béninois au format attendu : 229 + 10 chiffres.
export function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  if (digits.startsWith('229')) return digits
  return `229${digits}`
}

export function isNetwork(v: unknown): v is Network {
  return typeof v === 'string' && (NETWORKS as readonly string[]).includes(v)
}
