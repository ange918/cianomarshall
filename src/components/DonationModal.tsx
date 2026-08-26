import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { AMOUNT_MAX, AMOUNT_MIN, DONATION_PRESETS, FEEXPAY_LINK } from '../config/feexpay'
import { DONATE_EVENT } from '../lib/donate'

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function DonationModal() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<number>(5000)
  const [custom, setCustom] = useState('')

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { amount?: number } | undefined
      if (detail?.amount) setAmount(detail.amount)
      setOpen(true)
    }
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
  const effectiveAmount = custom ? Math.max(0, Math.round(Number(custom))) : amount
  const amountValid = effectiveAmount >= AMOUNT_MIN && effectiveAmount <= AMOUNT_MAX

  const pay = () => {
    if (!amountValid) return
    // Redirige vers la page de paiement FeexPay avec le montant choisi.
    const url = `${FEEXPAY_LINK}?amount=${effectiveAmount}`
    window.open(url, '_blank', 'noopener,noreferrer')
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
          Choisissez votre montant. Vous serez redirigé vers la page de paiement sécurisée
          FeexPay (Mobile Money ou carte bancaire).
        </p>

        <div className="donate__amounts">
          {DONATION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`donate__amount ${!custom && amount === preset ? 'is-active' : ''}`}
              onClick={() => {
                setAmount(preset)
                setCustom('')
              }}
            >
              {formatXOF(preset)}
            </button>
          ))}
        </div>

        <label className="donate__field">
          <span>Montant libre (FCFA)</span>
          <input
            type="number"
            min={AMOUNT_MIN}
            max={AMOUNT_MAX}
            inputMode="numeric"
            placeholder={`De ${AMOUNT_MIN} à ${AMOUNT_MAX}`}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </label>

        <button
          className="btn btn--gold btn--lg donate__submit"
          onClick={pay}
          disabled={!amountValid}
        >
          {`Faire un don de ${formatXOF(amountValid ? effectiveAmount : 0)}`}
        </button>

        <p className="donate__secure">Paiement sécurisé · FeexPay · XOF</p>
      </div>
    </div>
  )
}
