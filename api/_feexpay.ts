// Helper serveur FeexPay — partagé par les fonctions serverless.
// La clé API vit uniquement côté serveur (jamais dans le bundle navigateur).

// Hôte de l'API « integration » (flux du SDK officiel qui renvoie une
// référence de transaction, contrairement à l'endpoint v2 public qui répond
// seulement {"received":true}).
export const FEEXPAY_BASE = 'https://api.feexpay.me'

export const NETWORKS = ['mtn', 'moov', 'celtiis'] as const
export type Network = (typeof NETWORKS)[number]

// Nom du réseau attendu par FeexPay dans le corps (champ « reseau »).
// Valeurs tirées du mappage NETWORK_API_MAPPING (Bénin) du SDK officiel :
// Celtiis Bénin doit être « CELTIIS BJ » (et non « CELTIIS »), sinon 502.
const RESEAU_NAMES: Record<Network, string> = {
  mtn: 'MTN',
  moov: 'MOOV',
  celtiis: 'CELTIIS BJ',
}
export function reseauName(network: Network): string {
  return RESEAU_NAMES[network]
}

export const AMOUNT_MIN = 100
export const AMOUNT_MAX = 2_000_000

export type FeexPayCreds = { apiKey: string; shopId: string }

// Identifiant de la boutique FeexPay. Public (il est de toute façon transmis
// au navigateur par le SDK), donc défini ici : changer de boutique = changer
// cette valeur, sans reconfigurer Vercel.
export const SHOP_ID = 'MGk7Dv1POaTTuY5'

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
