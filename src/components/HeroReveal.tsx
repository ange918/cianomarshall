import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { SplitText } from 'gsap/SplitText'
import { smoothScrollTo } from '../lib/nav'

// Enregistrement des plugins + ease au niveau module (une seule fois).
gsap.registerPlugin(CustomEase, SplitText)
CustomEase.create('hop', '.8, 0, .3, 1')

export default function HeroReveal() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let ctx: gsap.Context | undefined
    const splits: SplitText[] = []

    const run = () => {
      if (cancelled || !rootRef.current) return

      ctx = gsap.context((self) => {
        const root = rootRef.current!

        const splitTextElements = (
          selector: string,
          type = 'words,chars',
          addFirstChar = false,
        ) => {
          root.querySelectorAll(selector).forEach((element) => {
            const splitText = new SplitText(element, {
              type,
              wordsClass: 'word',
              charsClass: 'char',
            })
            splits.push(splitText)
            if (type.includes('chars')) {
              splitText.chars.forEach((char, index) => {
                const el = char as HTMLElement
                const originalText = el.textContent ?? ''
                el.innerHTML = `<span>${originalText}</span>`
                if (addFirstChar && index === 0) el.classList.add('first-char')
              })
            }
          })
        }

        splitTextElements('.intro-title h1', 'words, chars', false)
        splitTextElements('.outro-title h1')
        splitTextElements('.tag p', 'words')
        splitTextElements('.card h1', 'words, chars', true)

        const isMobile = window.innerWidth <= 1000

        // Pré-positionnement du duplicata (.split-overlay) sur l'état FINAL du lockup.
        gsap.set(
          [
            '.split-overlay .intro-title .first-char span',
            '.split-overlay .outro-title .char span',
          ],
          { y: '0%' },
        )
        gsap.set('.split-overlay .intro-title .first-char', {
          x: isMobile ? '7.5rem' : '18rem',
          y: isMobile ? '-1rem' : '-2.75rem',
          fontWeight: '900',
          scale: 0.75,
        })
        gsap.set('.split-overlay .outro-title .char', {
          x: '-10rem',
          fontSize: isMobile ? '3rem' : '8rem',
          fontWeight: '600',
        })

        const tags = gsap.utils.toArray<HTMLElement>('.tag')
        const tl = gsap.timeline({ defaults: { ease: 'hop' } })

        // 1. Entrée des tags
        tags.forEach((tag, i) => {
          tl.to(
            tag.querySelectorAll('p .word'),
            { y: '0%', duration: 0.75 },
            0.5 + i * 0.1,
          )
        })

        // 2. Entrée du titre
        tl.to(
          '.preloader .intro-title .char span',
          { y: '0%', duration: 0.75, stagger: 0.05 },
          0.5,
        )

        // 3. Sortie du titre (sauf premier caractère)
        tl.to(
          '.preloader .intro-title .char:not(.first-char) span',
          { y: '100%', duration: 0.75, stagger: 0.05 },
          2,
        )

        // 4. Entrée du « 26 »
        tl.to(
          '.preloader .outro-title .char span',
          { y: '0%', duration: 0.75, stagger: 0.075 },
          2.5,
        )

        // 5. Rapprochement
        tl.to(
          '.preloader .intro-title .first-char',
          { x: isMobile ? '9rem' : '21.25rem', duration: 1 },
          3.5,
        )
        tl.to(
          '.preloader .outro-title .char',
          { x: '-10rem', duration: 1 },
          3.5,
        )

        // 6. Morph en lockup logo
        tl.to(
          '.preloader .intro-title .first-char',
          {
            x: isMobile ? '7.5rem' : '18rem',
            y: isMobile ? '-1rem' : '-2.75rem',
            fontWeight: '900',
            scale: 0.75,
            duration: 0.75,
          },
          4.5,
        )
        tl.to(
          '.preloader .outro-title .char',
          {
            x: '-10rem',
            fontSize: isMobile ? '3rem' : '8rem',
            fontWeight: '600',
            duration: 0.75,
            onComplete: () => {
              // Échange invisible : les deux calques deviennent chacun une moitié.
              self.add(() => {
                gsap.set('.preloader', {
                  clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                })
                gsap.set('.split-overlay', {
                  clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
                })
              })
            },
          },
          4.5,
        )

        // 7. Ouverture de la fente letterbox
        tl.to(
          '.container',
          {
            clipPath: 'polygon(0% 48%, 100% 48%, 100% 52%, 0% 52%)',
            duration: 1,
          },
          5,
        )

        // 8. Sortie des tags
        tags.forEach((tag, i) => {
          tl.to(
            tag.querySelectorAll('p .word'),
            { y: '100%', duration: 0.75 },
            5.5 + i * 0.1,
          )
        })

        // 9. Le split
        tl.to(
          ['.preloader', '.split-overlay'],
          { y: (i: number) => (i === 0 ? '-50%' : '50%'), duration: 1 },
          6,
        )
        tl.to(
          '.container',
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            duration: 1,
          },
          6,
        )
        tl.to(
          '.container .card',
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            duration: 0.75,
          },
          6.25,
        )

        // 10. Entrée du titre de la carte
        tl.to(
          '.container .card h1 .char span',
          { y: '0%', duration: 0.75, stagger: 0.05 },
          6.5,
        )
      }, rootRef)
    }

    // Attendre le chargement de la police pour des mesures de masques correctes.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run)
    } else {
      run()
    }

    return () => {
      cancelled = true
      splits.forEach((s) => s.revert())
      ctx?.revert()
    }
  }, [])

  return (
    <div className="hero-reveal" ref={rootRef}>
      <div className="preloader">
        <div className="intro-title">
          <h1>Africa Fashion Awards</h1>
        </div>
        <div className="outro-title">
          <h1>AFA26</h1>
        </div>
      </div>

      <div className="split-overlay">
        <div className="intro-title">
          <h1>Africa Fashion Awards</h1>
        </div>
        <div className="outro-title">
          <h1>AFA26</h1>
        </div>
      </div>

      <div className="tags-overlay">
        <div className="tag tag-1">
          <p>Audace Créative</p>
        </div>
        <div className="tag tag-2">
          <p>Mode &amp; Beauté</p>
        </div>
        <div className="tag tag-3">
          <p>Tapis Rouge</p>
        </div>
      </div>

      <div className="container">
        <nav>
          <p id="logo">AFA26</p>
          <a
            href="#soutenir"
            className="hero-reveal__cta"
            onClick={(e) => {
              e.preventDefault()
              smoothScrollTo('soutenir')
            }}
          >
            Faire un don
          </a>
        </nav>
        <div className="hero-img">
          <img src="/red-carpet.jpg" alt="Tapis rouge — Africa Fashion Awards" />
        </div>
        <div className="card">
          <p className="card__edition">7ᵉ édition</p>
          <h1>Soutenez AFA&nbsp;26</h1>
        </div>
        <footer>
          <p>Africa Fashion Awards 2026 · 7ᵉ édition</p>
        </footer>
      </div>
    </div>
  )
}
