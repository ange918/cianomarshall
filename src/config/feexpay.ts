// Configuration FeexPay côté front — AUCUN secret ici.
// Les identifiants (clé API + Shop ID) vivent uniquement côté serveur,
// dans les fonctions /api/feexpay/* (variables d'env Vercel FEEXPAY_*).

export const AMOUNT_MIN = 100
export const AMOUNT_MAX = 2_000_000

// Montants de don proposés (en FCFA / XOF).
export const DONATION_PRESETS = [2000, 5000, 10000, 25000, 50000] as const

// Réseaux Mobile Money disponibles au Bénin.
export const NETWORKS = [
  { id: 'mtn', label: 'MTN' },
  { id: 'moov', label: 'Moov' },
  { id: 'celtiis', label: 'Celtiis' },
] as const

export type NetworkId = (typeof NETWORKS)[number]['id']
