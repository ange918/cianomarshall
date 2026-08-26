import { useEffect, useState } from 'react'
import { NAV_LINKS } from '../data/content'
import { navigateTo, smoothScrollTo } from '../lib/nav'
import Logo from './Logo'

const routeId = (href: string) => href.replace(/^#/, '')

export default function Header() {
  const [revealed, setRevealed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // Le header reste masqué pendant l'intro plein écran, puis apparaît
    // une fois la section héro dépassée.
    const onScroll = () => setRevealed(window.scrollY > window.innerHeight * 0.85)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`header header--scrolled ${revealed ? '' : 'header--hidden'}`}>
      <div className="header__inner">
        <a
          href="#accueil"
          className="brand"
          onClick={(e) => {
            e.preventDefault()
            closeMenu()
            smoothScrollTo('accueil')
          }}
          aria-label="Africa Fashion Awards — Accueil"
        >
          <Logo className="brand__logo" />
          <span className="brand__text">
            <span className="brand__mark">AFA</span>
            <span className="brand__sub">Royal Fashion Event</span>
          </span>
        </a>

        <nav className={`nav ${menuOpen ? 'nav--open' : ''}`} aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav__link"
              onClick={(e) => {
                e.preventDefault()
                closeMenu()
                navigateTo(routeId(link.href))
              }}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            className="btn btn--gold nav__cta"
            onClick={() => {
              closeMenu()
              navigateTo('soutenir')
            }}
          >
            Faire un don
          </button>
        </nav>

        <div className="header__actions">
          <button
            type="button"
            className="btn btn--gold header__cta"
            onClick={() => navigateTo('soutenir')}
          >
            Soutenir / Faire un don
          </button>
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
