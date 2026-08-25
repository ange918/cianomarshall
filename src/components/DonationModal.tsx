import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { DONATION_PRESETS, FEEXPAY, isFeexPayConfigured } from '../config/feexpay'
import { DONATE_EVENT, loadFeexPaySdk } from '../lib/donate'

type Status = 'form' | 'loading' | 'ready' | 'error' | 'success'

const FEEX_CONTAINER = 'feexpay-container'

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function DonationModal() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('form')
  const [amount, setAmount] = useState<number>(5000)
  const [custom, setCustom] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Ouverture depuis n'importe quel CTA « faire un don ».
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { amount?: number } | undefined
      if (detail?.amount) setAmount(detail.amount)
      setStatus('form')
      setOpen(true)
    }
    window.addEventListener(DONATE_EVENT, onOpen)
    return () => window.removeEventListener(DONATE_EVENT, onOpen)
  }, [])

  // Fermeture au clavier + blocage du scroll de fond.
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

  const handleSubmit = async () => {
    if (!effectiveAmount || effectiveAmount < 100) return

    if (!isFeexPayConfigured()) {
      setStatus('error')
      return
    }

    setStatus('loading')
    try {
      await loadFeexPaySdk(FEEXPAY.sdkUrl)
      if (!window.FeexPayButton || !containerRef.current) throw new Error('SDK indisponible')
      containerRef.current.innerHTML = ''
      window.FeexPayButton.init(FEEX_CONTAINER, {
        id: FEEXPAY.shopId,
        token: FEEXPAY.token,
        amount: effectiveAmount,
        description: FEEXPAY.description,
        mode: FEEXPAY.mode,
        currency: FEEXPAY.currency,
        default_country: FEEXPAY.country,
        custom_id: `afa-${Date.now()}`,
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        callback_url: window.location.origin,
        error_callback_url: window.location.origin,
        callback: () => setStatus('success'),
      })
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  if (!open) return null

  return (
    <div className="donate" role="dialog" aria-modal="true" aria-label="Faire un don">
      <div className="donate__overlay" onClick={() => setOpen(false)} />
      <div className="donate__panel">
        <button className="donate__close" aria-label="Fermer" onClick={() => setOpen(false)}>
          <X size={18} strokeWidth={2} />
        </button>

        {status === 'success' ? (
          <div className="donate__done">
            <span className="donate__kicker">Merci</span>
            <h3 className="donate__title">Votre don est confirmé</h3>
            <p className="donate__lead">
              Merci de soutenir l’audace africaine. Votre contribution fait vivre les
              Africa Fashion Awards 2026.
            </p>
            <button className="btn btn--gold" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <span className="donate__kicker">Faire un don</span>
            <h3 className="donate__title">Soutenez les AFA 2026</h3>
            <p className="donate__lead">
              Chaque contribution accompagne l’émergence des créateurs africains.
              Paiement sécurisé par FeexPay (Mobile Money &amp; carte).
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
                min={100}
                inputMode="numeric"
                placeholder="Autre montant"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </label>

            <div className="donate__grid">
              <label className="donate__field">
                <span>Prénom</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="donate__field">
                <span>Nom</span>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
              <label className="donate__field">
                <span>Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="donate__field">
                <span>Téléphone</span>
                <input
                  type="tel"
                  placeholder="+229 …"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </div>

            <button
              className="btn btn--gold btn--lg donate__submit"
              onClick={handleSubmit}
              disabled={status === 'loading' || !effectiveAmount || effectiveAmount < 100}
            >
              {status === 'loading'
                ? 'Chargement…'
                : `Faire un don de ${formatXOF(effectiveAmount || 0)}`}
            </button>

            {/* Conteneur du bouton de paiement rendu par le SDK FeexPay. */}
            <div id={FEEX_CONTAINER} ref={containerRef} className="donate__feex" />

            {status === 'ready' && (
              <p className="donate__hint">
                Cliquez sur le bouton FeexPay ci-dessus pour finaliser votre paiement.
              </p>
            )}

            {status === 'error' && (
              <p className="donate__notice">
                Le paiement en ligne n’est pas encore disponible. Merci de réessayer un peu
                plus tard.
              </p>
            )}

            <p className="donate__secure">Paiement sécurisé · FeexPay · XOF</p>
          </>
        )}
      </div>
    </div>
  )
}
