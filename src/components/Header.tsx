import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight } from 'lucide-react'
import { CONTACT, EVENT, NAV_LINKS } from '../data/content'
import { goTo, navigateTo, setScrollLocked, subscribeScroll } from '../lib/nav'
import { usePathname } from '../lib/router'
import Logo from './Logo'

const routeId = (href: string) => href.replace(/^#/, '')

function daysUntilEvent() {
  const event = new Date('2026-11-15T00:00:00+01:00').getTime()
  return Math.max(0, Math.ceil((event - Date.now()) / 86_400_000))
}

export default function Header({ solid = false }: { solid?: boolean }) {
  const pathname = usePathname()
  const [revealed, setRevealed] = useState(solid)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    if (solid) {
      setRevealed(true)
      return
    }
    const onScroll = () => setRevealed(window.scrollY > window.innerHeight * 0.85)
    onScroll()
    const unsubscribe = subscribeScroll(onScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      unsubscribe()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [solid])

  useEffect(() => {
    if (pathname !== '/') return
    const nodes = NAV_LINKS.map((link) => document.getElementById(routeId(link.href))).filter(
      (node): node is HTMLElement => Boolean(node),
    )
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) setActive(visible.target.id)
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: [0.15, 0.4] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    setScrollLocked(open)
    return () => setScrollLocked(false)
  }, [open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const follow = (href: string) => {
    setOpen(false)
    if (href.startsWith('/')) {
      goTo(href)
      return
    }
    const id = routeId(href)
    if (window.location.pathname !== '/') {
      window.location.assign(`/#${id}`)
      return
    }
    navigateTo(id)
  }

  return (
    <header className={`header header--scrolled${revealed ? '' : ' header--hidden'}`}>
      <div className="header__inner">
        <a
          href={pathname === '/' ? '#accueil' : '/'}
          className="brand"
          onClick={(event) => {
            event.preventDefault()
            setOpen(false)
            if (pathname !== '/') goTo('/')
            else navigateTo('accueil')
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
              href={pathname === '/' ? link.href : `/${link.href}`}
              className={`nav__link${active === routeId(link.href) ? ' is-active' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                follow(link.href)
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header__actions">
          {pathname === '/' ? (
            <span className="header__date">
              <b>J-{daysUntilEvent()}</b> · {EVENT.date.replace('Novembre', '11').replace(/\s/g, '.')}
            </span>
          ) : (
            <a
              className={`btn btn--ghost btn--sm header__acc${pathname.startsWith('/accreditation') ? ' is-active' : ''}`}
              href="/accreditation"
              onClick={(event) => {
                event.preventDefault()
                follow('/accreditation')
              }}
            >
              Accréditation médias
            </a>
          )}
          <button type="button" className="btn btn--gold header__cta" onClick={() => follow('#soutenir')}>
            Faire un don
            <ArrowUpRight aria-hidden="true" />
          </button>
          <button type="button" className="btn btn--gold btn--sm header__cta-compact" onClick={() => follow('#soutenir')}>
            Don
          </button>
          <button
            type="button"
            className={`burger${open ? ' burger--open' : ''}`}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {open
        ? createPortal(
            <div className="drawer" role="dialog" aria-label="Menu">
              <span className="label-xs">
                Menu · 7<sup>e</sup> édition
              </span>
              <div className="drawer__links">
                {NAV_LINKS.map((link, index) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`drawer__link${active === routeId(link.href) ? ' is-active' : ''}`}
                    onClick={(event) => {
                      event.preventDefault()
                      follow(link.href)
                    }}
                  >
                    {link.label}
                    <small>{String(index + 1).padStart(2, '0')}</small>
                  </a>
                ))}
              </div>
              <div className="drawer__foot">
                <button type="button" className="btn btn--gold btn--lg btn--block" onClick={() => follow('#soutenir')}>
                  Faire un don
                  <ArrowUpRight aria-hidden="true" />
                </button>
                <a
                  className="btn btn--ghost btn--lg btn--block"
                  href="/accreditation"
                  onClick={(event) => {
                    event.preventDefault()
                    follow('/accreditation')
                  }}
                >
                  Accréditation médias
                </a>
                <div className="drawer__contact">
                  <span>{CONTACT.phone}</span>
                  <span className="text-gold">J-{daysUntilEvent()}</span>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  )
}
