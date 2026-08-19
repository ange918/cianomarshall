import { EVENT } from '../data/content'

export default function Hero() {
  return (
    <section id="accueil" className="hero">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__inner">
        <p className="hero__eyebrow">{EVENT.edition} · {EVENT.date}</p>

        <h1 className="hero__title">
          Africa Fashion Awards<span className="hero__year"> 2026</span>
          <span className="hero__theme">{EVENT.theme}</span>
        </h1>

        <p className="hero__lead">
          Célébration de la création, du courage esthétique et de l’excellence de la
          mode et de la beauté africaine.
        </p>

        <div className="hero__meta">
          <span className="hero__meta-item">
            <span className="hero__meta-label">Date</span>
            {EVENT.date}
          </span>
          <span className="hero__meta-divider" aria-hidden="true" />
          <span className="hero__meta-item">
            <span className="hero__meta-label">Présentation</span>
            Tapis Rouge
          </span>
        </div>

        <div className="hero__actions">
          <a href="#soutenir" className="btn btn--gold btn--lg">
            Faire un don pour l’événement
          </a>
          <a href="#evenement" className="btn btn--ghost btn--lg">
            Découvrir les AFA
          </a>
        </div>
      </div>
    </section>
  )
}
