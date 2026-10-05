import { Mail, Phone, Share2 } from 'lucide-react'
import { DONATION_TIERS } from '../config/feexpay'
import { CONTACT, SUPPORT_TIERS } from '../data/content'
import { smoothScrollTo } from '../lib/nav'

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function Support() {
  const pay = (link: string) => window.open(link, '_blank', 'noopener,noreferrer')
  const suggested = DONATION_TIERS.find((tier) => tier.amount === 50000) ?? DONATION_TIERS[0]

  return (
    <section id="soutenir" className="section support">
      <div className="support__glow" aria-hidden="true" />
      <div className="container">
        <div className="section__head">
          <span className="section__kicker">Appel aux dons &amp; soutien</span>
          <h2 className="section__title">Faites un don</h2>
          <p className="section__intro">
            Soutenir financièrement les Africa Fashion Awards, c’est accompagner l’émergence
            des créateurs et faire rayonner la culture africaine. Choisissez un montant : vous
            serez redirigé vers la page de paiement sécurisée FeexPay (Mobile Money ou carte),
            où vous validez avec votre code.
          </p>
        </div>

        <div className="support__tiers">
          {SUPPORT_TIERS.map((tier) => {
            const featured = Boolean(tier.featured)
            const price =
              tier.name === 'Don Libre'
                ? 'Dès 1 000 FCFA'
                : tier.suggested
                  ? `Suggéré ${formatXOF(tier.suggested)}`
                  : 'Sur devis'
            const label =
              tier.action === 'email' ? 'Nous écrire' : tier.featured ? 'Devenir mécène' : 'Je donne'
            const onClick = () => {
              if (tier.action === 'email') {
                window.location.href = CONTACT.emailHref
                return
              }
              if (tier.suggested && suggested) {
                pay(suggested.link)
                return
              }
              smoothScrollTo('montants')
            }
            return (
              <article key={tier.name} className={`tier-card${featured ? ' tier-card--featured' : ''}`}>
                {featured ? <span className="tier-card__badge">Recommandé</span> : null}
                <p className="tier-card__audience">{tier.audience}</p>
                <h3 className="tier-card__name">{tier.name}</h3>
                <p className="tier-card__desc">{tier.description}</p>
                <p className="tier-card__price">{price}</p>
                <button type="button" className="tier-card__link" onClick={onClick}>
                  {label} <span aria-hidden="true">→</span>
                </button>
              </article>
            )
          })}
        </div>

        <div className="donate__amounts support__amounts" id="montants">
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

        <div className="support__direct" style={{ marginTop: '2rem' }}>
          <p className="support__direct-label">Contacts directs</p>
          <div className="support__direct-actions">
            <a className="action-btn" href={CONTACT.phoneHref}>
              <span className="action-btn__icon">
                <Phone size={18} />
              </span>
              <span className="action-btn__body">
                <span className="action-btn__title">Téléphone · Mobile Money</span>
                <span className="action-btn__value">{CONTACT.phone}</span>
              </span>
            </a>
            <a className="action-btn" href={CONTACT.emailHref}>
              <span className="action-btn__icon">
                <Mail size={18} />
              </span>
              <span className="action-btn__body">
                <span className="action-btn__title">Partenariats</span>
                <span className="action-btn__value">{CONTACT.email}</span>
              </span>
            </a>
            <div className="action-btn">
              <span className="action-btn__icon">
                <Share2 size={18} />
              </span>
              <span className="action-btn__body">
                <span className="action-btn__title">Réseaux sociaux</span>
                <span className="action-btn__value">{CONTACT.social}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
