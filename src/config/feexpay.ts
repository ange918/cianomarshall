// Configuration des dons FeexPay côté front — AUCUN secret ici.
// Chaque montant a sa propre page de paiement hébergée FeexPay (FeexLink) :
// c'est FeexPay qui gère tout le paiement sur cette page (réseau, numéro,
// code PIN, confirmation). Le montant est fixe par lien (FeexPay ne permet
// pas le montant libre) → un lien par montant.

export type DonationTier = { amount: number; link: string }

export const DONATION_TIERS: DonationTier[] = [
  { amount: 1000, link: 'https://link.feexpay.me/1AvnpMuy/' },
  { amount: 2000, link: 'https://link.feexpay.me/yZRShkSQ/' },
  { amount: 5000, link: 'https://link.feexpay.me/R8kyzils/' },
  { amount: 10000, link: 'https://link.feexpay.me/Tt2h7273/' },
  { amount: 20000, link: 'https://link.feexpay.me/cyp7Tvx4/' },
  { amount: 30000, link: 'https://link.feexpay.me/JEbe9OAy/' },
  { amount: 50000, link: 'https://link.feexpay.me/OWiHILXE/' },
  { amount: 100000, link: 'https://link.feexpay.me/IhwRwDlM/' },
  { amount: 200000, link: 'https://link.feexpay.me/elzQ6S18/' },
  { amount: 300000, link: 'https://link.feexpay.me/E0wZMGS8/' },
  { amount: 500000, link: 'https://link.feexpay.me/IdXlrua3/' },
  { amount: 1000000, link: 'https://link.feexpay.me/eB1RAOLW/' },
]
