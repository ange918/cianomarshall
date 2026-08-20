import { CONTACT, EVENT, NAV_LINKS } from '../data/content'
import { navigateTo } from '../lib/nav'
import Logo from './Logo'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__brand-row">
            <Logo className="footer__logo" />
            <span className="brand__mark">AFA</span>
          </div>
          <p className="footer__tagline">
            Africa Fashion Awards — {EVENT.theme}. La plus grande cérémonie de la mode et de
            la beauté africaine, portée par {EVENT.organizer}.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Navigation du pied de page">
          <span className="footer__col-title">Navigation</span>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="footer__link"
              onClick={(e) => {
                e.preventDefault()
                navigateTo(link.href.replace(/^#/, ''))
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="footer__contact">
          <span className="footer__col-title">Contact</span>
          <a href={CONTACT.phoneHref} className="footer__link">{CONTACT.phone}</a>
          <a href={CONTACT.emailHref} className="footer__link">{CONTACT.email}</a>
          <span className="footer__social">{CONTACT.social}</span>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {year} {EVENT.organizer}. Tous droits réservés.</p>
        <p>Créé par {EVENT.founder}.</p>
      </div>
    </footer>
  )
}
