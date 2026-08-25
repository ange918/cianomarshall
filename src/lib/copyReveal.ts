import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Révèle un bloc de texte ligne par ligne : SplitText découpe en lignes,
// chaque ligne est masquée (overflow) et glisse depuis le bas (y 100% → 0%)
// avec un stagger de 0.1s, déclenché une fois à 75% du viewport.
export function initCopy(container: HTMLElement): SplitText[] {
  const animateOnScroll = container.dataset.copyScroll !== 'false'
  const delay = parseFloat(container.dataset.copyDelay || '0')

  const targets = container.hasAttribute('data-copy-wrapper')
    ? (Array.from(container.children) as HTMLElement[])
    : [container]

  const splits: SplitText[] = []
  const lines: Element[] = []

  targets.forEach((element) => {
    const split = SplitText.create(element, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line++',
      lineThreshold: 0.1,
    })
    splits.push(split)

    // Report du text-indent sur la première ligne uniquement.
    const textIndent = getComputedStyle(element).textIndent
    if (textIndent && textIndent !== '0px' && split.lines.length) {
      ;(split.lines[0] as HTMLElement).style.paddingLeft = textIndent
      element.style.textIndent = '0'
    }

    lines.push(...split.lines)
  })

  gsap.set(lines, { y: '100%' })

  const props: gsap.TweenVars = {
    y: '0%',
    duration: 1,
    stagger: 0.1,
    ease: 'power4.out',
    delay,
  }

  if (animateOnScroll) {
    gsap.to(lines, {
      ...props,
      scrollTrigger: { trigger: container, start: 'top 75%', once: true },
    })
  } else {
    gsap.to(lines, props)
  }

  return splits
}

export { ScrollTrigger }
