import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { NAV_LINKS } from '../data/content'
import { navigateTo, smoothScrollTo } from '../lib/nav'
import Logo from './Logo'

const routeId = (href: string) => href.replace(/^#/, '')

export default function Header() {
  const [revealed, setRevealed] = useState(false)

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

  return (
    <header className={`header header--scrolled ${revealed ? '' : 'header--hidden'}`}>
      <div className="header__inner">
        <a
          href="#accueil"
          className="brand"
          onClick={(e) => {
            e.preventDefault()
            smoothScrollTo('accueil')
          }}
          aria-label="Africa Fashion Awards — Accueil"
        >
          <span className="brand__logo-ring">
            <Logo />
          </span>
          <span className="brand__text">
            <span className="brand__mark">Africa Fashion Awards</span>
            <span className="brand__sub">Royal Fashion Event</span>
          </span>
        </a>

        <nav className="nav" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav__link"
              onClick={(e) => {
                e.preventDefault()
                navigateTo(routeId(link.href))
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header__actions">
          <button
            type="button"
            className="btn btn--gold header__cta"
            onClick={() => navigateTo('soutenir')}
          >
            Faire un don
            <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
