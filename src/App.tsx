import Header from './components/Header'
import HeroReveal from './components/HeroReveal'
import About from './components/About'
import Theme from './components/Theme'
import Impact from './components/Impact'
import Process from './components/Process'
import Support from './components/Support'
import Footer from './components/Footer'

export default function App() {
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
    </>
  )
}
