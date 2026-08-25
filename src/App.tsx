import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import Header from './components/Header'
import HeroReveal from './components/HeroReveal'
import About from './components/About'
import Theme from './components/Theme'
import Impact from './components/Impact'
import Process from './components/Process'
import Support from './components/Support'
import Footer from './components/Footer'
import DonationModal from './components/DonationModal'
import PageCurtain from './components/PageCurtain'
import { initCopy } from './lib/copyReveal'
import { setLenis } from './lib/nav'

gsap.registerPlugin(SplitText, ScrollTrigger)

// Éléments dont le texte se révèle ligne par ligne.
const COPY_SELECTOR = '.section__title, .section__intro'

export default function App() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let cancelled = false
    const splits: SplitText[] = []

    // Scroll fluide (Lenis) piloté par le ticker GSAP — une seule instance.
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

    // Attendre le chargement des polices pour un découpage de lignes correct.
    document.fonts.ready.then(() => {
      if (cancelled || !rootRef.current) return
      self.add(() => {
        const root = rootRef.current!
        root.querySelectorAll<HTMLElement>(COPY_SELECTOR).forEach((el) => {
          splits.push(...initCopy(el))
        })
        // Les paragraphes « À propos » se révèlent en cascade continue.
        root.querySelectorAll<HTMLElement>('.about__text').forEach((el) => {
          el.setAttribute('data-copy-wrapper', 'true')
          splits.push(...initCopy(el))
        })
      })
    })

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
        <About />
        <Theme />
        <Impact />
        <Process />
        <Support />
      </main>
      <Footer />
      <DonationModal />
      <PageCurtain />
    </>
  )
}
