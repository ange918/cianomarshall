import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import Header from './components/Header'
import HeroReveal from './components/HeroReveal'
import TrustMarquee from './components/TrustMarquee'
import About from './components/About'
import Theme from './components/Theme'
import Impact from './components/Impact'
import Process from './components/Process'
import Support from './components/Support'
import Footer from './components/Footer'
import FloatingContact from './components/FloatingContact'
import PageCurtain from './components/PageCurtain'
import AccreditationPage from './pages/AccreditationPage'
import AccreditationConfirm from './pages/AccreditationConfirm'
import AdminApp from './pages/admin/AdminApp'
import { initCopy } from './lib/copyReveal'
import { setLenis, smoothScrollTo } from './lib/nav'
import { usePathname } from './lib/router'

gsap.registerPlugin(SplitText, ScrollTrigger)

const COPY_SELECTOR = '.section__title, .section__intro'

function Landing() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let cancelled = false
    const splits: SplitText[] = []

    const lenis = new Lenis()
    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)
    const pumpLenis = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(pumpLenis)
    gsap.ticker.lagSmoothing(0)

    let self: gsap.Context
    const ctx = gsap.context((ctxSelf) => {
      self = ctxSelf
    }, rootRef)

    document.fonts.ready.then(() => {
      if (cancelled || !rootRef.current) return
      self.add(() => {
        const root = rootRef.current!
        root.querySelectorAll<HTMLElement>(COPY_SELECTOR).forEach((el) => {
          splits.push(...initCopy(el))
        })
        root.querySelectorAll<HTMLElement>('.about__text').forEach((el) => {
          el.setAttribute('data-copy-wrapper', 'true')
          splits.push(...initCopy(el))
        })
      })
    })

    const hash = window.location.hash.replace('#', '')
    if (hash) window.setTimeout(() => smoothScrollTo(hash), 600)

    return () => {
      cancelled = true
      ctx.revert()
      splits.forEach((s) => s.revert())
      gsap.ticker.remove(pumpLenis)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  return (
    <>
      <Header />
      <main ref={rootRef}>
        <HeroReveal />
        <TrustMarquee />
        <About />
        <Theme />
        <Impact />
        <Process />
        <Support />
      </main>
      <Footer />
      <FloatingContact />
      <PageCurtain />
    </>
  )
}

export default function App() {
  const path = usePathname()
  if (path.startsWith('/admin')) return <AdminApp />
  if (path.startsWith('/accreditation/confirmation')) return <AccreditationConfirm />
  if (path.startsWith('/accreditation')) return <AccreditationPage />
  return <Landing />
}
