import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, X } from 'lucide-react'
import { DONATION_TIERS } from '../config/feexpay'
import './dons.css'

// Page autonome /dons — hors navigation principale.
// Photos : remplacer public/dons/photo-1.jpg, photo-2.jpg, photo-3.jpg
// (mêmes noms, recadrage 3:4). Mettre à jour le texte `alt` en même temps.
// Paiement : montants et liens repris tels quels de src/config/feexpay.ts
// (FeexLink). Aucun lien FedaPay n'existe dans le dépôt.

const CARDS = [
  {
    src: '/dons/photo-1.jpg',
    alt: 'Image de remplacement : blocs graphiques or et ivoire. Photo définitive à venir.',
    caption: 'Être sourd ou muet ne devrait pas être un handicap',
    tone: 'gold',
  },
  {
    src: '/dons/photo-2.jpg',
    alt: 'Image de remplacement : affiche graphique noir et or. Photo définitive à venir.',
    caption: 'Apprendre la langue des signes ouvre la conversation',
    tone: 'ink',
  },
  {
    src: '/dons/photo-3.jpg',
    alt: 'Image de remplacement : cadre graphique évoquant un équipement. Photo définitive à venir.',
    caption: 'Formation et équipement pour avancer avec les autres',
    tone: 'deep',
  },
] as const

const fcfa = new Intl.NumberFormat('fr-FR')

function AmountModal({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const panel = panelRef.current
    panel?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const nodes = [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return createPortal(
    <div className="dons-modal">
      <div className="dons-modal__backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className="dons-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
      >
        <button type="button" className="dons-modal__close" onClick={onClose} aria-label="Fermer">
          <X aria-hidden="true" />
        </button>
        <p className="dons-modal__kicker">FeexPay</p>
        <h2 id={titleId} className="dons-modal__title">
          Choisir un montant
        </h2>
        <p id={descId} className="dons-modal__desc">
          Chaque montant ouvre le lien FeexPay déjà utilisé pour les dons du site.
        </p>
        <ul className="dons-modal__amounts">
          {DONATION_TIERS.map((tier) => {
            const label = fcfa.format(tier.amount)
            return (
              <li key={tier.amount}>
                <a
                  className="dons-modal__amount"
                  href={tier.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-amount={tier.amount}
                  aria-label={`Donner ${label} FCFA via FeexPay, nouvel onglet`}
                >
                  <span className="dons-modal__num">{label}</span>
                  <span className="dons-modal__cur">FCFA</span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>,
    document.body,
  )
}

export default function SolidarityDonsPage() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const previous = document.title
    document.title = 'Soutenons les sourds et muets — Africa Fashion Awards'
    return () => {
      document.title = previous
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (open) {
      root.setAttribute('inert', '')
      wasOpen.current = true
      return
    }
    root.removeAttribute('inert')
    if (wasOpen.current) ctaRef.current?.focus()
  }, [open])

  return (
    <div className="dons" ref={rootRef}>
      <a className="dons__skip" href="#dons-contenu">
        Aller au contenu
      </a>
      <header className="dons__bar">
        <a href="/" className="dons__brand">
          <span className="dons__logo-plate">
            <img src="/dons/logo-afa.svg" alt="" width={64} height={68} />
          </span>
          <span className="dons__word" aria-hidden="true">
            AFA
          </span>
          <span className="dons__sr">Africa Fashion Awards — accueil</span>
        </a>
        <p className="dons__pill" lang="en">
          What we doing
        </p>
        <span className="dons__bar-end" aria-hidden="true" />
      </header>

      <main id="dons-contenu" className="dons__main">
        <h1 className="dons__title">
          Soutenons les
          <br />
          sourds et muets
        </h1>

        <div className="dons__row">
          {CARDS.map((card) => (
            <figure key={card.src} className={`dons__card dons__card--${card.tone}`}>
              <div className="dons__frame">
                <img src={card.src} alt={card.alt} width={900} height={1200} />
              </div>
              <figcaption className="dons__caption">{card.caption}</figcaption>
            </figure>
          ))}
        </div>

        <button
          ref={ctaRef}
          type="button"
          className="dons__cta"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Faire un don
          <span className="dons__cta-icon" aria-hidden="true">
            <ArrowRight />
          </span>
        </button>
      </main>

      {open ? <AmountModal onClose={close} /> : null}
    </div>
  )
}
