import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { AMOUNT_MAX, AMOUNT_MIN, DONATION_PRESETS, NETWORKS, type NetworkId } from '../config/feexpay'
import { DONATE_EVENT, requestToPay } from '../lib/donate'

type Status = 'form' | 'submitting' | 'sent' | 'failed'

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function DonationModal() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('form')
  const [amount, setAmount] = useState<number>(5000)
  const [custom, setCustom] = useState('')
  const [network, setNetwork] = useState<NetworkId>('mtn')
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { amount?: number } | undefined
      if (detail?.amount) setAmount(detail.amount)
      setReason('')
      setStatus('form')
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

  const effectiveAmount = custom ? Math.max(0, Math.round(Number(custom))) : amount
  const amountValid = effectiveAmount >= AMOUNT_MIN && effectiveAmount <= AMOUNT_MAX
  const phoneValid = phone.replace(/\D/g, '').length >= 10

  const handleSubmit = async () => {
    if (!amountValid || !phoneValid) return
    setReason('')
    setStatus('submitting')
    try {
      await requestToPay({ amount: effectiveAmount, network, phoneNumber: phone })
      setStatus('sent')
    } catch (err) {
      setReason(err instanceof Error ? err.message : 'Le paiement n’a pas pu être lancé.')
      setStatus('failed')
    }
  }

  if (!open) return null

  const close = () => setOpen(false)
  const backToForm = () => {
    setReason('')
    setStatus('form')
  }

  return (
    <div className="donate" role="dialog" aria-modal="true" aria-label="Faire un don">
      <div className="donate__overlay" onClick={close} />
      <div className="donate__panel">
        <button className="donate__close" aria-label="Fermer" onClick={close}>
          <X size={18} strokeWidth={2} />
        </button>

        {status === 'sent' ? (
          <div className="donate__done">
            <span className="donate__kicker">Demande envoyée</span>
            <h3 className="donate__title">Validez sur votre téléphone</h3>
            <p className="donate__lead">
              Une demande de paiement de <strong>{formatXOF(effectiveAmount)}</strong> vient d’être
              envoyée au <strong>{phone}</strong>. Confirmez-la avec votre code{' '}
              {network.toUpperCase()} Mobile Money pour finaliser votre don.
            </p>
            <p className="donate__lead">
              Merci de soutenir l’audace africaine. 💛
            </p>
            <button className="btn btn--gold" onClick={close}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <span className="donate__kicker">Faire un don</span>
            <h3 className="donate__title">Soutenez les AFA 2026</h3>
            <p className="donate__lead">
              Paiement Mobile Money sécurisé par FeexPay. Choisissez un montant, votre réseau et
              votre numéro.
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

            <div className="donate__field">
              <span>Réseau Mobile Money</span>
              <div className="donate__networks">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`donate__network ${network === n.id ? 'is-active' : ''}`}
                    onClick={() => setNetwork(n.id)}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="donate__field">
              <span>Numéro Mobile Money</span>
              <input
                type="tel"
                inputMode="tel"
                placeholder="Ex. 01 66 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <button
              className="btn btn--gold btn--lg donate__submit"
              onClick={handleSubmit}
              disabled={status === 'submitting' || !amountValid || !phoneValid}
            >
              {status === 'submitting'
                ? 'Envoi en cours…'
                : `Faire un don de ${formatXOF(amountValid ? effectiveAmount : 0)}`}
            </button>

            {status === 'failed' && reason && (
              <div className="donate__notice">
                <p>Le paiement n’a pas abouti.</p>
                <p className="donate__reason">{reason}</p>
                <button className="btn btn--ghost" onClick={backToForm}>
                  Réessayer
                </button>
              </div>
            )}

            <p className="donate__secure">Paiement sécurisé · FeexPay · XOF</p>
          </>
        )}
      </div>
    </div>
  )
}
