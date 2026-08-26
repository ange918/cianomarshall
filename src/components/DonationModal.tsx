import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { DONATION_TIERS } from '../config/feexpay'
import { DONATE_EVENT } from '../lib/donate'

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function DonationModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(DONATE_EVENT, onOpen)
    return () => window.removeEventListener(DONATE_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const close = () => setOpen(false)

  const pay = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer')
    close()
  }

  return (
    <div className="donate" role="dialog" aria-modal="true" aria-label="Faire un don">
      <div className="donate__overlay" onClick={close} />
      <div className="donate__panel">
        <button className="donate__close" aria-label="Fermer" onClick={close}>
          <X size={18} strokeWidth={2} />
        </button>

        <span className="donate__kicker">Faire un don</span>
        <h3 className="donate__title">Soutenez les AFA 2026</h3>
        <p className="donate__lead">
          Choisissez un montant. Vous serez redirigé vers la page de paiement sécurisée FeexPay
          (Mobile Money ou carte bancaire), où vous validerez avec votre code.
        </p>

        <div className="donate__amounts">
          {DONATION_TIERS.map((tier) => (
            <button
              key={tier.amount}
              type="button"
              className="donate__amount"
              onClick={() => pay(tier.link)}
            >
              {formatXOF(tier.amount)}
            </button>
          ))}
        </div>

        <p className="donate__secure">Paiement sécurisé · FeexPay · XOF</p>
      </div>
    </div>
  )
}
