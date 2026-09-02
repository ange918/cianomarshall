import { MessageSquare, Sparkles, ShieldCheck, Send } from 'lucide-react'
import { PROCESS_STEPS } from '../data/content'
import DonateCta from './DonateCta'

// Une icône par étape (dans l'ordre de PROCESS_STEPS).
const METHOD_ICONS = [MessageSquare, Sparkles, ShieldCheck, Send]

export default function Process() {
  return (
    <section id="parcours" className="section process">
      <div className="container">
        <div className="section__head">
          <span className="section__kicker">Méthode</span>
          <h2 className="section__title">Votre chemin vers le Tapis Rouge</h2>
        </div>

        <ol className="method__steps">
          {PROCESS_STEPS.map((step, i) => {
            const Icon = METHOD_ICONS[i] ?? MessageSquare
            const right = i % 2 === 1
            return (
              <li
                key={step.number}
                className={`method__step${right ? ' method__step--right' : ''}`}
              >
                <div className="method__num-card">
                  <span className="method__num">{step.number}</span>
                  <span className="method__num-label">Étape</span>
                </div>
                <div className="method__body-card">
                  <span className="method__icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <h3 className="method__title">{step.title}</h3>
                  <p className="method__desc">{step.description}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <DonateCta hint="Faites partie de l’aventure — soutenez les AFA." />
      </div>
    </section>
  )
}
