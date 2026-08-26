import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { AMOUNT_MAX, AMOUNT_MIN, DONATION_PRESETS, NETWORKS, type NetworkId } from '../config/feexpay'
import { DONATE_EVENT, getPaymentStatus, requestToPay } from '../lib/donate'

type Status = 'form' | 'submitting' | 'pending' | 'success' | 'failed'

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 120000

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
  const [firstName, setFirstName] = useState('')
  const [reason, setReason] = useState('')
  const pollRef = useRef<number | null>(null)

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  // Ouverture depuis n'importe quel CTA « faire un don ».
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

  // Fermeture au clavier + blocage du scroll + nettoyage du polling.
  useEffect(() => {
    if (!open) {
      stopPolling()
      return
    }
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

  useEffect(() => () => stopPolling(), [])

  const effectiveAmount = custom ? Math.max(0, Math.round(Number(custom))) : amount
  const amountValid = effectiveAmount >= AMOUNT_MIN && effectiveAmount <= AMOUNT_MAX
  const phoneValid = phone.replace(/\D/g, '').length >= 8

  const startPolling = (reference: string) => {
    const started = Date.now()
    pollRef.current = window.setInterval(async () => {
      try {
        const { status: st, reason: rs } = await getPaymentStatus(reference)
        if (st === 'SUCCESSFUL') {
          stopPolling()
          setStatus('success')
        } else if (st === 'FAILED') {
          stopPolling()
          setReason(rs || 'Le paiement a échoué.')
          setStatus('failed')
        } else if (Date.now() - started > POLL_TIMEOUT_MS) {
          stopPolling()
          setReason('Délai dépassé. Si vous avez validé sur votre téléphone, réessayez la vérification.')
          setStatus('failed')
        }
      } catch {
        // Erreur réseau ponctuelle : on retente au tick suivant.
      }
    }, POLL_INTERVAL_MS)
  }

  const handleSubmit = async () => {
    if (!amountValid || !phoneValid) return
    setReason('')
    setStatus('submitting')
    try {
      const { reference } = await requestToPay({
        amount: effectiveAmount,
        network,
        phoneNumber: phone,
        firstName,
      })
      setStatus('pending')
      startPolling(reference)
    } catch (err) {
      setReason(err instanceof Error ? err.message : 'Le paiement n’a pas pu être lancé.')
      setStatus('failed')
    }
  }

  if (!open) return null

  const close = () => setOpen(false)
  const backToForm = () => {
    stopPolling()
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

        {status === 'success' ? (
          <div className="donate__done">
            <span className="donate__kicker">Merci</span>
            <h3 className="donate__title">Votre don est confirmé</h3>
            <p className="donate__lead">
              Merci de soutenir l’audace africaine. Votre contribution fait vivre les Africa
              Fashion Awards 2026.
            </p>
            <button className="btn btn--gold" onClick={close}>
              Fermer
            </button>
          </div>
        ) : status === 'pending' ? (
          <div className="donate__done">
            <span className="donate__kicker">En attente</span>
            <h3 className="donate__title">Validez sur votre téléphone</h3>
            <p className="donate__lead">
              Une demande de paiement de <strong>{formatXOF(effectiveAmount)}</strong> a été
              envoyée au <strong>{phone}</strong>. Confirmez avec votre code {network.toUpperCase()}
              {' '}Mobile Money. Cette fenêtre se met à jour automatiquement.
            </p>
            <span className="donate__spinner" aria-hidden="true" />
            <button className="btn btn--ghost" onClick={backToForm}>
              Annuler
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

            <div className="donate__grid">
              <label className="donate__field">
                <span>Téléphone (Mobile Money)</span>
                <input
                  type="tel"
                  placeholder="+229 01 …"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label className="donate__field">
                <span>Prénom (optionnel)</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
            </div>

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
              </div>
            )}

            <p className="donate__secure">Paiement sécurisé · FeexPay · XOF</p>
          </>
        )}
      </div>
    </div>
  )
}
