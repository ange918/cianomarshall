import { useEffect, useState } from 'react'
import { NAV_LINKS } from '../data/content'
import Logo from './Logo'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner">
        <a href="#accueil" className="brand" onClick={closeMenu} aria-label="Africa Fashion Awards — Accueil">
          <Logo className="brand__logo" />
          <span className="brand__text">
            <span className="brand__mark">AFA</span>
            <span className="brand__sub">Royal Fashion Event</span>
          </span>
        </a>

        <nav className={`nav ${menuOpen ? 'nav--open' : ''}`} aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav__link" onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <a href="#soutenir" className="btn btn--gold nav__cta" onClick={closeMenu}>
            Faire un don
          </a>
        </nav>

        <div className="header__actions">
          <a href="#soutenir" className="btn btn--gold header__cta">
            Soutenir / Faire un don
          </a>
          <button
            type="button"
            className={`burger ${menuOpen ? 'burger--open' : ''}`}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
