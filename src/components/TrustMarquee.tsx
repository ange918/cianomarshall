import { PARTNERS } from '../data/content'

// Bandeau défilant « ils soutiennent l'audace ».
// La piste est dupliquée deux fois pour une boucle sans couture (-50%).
export default function TrustMarquee() {
  const items = [...PARTNERS, ...PARTNERS]

  return (
    <section className="marquee" aria-label="Partenaires et soutiens">
      <p className="marquee__label">Ils soutiennent l’audace</p>
      <div className="marquee__viewport">
        <div className="marquee__track">
          {items.map((name, i) => (
            <span className="marquee__item" key={`${name}-${i}`} aria-hidden={i >= PARTNERS.length}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
