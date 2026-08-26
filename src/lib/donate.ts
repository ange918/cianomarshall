// Bus d'événement pour ouvrir le modal de don.

export const DONATE_EVENT = 'afa:donate'

export function openDonation(amount?: number) {
  window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { amount } }))
}
