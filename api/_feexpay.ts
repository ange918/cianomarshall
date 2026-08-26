// Helper serveur FeexPay — partagé par les fonctions serverless.
// La clé API vit uniquement côté serveur (jamais dans le bundle navigateur).

export const FEEXPAY_BASE = 'https://api-v2.feexpay.me'

export const NETWORKS = ['mtn', 'moov', 'celtiis'] as const
export type Network = (typeof NETWORKS)[number]

export const AMOUNT_MIN = 100
export const AMOUNT_MAX = 2_000_000

export type FeexPayCreds = { apiKey: string; shopId: string }

// Lit les identifiants depuis l'environnement serveur. Renvoie null si absents.
// Accepte FEEXPAY_API_KEY ou FEEXPAY_TOKEN pour la clé (noms interchangeables).
export function getCreds(): FeexPayCreds | null {
  const apiKey = process.env.FEEXPAY_API_KEY || process.env.FEEXPAY_TOKEN
  const shopId = process.env.FEEXPAY_SHOP_ID
  if (!apiKey || !shopId) return null
  return { apiKey, shopId }
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
