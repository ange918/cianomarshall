import { navigateTo } from '../lib/nav'

type Props = {
  label?: string
  hint?: string
}

// Appel à l'action « Faire un don » réutilisé en fin de section pour ramener
// le visiteur vers la section de dons FeexPay (#soutenir).
export default function DonateCta({ label = 'Faire un don', hint }: Props) {
  return (
    <div className="section__cta">
      {hint && <p className="section__cta-hint">{hint}</p>}
      <a
        href="#soutenir"
        className="btn btn--gold btn--lg"
        onClick={(e) => {
          e.preventDefault()
          navigateTo('soutenir')
        }}
      >
        {label}
      </a>
    </div>
  )
}
