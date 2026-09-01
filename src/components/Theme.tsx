import { AUDACE_PILLARS } from '../data/content'
import DonateCta from './DonateCta'

export default function Theme() {
  return (
    <section id="thematique" className="section theme">
      <div className="container">
        <div className="section__head">
          <span className="section__kicker">Thématique 2026</span>
          <h2 className="section__title">
            <span className="theme__word">Audace</span>
          </h2>
          <p className="section__intro">
            AUDACE est l’expression de la liberté créative, du courage esthétique et de la
            capacité à surprendre. Cette année, le tapis rouge sera une scène où l’originalité,
            l’excès maîtrisé et l’affirmation de soi prendront vie. Nous voulons que chaque
            création soit une déclaration forte, un geste qui ose bousculer les codes établis.
          </p>
        </div>

        <div className="theme__grid">
          {AUDACE_PILLARS.map((pillar, i) => (
            <article key={pillar.title} className="pillar-card">
              <span className="pillar-card__index">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="pillar-card__title">{pillar.title}</h3>
              <p className="pillar-card__desc">{pillar.description}</p>
            </article>
          ))}
        </div>

        <ul className="theme__goals" aria-label="Objectifs du Tapis Rouge">
          <li>Valoriser la créativité des stylistes.</li>
          <li>Générer du contenu viral efficace.</li>
          <li>Créer un moment mémorable.</li>
          <li>Attirer l’attention des médias.</li>
        </ul>

        <DonateCta hint="Soutenez l’audace créative africaine." />
      </div>
    </section>
  )
}
