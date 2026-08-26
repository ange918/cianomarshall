// Bus d'événement pour ouvrir le modal de don + appels à notre backend FeexPay.

import type { NetworkId } from '../config/feexpay'

export const DONATE_EVENT = 'afa:donate'

export function openDonation(amount?: number) {
  window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { amount } }))
}

export type RequestToPayInput = {
  amount: number
  network: NetworkId
  phoneNumber: string
}

export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED'

// Lance une demande de paiement via notre fonction serverless (API FeexPay v2).
// FeexPay fonctionne en mode asynchrone : il accuse réception de la demande
// (la demande part sur le téléphone du donateur) sans forcément renvoyer une
// référence exploitable. On considère donc la demande « envoyée ».
export async function requestToPay(
  input: RequestToPayInput,
): Promise<{ reference: string | null }> {
  const res = await fetch('/api/feexpay/requesttopay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Le paiement n’a pas pu être lancé.')
  return { reference: data.reference ?? null }
}
