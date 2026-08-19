import { PROCESS_STEPS } from '../data/content'

export default function Process() {
  return (
    <section id="parcours" className="section process">
      <div className="container">
        <div className="section__head">
          <span className="section__kicker">Parcours des participants</span>
          <h2 className="section__title">Votre chemin vers le Tapis Rouge</h2>
        </div>

        <ol className="process__steps">
          {PROCESS_STEPS.map((step) => (
            <li key={step.number} className="step-card">
              <span className="step-card__num">{step.number}</span>
              <div className="step-card__body">
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__desc">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
