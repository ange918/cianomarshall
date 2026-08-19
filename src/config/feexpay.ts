// Configuration FeexPay — renseignez ces valeurs via les variables
// d'environnement (fichier .env en local, ou l'onglet Environment Variables
// de Vercel en production). Voir .env.example.
//
// Récupérez votre « Shop ID » et votre clé API dans votre tableau de bord
// FeexPay (https://feexpay.me). Tant que ces valeurs ne sont pas renseignées,
// le formulaire de don bascule sur les moyens de contact directs.

export const FEEXPAY = {
  shopId: import.meta.env.VITE_FEEXPAY_SHOP_ID ?? '',
  token: import.meta.env.VITE_FEEXPAY_TOKEN ?? '',
  // 'LIVE' pour encaisser réellement, 'SANDBOX' pour tester.
  mode: (import.meta.env.VITE_FEEXPAY_MODE ?? 'SANDBOX') as 'LIVE' | 'SANDBOX',
  currency: 'XOF',
  country: 'BJ',
  description: 'Don — Africa Fashion Awards 2026',
  // URL du script SDK hébergé par FeexPay (chargé côté navigateur du visiteur).
  sdkUrl: 'https://api.feexpay.me/feexpay-javascript-sdk/index.js',
} as const

export function isFeexPayConfigured(): boolean {
  return Boolean(FEEXPAY.shopId && FEEXPAY.token)
}

// Montants de don proposés (en FCFA / XOF).
export const DONATION_PRESETS = [2000, 5000, 10000, 25000, 50000] as const
