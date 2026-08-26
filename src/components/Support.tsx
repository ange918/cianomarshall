import { DONATION_TIERS } from '../config/feexpay'

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function Support() {
  const pay = (link: string) => window.open(link, '_blank', 'noopener,noreferrer')

  return (
    <section id="soutenir" className="section support">
      <div className="support__glow" aria-hidden="true" />
      <div className="container">
        <div className="section__head">
          <span className="section__kicker">Appel aux dons &amp; soutien</span>
          <h2 className="section__title">Faites un don</h2>
          <p className="section__intro">
            Soutenir financièrement les Africa Fashion Awards, c’est accompagner l’émergence
            des créateurs et faire rayonner la culture africaine. Choisissez un montant : vous
            serez redirigé vers la page de paiement sécurisée FeexPay (Mobile Money ou carte),
            où vous validez avec votre code.
          </p>
        </div>

        <div className="donate__amounts support__amounts">
          {DONATION_TIERS.map((tier) => (
            <button
              key={tier.amount}
              type="button"
              className="donate__amount"
              onClick={() => pay(tier.link)}
            >
              {formatXOF(tier.amount)}
            </button>
          ))}
        </div>

        <p className="donate__secure">Paiement sécurisé · FeexPay · XOF</p>
      </div>
    </section>
  )
}
