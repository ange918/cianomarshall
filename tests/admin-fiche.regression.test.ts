import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterEach, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { resolveApiPath } from '../api/_lib/vercel.ts'
import {
  answerSections,
  demandeKeyMatches,
  displayedDemande,
  findDemande,
  type Accreditation,
} from '../src/lib/accreditation/model.ts'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:5000/admin/demandes',
  pretendToBeVisual: true,
})

const { window } = dom
window.scrollTo = () => {}

for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Node',
  'Element',
  'SVGElement',
  'DocumentFragment',
  'MutationObserver',
  'NodeFilter',
  'PopStateEvent',
  'MouseEvent',
  'getComputedStyle',
] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: window[key as 'window'],
  })
}

globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0)
globalThis.cancelAnimationFrame = (id: number) => window.clearTimeout(id)
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function person(): Accreditation {
  return {
    id: 'bb69f7d1-fc02-4634-8e44-6f58897504c5',
    reference: 'AFA26-ACC-0001',
    status: 'nouvelle',
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
    internalNotes: 'Note déjà saisie',
    complementFields: [],
    decisionMessage: '',
    refusalReason: '',
    history: [],
    fullName: 'Amina Kone',
    mediaName: 'Benin Mode',
    role: 'Journaliste',
    phone: '+22961000000',
    email: 'amina@example.com',
    cityCountry: 'Cotonou, Bénin',
    mediaType: 'Presse écrite',
    mediaTypeOther: '',
    mediaLink: 'https://example.com/beninmode',
    socialLinks: '@beninmode',
    coverageTypes: ['Reportage'],
    coverageProject: 'Portrait des finalistes',
    interviews: 'Oui',
    interviewPeople: ['Créateurs'],
    teamSize: '2',
    teamMembers: 'Amina Kone — Journaliste',
    gear: ['Appareil photo'],
    acceptAccuracy: true,
    acceptData: true,
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const roots: { unmount: () => void }[] = []

afterEach(() => {
  for (const root of roots.splice(0)) root.unmount()
  document.body.innerHTML = ''
  window.history.pushState({}, '', '/admin/demandes')
})

test('la fiche affiche les réponses de la liste sans attendre un second chargement réussi', async () => {
  const item = person()
  let releaseDetail: (response: Response) => void = () => {}
  const detailHung = new Promise<Response>((resolve) => {
    releaseDetail = resolve
  })
  let detailCalls = 0

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/accreditations') {
      return jsonResponse({ items: [item], pressCapacity: 150, whatsappConfigured: false })
    }
    if (url.startsWith('/api/accreditations/')) {
      detailCalls += 1
      return detailHung
    }
    return jsonResponse({ error: 'introuvable' }, 404)
  }) as typeof fetch

  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { default: FichePage } = await import('../src/pages/admin/FichePage.tsx')
  const { AdminProvider } = await import('../src/pages/admin/ui.tsx')
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  roots.push(root)

  await React.act(async () => {
    root.render(
      React.createElement(
        AdminProvider,
        { session: { email: 'admin@example.com', name: 'Admin Test', role: 'admin' } },
        React.createElement(FichePage, { id: item.id }),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 40))
  })

  const whileDetailHangs = container.textContent || ''
  assert.equal(detailCalls, 1)
  assert.match(whileDetailHangs, /Portrait des finalistes/)
  assert.match(whileDetailHangs, /Projet de couverture/)

  await React.act(async () => {
    releaseDetail(jsonResponse({ error: 'Service indisponible.' }, 503))
    await new Promise((resolve) => setTimeout(resolve, 40))
  })

  const afterFailure = container.textContent || ''
  assert.match(afterFailure, /Portrait des finalistes/)
  assert.match(afterFailure, /Projet de couverture/)
  assert.match(afterFailure, /Actualisation de la fiche impossible/)
  assert.doesNotMatch(afterFailure, /Chargement de la fiche/)
})

test('un clic sur la ligne ou sur Voir ouvre la fiche', async () => {
  const item = person()
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/accreditations') {
      return jsonResponse({ items: [item], pressCapacity: 150, whatsappConfigured: false })
    }
    return jsonResponse({ error: 'introuvable' }, 404)
  }) as typeof fetch

  window.history.pushState({}, '', '/admin/demandes')
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { default: ListPage } = await import('../src/pages/admin/ListPage.tsx')
  const { AdminProvider } = await import('../src/pages/admin/ui.tsx')
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  roots.push(root)

  await React.act(async () => {
    root.render(
      React.createElement(
        AdminProvider,
        { session: { email: 'admin@example.com', name: 'Admin Test', role: 'admin' } },
        React.createElement(ListPage),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 40))
  })

  const name = [...container.querySelectorAll('b')].find((node) => node.textContent === 'Amina Kone')
  assert.ok(name, 'la ligne du demandeur est absente')
  await React.act(async () => {
    name.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
  })
  assert.equal(window.location.pathname, `/admin/demandes/${item.id}`)

  window.history.pushState({}, '', '/admin/demandes')
  const voir = container.querySelector('a[aria-label="Voir la demande de Amina Kone"]')
  assert.ok(voir, 'le lien Voir est absent')
  await React.act(async () => {
    voir.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
  })
  assert.equal(window.location.pathname, `/admin/demandes/${item.id}`)
})

test('id et référence retrouvent la demande déjà chargée, même si le détail est vide ou périmé', () => {
  const item = person()
  const shown = displayedDemande([item], item.reference.toLowerCase(), null)
  assert.equal(shown?.id, item.id)
  const answers = answerSections(shown || {}).flatMap((section) => section.rows.map((row) => `${row.label} ${row.value}`)).join('\n')
  assert.match(answers, /Projet de couverture/)
  assert.match(answers, /Portrait des finalistes/)

  const other: Accreditation = { ...item, id: 'autre', reference: 'AFA26-ACC-9999', fullName: 'Autre personne', coverageProject: '' }
  assert.equal(displayedDemande([item], item.id, other)?.fullName, 'Amina Kone')

  const thin: Accreditation = { ...item, fullName: '', coverageProject: '   ', mediaLink: '', acceptAccuracy: false }
  const merged = displayedDemande([item], `  ${encodeURIComponent(item.reference)} `, thin)
  assert.equal(merged?.fullName, 'Amina Kone')
  assert.equal(merged?.coverageProject, 'Portrait des finalistes')
  assert.equal(merged?.mediaLink, item.mediaLink)
  assert.equal(merged?.acceptAccuracy, false)

  assert.equal(findDemande([item], 'afa26-acc-0001')?.id, item.id)
  assert.equal(demandeKeyMatches(item, item.id), true)
  assert.equal(findDemande([item], 'AFA26-ACC-0002'), null)
})

test('le chemin API retrouve l’id quand Vercel ne le met que dans la query', () => {
  assert.equal(resolveApiPath('/api/accreditations/deja-dans-le-chemin', { id: 'autre' }).path, '/api/accreditations/deja-dans-le-chemin')
  assert.equal(resolveApiPath('/', { id: 'abc' }).path, '/api/accreditations/abc')
  assert.equal(resolveApiPath('/?id=abc', undefined).path, '/api/accreditations/abc')
  assert.equal(resolveApiPath('/api/accreditations', { id: ['AFA26-ACC-0001', 'ignore'] }).path, '/api/accreditations/AFA26-ACC-0001')
  assert.equal(resolveApiPath('/api/accreditations', { id: 'abc?extra=1' }).path, '/api/accreditations/abc')
  assert.equal(resolveApiPath('/api/accreditations/[id]', { id: 'abc' }).path, '/api/accreditations/abc')
  assert.equal(resolveApiPath('/api/accreditations/%5Bid%5D', { id: 'abc' }).path, '/api/accreditations/abc')
  assert.equal(
    resolveApiPath('https://cianomarshall.vercel.app/api/accreditations?id=ref%201', undefined).path,
    '/api/accreditations/ref%201',
  )
  assert.equal(resolveApiPath('/api/accreditations', undefined).path, '/api/accreditations')
  assert.equal(resolveApiPath('/api/accreditations/export', { id: 'abc' }).path, '/api/accreditations/export')
  assert.equal(resolveApiPath('/api/accreditations/export?statut=nouvelle', undefined).path, '/api/accreditations/export')
})

test('la recherche serveur passe par le même rapprochement id / référence', () => {
  const source = readFileSync(new URL('../api/_lib/dispatch.ts', import.meta.url), 'utf8')
  assert.match(source, /findDemande\(/)
  assert.equal(source.includes('it.id === idOrRef'), false)
  assert.equal(source.includes('item.id === idOrRef'), false)
})
