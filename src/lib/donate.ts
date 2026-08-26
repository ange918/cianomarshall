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
  firstName?: string
  lastName?: string
}

export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED'

// Lance une demande de paiement via notre fonction serverless.
export async function requestToPay(
  input: RequestToPayInput,
): Promise<{ reference: string; status: PaymentStatus }> {
  const res = await fetch('/api/feexpay/requesttopay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Le paiement n’a pas pu être lancé.')
  if (!data.reference) throw new Error('Réponse FeexPay invalide (référence manquante).')
  return { reference: data.reference, status: (data.status as PaymentStatus) ?? 'PENDING' }
}

// Interroge le statut d'une transaction.
export async function getPaymentStatus(
  reference: string,
): Promise<{ status: PaymentStatus; reason: string }> {
  const res = await fetch(`/api/feexpay/status?ref=${encodeURIComponent(reference)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Statut du paiement indisponible.')
  return { status: (data.status as PaymentStatus) ?? 'PENDING', reason: data.reason ?? '' }
}
