import { TrendingUp, Newspaper, Sparkles, Scissors, Users } from 'lucide-react'
import { ADVANTAGES, IMPACTS } from '../data/content'
import DonateCta from './DonateCta'

const IMPACT_ICONS = [TrendingUp, Newspaper, Sparkles]
const ADVANTAGE_ICONS = [Scissors, Users]

export default function Impact() {
  return (
    <section id="impact" className="section impact">
      <div className="container">
        <div className="section__head">
          <span className="section__kicker">Impact &amp; Avantages</span>
          <h2 className="section__title">Un rayonnement à 360°</h2>
          <p className="section__intro">
            Digital, médiatique et personnel : chaque participation aux AFA génère des
            retombées concrètes et durables.
          </p>
        </div>

        <div className="impact__row">
          {IMPACTS.map((impact, i) => {
            const Icon = IMPACT_ICONS[i] ?? TrendingUp
            return (
              <article key={impact.title} className="impact-card">
                <span className="impact-card__icon" aria-hidden="true">
                  <Icon size={26} strokeWidth={1.75} />
                </span>
                <h3 className="impact-card__title">{impact.title}</h3>
                <p className="impact-card__desc">{impact.description}</p>
              </article>
            )
          })}
        </div>

        <div className="advantages">
          {ADVANTAGES.map((group, i) => {
            const Icon = ADVANTAGE_ICONS[i] ?? Scissors
            return (
            <article key={group.audience} className="advantage-card">
              <header className="advantage-card__head">
                <span className="advantage-card__icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <h3 className="advantage-card__title">{group.audience}</h3>
              </header>
              <ul className="advantage-card__list">
                {group.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
            )
          })}
        </div>

        <DonateCta hint="Amplifiez ce rayonnement — devenez donateur." />
      </div>
    </section>
  )
}
