import { CONTACT, SUPPORT_TIERS } from '../data/content'
import { openDonation } from '../lib/donate'

export default function Support() {
  return (
    <section id="soutenir" className="section support">
      <div className="support__glow" aria-hidden="true" />
      <div className="container">
        <div className="section__head">
          <span className="section__kicker">Appel aux dons &amp; soutien</span>
          <h2 className="section__title">Soutenez l’audace africaine</h2>
          <p className="section__intro">
            Soutenir financièrement les Africa Fashion Awards, c’est accompagner l’émergence
            des créateurs et faire rayonner la culture africaine bien au-delà du continent.
            Chaque contribution donne vie à une scène où la mode devient un art vivant.
          </p>
        </div>

        <div className="support__tiers">
          {SUPPORT_TIERS.map((tier) => (
            <article
              key={tier.name}
              className={`tier-card ${tier.featured ? 'tier-card--featured' : ''}`}
            >
              {tier.featured && <span className="tier-card__badge">Privilégié</span>}
              <h3 className="tier-card__name">{tier.name}</h3>
              <span className="tier-card__audience">{tier.audience}</span>
              <p className="tier-card__desc">{tier.description}</p>
              {tier.action === 'donate' ? (
                <button
                  type="button"
                  className="tier-card__link"
                  onClick={() => openDonation(tier.suggested)}
                >
                  Je m’engage →
                </button>
              ) : (
                <a href={CONTACT.emailHref} className="tier-card__link">
                  Je m’engage →
                </a>
              )}
            </article>
          ))}
        </div>

        <div className="support__direct">
          <p className="support__direct-label">Modes d’action directs</p>
          <div className="support__direct-actions">
            <a href={CONTACT.phoneHref} className="action-btn">
              <span className="action-btn__icon" aria-hidden="true">📱</span>
              <span className="action-btn__body">
                <span className="action-btn__title">Mobile Money / Téléphone</span>
                <span className="action-btn__value">{CONTACT.phone}</span>
              </span>
            </a>
            <a href={CONTACT.emailHref} className="action-btn">
              <span className="action-btn__icon" aria-hidden="true">✉️</span>
              <span className="action-btn__body">
                <span className="action-btn__title">Email / Partenariats</span>
                <span className="action-btn__value">{CONTACT.email}</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
