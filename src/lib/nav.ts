// Bus de navigation interne : les liens de nav déclenchent le rideau de
// transition, qui se charge de défiler (sous couverture) vers la section.
import type Lenis from 'lenis'

export const NAV_EVENT = 'afa:navigate'

let lenisInstance: Lenis | null = null

export function setLenis(l: Lenis | null) {
  lenisInstance = l
}

// Défilement instantané (joué pendant que le rideau couvre l'écran).
export function scrollToId(id: string) {
  if (!id || id === 'accueil') {
    lenisInstance?.scrollTo(0, { immediate: true })
    if (!lenisInstance) window.scrollTo(0, 0)
    return
  }
  const el = document.getElementById(id)
  if (!el) return
  if (lenisInstance) lenisInstance.scrollTo(el, { immediate: true })
  else el.scrollIntoView()
}

export function navigateTo(id: string) {
  window.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: { id } }))
}

// Défilement fluide SANS rideau — utilisé par les contrôles du héro
// (logo/accueil, « Scroll Down »), que la transition ne doit pas concerner.
export function smoothScrollTo(id: string) {
  if (!id || id === 'accueil') {
    if (lenisInstance) lenisInstance.scrollTo(0)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const el = document.getElementById(id)
  if (!el) return
  if (lenisInstance) lenisInstance.scrollTo(el)
  else el.scrollIntoView({ behavior: 'smooth' })
}
