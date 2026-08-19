import { EVENT } from '../data/content'
import Logo from './Logo'
import HeroVisual from './HeroVisual'

const HIGHLIGHTS = [
  'La plus grande cérémonie de la mode et de la beauté africaine',
  'Une célébration du courage esthétique et de l’audace créative',
  'Un Tapis Rouge transformé en laboratoire d’art vivant',
]

export default function Hero() {
  return (
    <section id="accueil" className="hero">
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__inner">
        <Logo className="hero__logo" />

        <p className="hero__eyebrow">
          {EVENT.edition} · {EVENT.date}
        </p>

        <h1 className="hero__title">
          Africa Fashion Awards<span className="hero__year"> 2026</span>
          <span className="hero__theme">{EVENT.theme}</span>
        </h1>

        <ul className="hero__highlights">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="hero__highlight">
              <span className="hero__check" aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="hero__actions">
          <a href="#soutenir" className="btn btn--gold btn--lg">
            Faire un don pour l’événement
          </a>
          <a href="#evenement" className="btn btn--ghost btn--lg">
            Découvrir les AFA
          </a>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}
