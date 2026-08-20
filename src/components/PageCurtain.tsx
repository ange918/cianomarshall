import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { NAV_EVENT, scrollToId } from '../lib/nav'

const EASE = 'power4.inOut'

export default function PageCurtain() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let transitioning = false

    const ctx = gsap.context((self) => {
      // Ferme le rideau : les blocs grandissent (haut vers le bas / bas vers le
      // haut) colonne par colonne jusqu'à couvrir l'écran.
      self.add(
        'closeCurtain',
        () =>
          new Promise<void>((resolve) => {
            gsap.set('.curtain__block', { visibility: 'visible', scaleY: 0 })
            gsap.to('.curtain__block', {
              scaleY: 1,
              duration: 0.9,
              stagger: { each: 0.09, from: 'start', grid: [2, 5], axis: 'x' },
              ease: EASE,
              onComplete: resolve,
            })
          }),
      )
      // Ouvre le rideau : les blocs se rétractent vers les bords.
      self.add(
        'openCurtain',
        () =>
          new Promise<void>((resolve) => {
            gsap.set('.curtain__block', { scaleY: 1 })
            gsap.to('.curtain__block', {
              scaleY: 0,
              duration: 0.9,
              stagger: { each: 0.09, from: 'start', grid: [2, 5], axis: 'x' },
              ease: EASE,
              onComplete: resolve,
            })
          }),
      )
    }, rootRef)

    const onNavigate = (e: Event) => {
      const id = (e as CustomEvent).detail?.id as string | undefined
      if (id === undefined || transitioning) return
      transitioning = true
      const c = ctx as unknown as {
        closeCurtain: () => Promise<void>
        openCurtain: () => Promise<void>
      }
      c.closeCurtain()
        .then(() => {
          if (cancelled) return
          scrollToId(id)
          return c.openCurtain()
        })
        .then(() => {
          if (cancelled) return
          gsap.set('.curtain__block', { visibility: 'hidden' })
          transitioning = false
        })
    }

    window.addEventListener(NAV_EVENT, onNavigate)

    return () => {
      cancelled = true
      window.removeEventListener(NAV_EVENT, onNavigate)
      ctx.revert()
    }
  }, [])

  return (
    <div className="curtain" ref={rootRef} aria-hidden="true">
      <div className="curtain__row curtain__row--top">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`t${i}`} className="curtain__block" />
        ))}
      </div>
      <div className="curtain__row curtain__row--bottom">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`b${i}`} className="curtain__block" />
        ))}
      </div>
    </div>
  )
}
