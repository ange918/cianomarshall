import { useEffect, useRef } from 'react'
import gsap from 'gsap'
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

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Smooth scroll piloté par le ticker GSAP (une seule instance Lenis).
    const lenis = new Lenis({ autoRaf: false })
    const pumpLenis = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(pumpLenis)
    gsap.ticker.lagSmoothing(0)

    // Bascule 30° → 0° au scroll pour chaque section post-héro (toutes tailles).
    const ctx = gsap.context(() => {
      const sections = rootRef.current!.querySelectorAll<HTMLElement>('section.section')
      sections.forEach((section) => {
        const container = section.querySelector('.container')
        gsap.to(container, {
          rotation: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 20%',
            scrub: true,
          },
        })
      })
    }, rootRef)

    // Épinglage / empilement « card-deck » — desktop uniquement (évite tout
    // rognage de contenu sur petits écrans où les sections s'allongent).
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1001px)', () => {
      const sections = rootRef.current!.querySelectorAll<HTMLElement>('section.section')
      sections.forEach((section, index) => {
        if (index === sections.length - 1) return
        ScrollTrigger.create({
          trigger: section,
          start: 'bottom bottom',
          end: 'bottom top',
          pin: true,
          pinSpacing: false,
        })
      })
    })

    return () => {
      gsap.ticker.remove(pumpLenis)
      lenis.destroy()
      mm.revert()
      ctx.revert()
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
    </>
  )
}
