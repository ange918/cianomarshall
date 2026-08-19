import { EVENT } from '../data/content'

const HONORED = [
  'Stylistes',
  'Mannequins',
  'Photographes',
  'Maquilleurs',
  'Influenceurs',
]

export default function About() {
  return (
    <section id="evenement" className="section about">
      <div className="container">
        <div className="section__head">
          <span className="section__kicker">À propos</span>
          <h2 className="section__title">Qu’est-ce que les Africa Fashion Awards&nbsp;?</h2>
        </div>

        <div className="about__grid">
          <div className="about__text">
            <p>
              Les <strong>Africa Fashion Awards (AFA)</strong> sont la plus grande cérémonie
              de récompenses dédiée aux acteurs de la mode et de la beauté africaine. Créés
              par <strong>{EVENT.founder}</strong> sous la bannière de{' '}
              <strong>{EVENT.organizer}</strong>, les AFA honorent chaque année celles et ceux
              qui font rayonner la mode africaine à travers le continent et au-delà.
            </p>
            <p>
              En 2026, les AFA célèbrent leur <strong>{EVENT.edition}</strong> le{' '}
              <strong>{EVENT.date}</strong>, avec pour thème&nbsp;:{' '}
              <span className="text-gold">L’ÈRE DES AUDACIEUX</span>.
            </p>

            <div className="about__honored">
              <span className="about__honored-label">Les corps de métier honorés</span>
              <ul className="chips">
                {HONORED.map((role) => (
                  <li key={role} className="chip">
                    {role}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="about__stats" aria-label="Chiffres clés">
            <div className="stat-card">
              <span className="stat-card__num">6<sup>e</sup></span>
              <span className="stat-card__label">Édition 2026</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__num">15 Nov.</span>
              <span className="stat-card__label">Grande soirée &amp; Tapis Rouge</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__num">5+</span>
              <span className="stat-card__label">Corps de métier récompensés</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
