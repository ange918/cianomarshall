// Petit bus d'événement pour ouvrir le modal de don depuis n'importe quel CTA.

export const DONATE_EVENT = 'afa:donate'

export function openDonation(amount?: number) {
  window.dispatchEvent(new CustomEvent(DONATE_EVENT, { detail: { amount } }))
}

declare global {
  interface Window {
    FeexPayButton?: { init: (containerId: string, options: Record<string, unknown>) => void }
  }
}

let sdkPromise: Promise<void> | null = null

// Charge le SDK JavaScript hébergé par FeexPay (une seule fois).
export function loadFeexPaySdk(url: string): Promise<void> {
  if (typeof window !== 'undefined' && window.FeexPayButton) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      sdkPromise = null
      reject(new Error('FeexPay SDK failed to load'))
    }
    document.head.appendChild(script)
  })
  return sdkPromise
}
