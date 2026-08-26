import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { FeexPayProvider, FeexPayButton } from '@feexpay/react-sdk'
import '@feexpay/react-sdk/style.css'
import { AMOUNT_MAX, AMOUNT_MIN, DONATION_PRESETS } from '../config/feexpay'
import { DONATE_EVENT } from '../lib/donate'

type Cfg = { id: string; token: string }

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function DonationModal() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<number>(5000)
  const [custom, setCustom] = useState('')
  const [firstName, setFirstName] = useState('')
  const [done, setDone] = useState(false)
  const [cfg, setCfg] = useState<Cfg | null>(null)
  const [cfgError, setCfgError] = useState('')
  const [customId] = useState(
    () => `afa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  )

  // Ouverture depuis n'importe quel CTA « faire un don ».
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { amount?: number } | undefined
      if (detail?.amount) setAmount(detail.amount)
      setDone(false)
      setOpen(true)
    }
    window.addEventListener(DONATE_EVENT, onOpen)
    return () => window.removeEventListener(DONATE_EVENT, onOpen)
  }, [])

  // Fermeture clavier + blocage du scroll.
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

  // Charge id + token depuis notre backend (variables serveur existantes).
  useEffect(() => {
    if (!open || cfg || cfgError) return
    let cancelled = false
    fetch('/api/feexpay/config')
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (cancelled) return
        if (!r.ok || !d.token || !d.id) {
          setCfgError(d.error || 'Paiement momentanément indisponible.')
        } else {
          setCfg({ id: d.id, token: d.token })
        }
      })
      .catch(() => {
        if (!cancelled) setCfgError('Impossible de charger le paiement. Réessayez.')
      })
    return () => {
      cancelled = true
    }
  }, [open, cfg, cfgError])

  if (!open) return null

  const close = () => setOpen(false)
  const effectiveAmount = custom ? Math.max(0, Math.round(Number(custom))) : amount
  const amountValid = effectiveAmount >= AMOUNT_MIN && effectiveAmount <= AMOUNT_MAX

  return (
    <div className="donate" role="dialog" aria-modal="true" aria-label="Faire un don">
      <div className="donate__overlay" onClick={close} />
      <div className="donate__panel">
        <button className="donate__close" aria-label="Fermer" onClick={close}>
          <X size={18} strokeWidth={2} />
        </button>

        {done ? (
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
        ) : (
          <>
            <span className="donate__kicker">Faire un don</span>
            <h3 className="donate__title">Soutenez les AFA 2026</h3>
            <p className="donate__lead">
              Choisissez un montant. Le paiement Mobile Money (MTN, Moov, Celtiis) est géré en
              toute sécurité par FeexPay.
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

            <label className="donate__field">
              <span>Prénom (optionnel)</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>

            <div className="donate__pay">
              {cfgError ? (
                <div className="donate__notice">
                  <p>Le paiement en ligne est momentanément indisponible.</p>
                  <p className="donate__reason">{cfgError}</p>
                </div>
              ) : !cfg ? (
                <button className="btn btn--gold btn--lg donate__submit" disabled>
                  Chargement du paiement…
                </button>
              ) : !amountValid ? (
                <button className="btn btn--gold btn--lg donate__submit" disabled>
                  Choisissez un montant valide
                </button>
              ) : (
                <FeexPayProvider>
                  <FeexPayButton
                    key={effectiveAmount}
                    amount={effectiveAmount}
                    description="Don Africa Fashion Awards 2026"
                    id={cfg.id}
                    token={cfg.token}
                    customId={customId}
                    callback_url={
                      typeof window !== 'undefined'
                        ? window.location.origin
                        : 'https://africafashionawards.com'
                    }
                    callback_info={{
                      description: 'Don Africa Fashion Awards 2026',
                      fullname: firstName || 'Donateur',
                    }}
                    mode="LIVE"
                    currency="XOF"
                    buttonText={`Faire un don de ${formatXOF(effectiveAmount)}`}
                    buttonClass="btn btn--gold btn--lg donate__submit"
                    callback={(response: { status?: string }) => {
                      const s = String(response?.status ?? '').toUpperCase()
                      if (s === 'SUCCESSFUL' || s === 'SUCCESS') setDone(true)
                    }}
                  />
                </FeexPayProvider>
              )}
            </div>

            <p className="donate__secure">Paiement sécurisé · FeexPay · XOF</p>
          </>
        )}
      </div>
    </div>
  )
}
