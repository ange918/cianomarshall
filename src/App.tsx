import { useEffect } from 'react'
import gsap from 'gsap'
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

export default function App() {
  useEffect(() => {
    // Scroll fluide (Lenis) piloté par le ticker GSAP — une seule instance.
    // Pas d'effet de scroll répétitif : le défilement reste sobre et propre.
    const lenis = new Lenis({ autoRaf: false })
    const pumpLenis = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(pumpLenis)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(pumpLenis)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Header />
      <main>
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
