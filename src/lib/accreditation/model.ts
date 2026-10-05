// Contrat partagé (formulaire public + API + back-office).
// 6 sections, 18 questions — formulations du brief maquette AFA 2026.

export const MEDIA_TYPES = [
  'Presse écrite',
  'Télévision',
  'Radio',
  'Média en ligne',
  'Média/page spécialisée mode',
  'Photographe',
  'Vidéaste',
  'Créateur de contenu',
  'Influenceur',
  'Autre',
] as const

export const COVERAGE_TYPES = [
  'Reportage',
  'Interview',
  'Photographie',
  'Vidéo',
  'Couverture réseaux sociaux',
  'Live',
  'Portraits/interviews finalistes',
  'Autre',
] as const

export const INTERVIEW_ANSWERS = ['Oui', 'Non', 'À confirmer'] as const

export const PEOPLE_TYPES = [
  'Finalistes',
  'Designers/stylistes',
  'Mannequins',
  'Personnalités/invités',
  'Organisateurs',
  'Partenaires',
  'Autre',
] as const

export const TEAM_SIZES = ['1', '2', '3', '4', 'Plus de 4'] as const

export const GEAR_TYPES = [
  'Appareil photo',
  'Caméra vidéo',
  'Smartphone',
  'Trépied',
  'Stabilisateur/Gimbal',
  'Microphone',
  'Éclairage',
  'Autre',
] as const

export const ENGAGEMENT_17 =
  'Je certifie l’exactitude des informations fournies et je comprends que l’envoi de ce formulaire ne vaut pas confirmation automatique d’accréditation.'

export const ENGAGEMENT_18 =
  'J’autorise l’organisation des Africa Fashion Awards à traiter les informations fournies dans le cadre de la gestion des accréditations.'

export const TEAM_NOTE =
  'Important : listez chaque personne à accréditer (nom + fonction). Seules les personnes nommées ici recevront un badge — une même accréditation ne permet pas d’arriver accompagné de membres non déclarés.'

export const SECTIONS = [
  { id: 1, title: 'Identification', hint: 'Tous les champs sont obligatoires', questions: 6 },
  { id: 2, title: 'Profil média', hint: 'Votre média et votre présence en ligne', questions: 3 },
  { id: 3, title: 'Couverture', hint: 'Ce que vous prévoyez de couvrir', questions: 4 },
  { id: 4, title: 'Équipe', hint: 'Qui sera présent le 15 novembre', questions: 2 },
  { id: 5, title: 'Matériel', hint: 'Pour préparer l’espace presse', questions: 1 },
  { id: 6, title: 'Engagement', hint: 'Obligatoire pour envoyer', questions: 2 },
] as const

export const PRESS_CAPACITY_DEFAULT = 150

export type Status = 'nouvelle' | 'approuvee' | 'refusee' | 'complement'

export const STATUS_LABEL: Record<Status, string> = {
  nouvelle: 'Nouvelle',
  approuvee: 'Approuvée',
  refusee: 'Refusée',
  complement: 'Complément demandé',
}

export const STATUS_ORDER: Status[] = ['nouvelle', 'approuvee', 'refusee', 'complement']

export type HistoryEntry = {
  at: string
  actor: string
  action: string
  detail?: string
}

export type WhatsAppLog = {
  at: string
  channel: 'whatsapp'
  to: string
  ok: boolean
  provider: string
  error?: string
}

export type FormValues = {
  fullName: string
  mediaName: string
  role: string
  phone: string
  email: string
  cityCountry: string
  mediaType: string
  mediaTypeOther: string
  mediaLink: string
  socialLinks: string
  coverageTypes: string[]
  coverageProject: string
  interviews: string
  interviewPeople: string[]
  teamSize: string
  teamMembers: string
  gear: string[]
  acceptAccuracy: boolean
  acceptData: boolean
}

export type Accreditation = FormValues & {
  id: string
  reference: string
  status: Status
  createdAt: string
  updatedAt: string
  internalNotes: string
  complementFields: string[]
  decisionMessage: string
  refusalReason: string
  history: HistoryEntry[]
  notifications?: WhatsAppLog[]
}

export type TeamMember = { name: string; role: string }

export const REFUSAL_REASONS: { id: string; label: string; message: string }[] = [
  {
    id: 'capacite',
    label: 'Capacité de l’espace presse atteinte',
    message:
      'Bonjour, la capacité de l’espace presse est atteinte pour cette édition. Nous ne pouvons pas donner suite à votre demande.',
  },
  {
    id: 'lien',
    label: 'Lien média non vérifiable',
    message:
      'Bonjour, nous n’avons pas pu vérifier le lien média communiqué. Nous ne pouvons donc pas donner suite à votre demande pour cette édition.',
  },
  {
    id: 'projet',
    label: 'Projet de couverture insuffisant',
    message:
      'Bonjour, le projet de couverture communiqué ne nous permet pas de donner suite à votre demande pour cette édition.',
  },
  {
    id: 'autre',
    label: 'Autre motif',
    message:
      'Bonjour, nous ne pouvons pas donner suite à votre demande d’accréditation pour cette édition.',
  },
]

export const COMPLEMENT_FIELDS = [
  '8. Lien média / site / page pro',
  '11. Projet de couverture',
  '15. Noms et fonctions de l’équipe',
  'Autre précision',
] as const

export function emptyForm(): FormValues {
  return {
    fullName: '',
    mediaName: '',
    role: '',
    phone: '',
    email: '',
    cityCountry: '',
    mediaType: '',
    mediaTypeOther: '',
    mediaLink: '',
    socialLinks: '',
    coverageTypes: [],
    coverageProject: '',
    interviews: '',
    interviewPeople: [],
    teamSize: '',
    teamMembers: '',
    gear: [],
    acceptAccuracy: false,
    acceptData: false,
  }
}

export function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full.trim()
}

export function mediaTypeLabel(a: Pick<FormValues, 'mediaType' | 'mediaTypeOther'>) {
  if (a.mediaType === 'Autre' && a.mediaTypeOther.trim()) return a.mediaTypeOther.trim()
  return a.mediaType || '—'
}

export function mediaTypeShort(label: string) {
  if (label === 'Média/page spécialisée mode') return 'Média/page mode'
  return label
}

export function parseTeam(text: string): TeamMember[] {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.replace(/^\d+\s*[.)]\s*/, '')
      const parts = cleaned.split(/\s+[—–-]\s+/)
      return {
        name: (parts[0] || cleaned).trim(),
        role: (parts[1] || '').trim(),
      }
    })
    .filter((m) => m.name)
}

export function teamCount(a: Pick<FormValues, 'teamSize' | 'teamMembers'>) {
  const lines = parseTeam(a.teamMembers).length
  if (a.teamSize === 'Plus de 4') return Math.max(5, lines)
  const n = Number(a.teamSize)
  if (Number.isFinite(n) && n > 0) return n
  return lines
}

export function initials(name: string) {
  const parts = name.replace(/^@/, '').split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? '?'
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase()
}

export function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Porto-Novo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('day')}/${get('month')} · ${get('hour')}:${get('minute')}`
}

export function dayKey(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Porto-Novo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function pickList(values: string[], allowed: readonly string[]) {
  const set = new Set(allowed)
  return values.filter((v) => set.has(v))
}

function looksLikeLink(value: string) {
  const s = value.trim()
  if (!s) return false
  try {
    const url = new URL(s.includes('://') ? s : `https://${s}`)
    return url.hostname.includes('.')
  } catch {
    return false
  }
}

export function normalizeForm(input: Partial<FormValues>): FormValues {
  const base = emptyForm()
  const str = (v: unknown, max: number) =>
    String(v ?? '')
      .replace(/\u0000/g, '')
      .trim()
      .slice(0, max)
  return {
    ...base,
    fullName: str(input.fullName, 160),
    mediaName: str(input.mediaName, 180),
    role: str(input.role, 160),
    phone: str(input.phone, 40),
    email: str(input.email, 180).toLowerCase(),
    cityCountry: str(input.cityCountry, 160),
    mediaType: str(input.mediaType, 80),
    mediaTypeOther: str(input.mediaTypeOther, 120),
    mediaLink: str(input.mediaLink, 400),
    socialLinks: str(input.socialLinks, 2000),
    coverageTypes: pickList(Array.isArray(input.coverageTypes) ? input.coverageTypes.map(String) : [], COVERAGE_TYPES),
    coverageProject: str(input.coverageProject, 4000),
    interviews: INTERVIEW_ANSWERS.includes(input.interviews as (typeof INTERVIEW_ANSWERS)[number])
      ? String(input.interviews)
      : '',
    interviewPeople: pickList(
      Array.isArray(input.interviewPeople) ? input.interviewPeople.map(String) : [],
      PEOPLE_TYPES,
    ),
    teamSize: TEAM_SIZES.includes(input.teamSize as (typeof TEAM_SIZES)[number]) ? String(input.teamSize) : '',
    teamMembers: str(input.teamMembers, 4000),
    gear: pickList(Array.isArray(input.gear) ? input.gear.map(String) : [], GEAR_TYPES),
    acceptAccuracy: Boolean(input.acceptAccuracy),
    acceptData: Boolean(input.acceptData),
  }
}

export function validateForm(values: FormValues): Record<string, string> {
  const e: Record<string, string> = {}
  const req = (key: keyof FormValues) => {
    const v = values[key]
    if (typeof v === 'string' && !v.trim()) e[key] = 'Ce champ est obligatoire.'
  }
  ;(['fullName', 'mediaName', 'role', 'phone', 'email', 'cityCountry'] as const).forEach(req)
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    e.email = 'Adresse e-mail invalide.'
  }
  if (values.phone && values.phone.replace(/\D/g, '').length < 8) {
    e.phone = 'Numéro invalide.'
  }
  if (!values.mediaType || !MEDIA_TYPES.includes(values.mediaType as (typeof MEDIA_TYPES)[number])) {
    e.mediaType = 'Choisissez un type de média.'
  }
  if (values.mediaType === 'Autre' && !values.mediaTypeOther.trim()) {
    e.mediaTypeOther = 'Précisez le type de média.'
  }
  if (!values.mediaLink.trim()) e.mediaLink = 'Ce champ est obligatoire.'
  else if (!looksLikeLink(values.mediaLink)) e.mediaLink = 'Indiquez un lien valide.'
  if (!values.coverageProject.trim()) e.coverageProject = 'Ce champ est obligatoire.'
  if (!values.acceptAccuracy) e.acceptAccuracy = 'Cet engagement est obligatoire.'
  if (!values.acceptData) e.acceptData = 'Cet engagement est obligatoire.'
  return e
}

const SECTION_KEYS: Record<number, string[]> = {
  1: ['fullName', 'mediaName', 'role', 'phone', 'email', 'cityCountry'],
  2: ['mediaType', 'mediaTypeOther', 'mediaLink'],
  3: ['coverageProject'],
  4: [],
  5: [],
  6: ['acceptAccuracy', 'acceptData'],
}

export function sectionErrors(values: FormValues, section: number) {
  const all = validateForm(values)
  const keys = SECTION_KEYS[section] ?? []
  const out: Record<string, string> = {}
  for (const k of keys) if (all[k]) out[k] = all[k]
  return out
}

export function sectionComplete(values: FormValues, section: number) {
  if (section === 4) return Boolean(values.teamSize || values.teamMembers.trim())
  if (section === 5) return values.gear.length > 0
  return Object.keys(sectionErrors(values, section)).length === 0 && sectionHasSignal(values, section)
}

function sectionHasSignal(values: FormValues, section: number) {
  if (section === 1) return Boolean(values.fullName.trim())
  if (section === 2) return Boolean(values.mediaType)
  if (section === 3) return Boolean(values.coverageProject.trim())
  if (section === 6) return values.acceptAccuracy && values.acceptData
  return true
}

export function progressRatio(values: FormValues) {
  const done = SECTIONS.filter((s) => sectionComplete(values, s.id)).length
  return done / SECTIONS.length
}

export function approveMessage(a: Pick<Accreditation, 'fullName' | 'teamSize' | 'teamMembers'>) {
  const n = teamCount(a)
  const people = n > 1 ? `${n} personnes` : n === 1 ? '1 personne' : 'votre équipe'
  return `Bonjour ${firstName(a.fullName)}, votre accréditation pour les Africa Fashion Awards 2026 est confirmée (${people}). Vos badges nominatifs et les consignes d’accès vous seront envoyés avant le 15 novembre.`
}

export function complementMessage(fullName: string, fields: string[]) {
  const list = fields.length ? fields.join(', ') : 'les éléments signalés'
  return `Bonjour ${firstName(fullName)}, merci de préciser les informations suivantes : ${list}.`
}

export type StatRow = { label: string; count: number }
export type DayPoint = { key: string; label: string; count: number }

export type Stats = {
  total: number
  nouvelle: number
  approuvee: number
  refusee: number
  complement: number
  week: number
  badges: number
  refusedRatio: number
  byMedia: StatRow[]
  byCoverage: StatRow[]
  byDay: DayPoint[]
  capacityUsed: number
  peak: number
}

export function computeStats(items: Accreditation[], now = new Date()): Stats {
  const count = (s: Status) => items.filter((i) => i.status === s).length
  const todayKey = dayKey(now.toISOString())
  const weekKeys = new Set<string>()
  const dayPoints: DayPoint[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000)
    const key = dayKey(d.toISOString())
    const label = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Africa/Porto-Novo',
      day: 'numeric',
    }).format(d)
    dayPoints.push({ key, label, count: 0 })
    if (i < 7) weekKeys.add(key)
  }
  // Le jour courant est inclus dans les 7 derniers.
  weekKeys.add(todayKey)

  const media = new Map<string, number>()
  const coverage = new Map<string, number>()
  let badges = 0
  let capacityUsed = 0
  let week = 0

  for (const item of items) {
    const type = mediaTypeShort(mediaTypeLabel(item))
    media.set(type, (media.get(type) ?? 0) + 1)
    for (const c of item.coverageTypes) coverage.set(c, (coverage.get(c) ?? 0) + 1)
    const n = teamCount(item)
    if (item.status === 'approuvee') {
      badges += n
      capacityUsed += n
    }
    const k = dayKey(item.createdAt)
    const point = dayPoints.find((p) => p.key === k)
    if (point) point.count += 1
    if (weekKeys.has(k)) week += 1
  }

  const byMedia = [...media.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
  const byCoverage = [...coverage.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
  const total = items.length
  const refusee = count('refusee')
  const peak = dayPoints.reduce((m, p) => Math.max(m, p.count), 0)

  return {
    total,
    nouvelle: count('nouvelle'),
    approuvee: count('approuvee'),
    refusee,
    complement: count('complement'),
    week,
    badges,
    refusedRatio: total ? Math.round((refusee / total) * 100) : 0,
    byMedia,
    byCoverage,
    byDay: dayPoints,
    capacityUsed,
    peak,
  }
}

export function normalizePerson(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function duplicateNames(item: Accreditation, all: Accreditation[]) {
  const mine = parseTeam(item.teamMembers).map((m) => normalizePerson(m.name))
  const hits = new Set<string>()
  for (const other of all) {
    if (other.id === item.id) continue
    for (const member of parseTeam(other.teamMembers)) {
      const key = normalizePerson(member.name)
      if (key && mine.includes(key)) hits.add(member.name)
    }
  }
  return [...hits]
}

export function toCsv(items: Accreditation[]) {
  const headers = [
    'Référence',
    'Statut',
    'Nom',
    'Fonction',
    'Média',
    'Type de média',
    'E-mail',
    'Téléphone',
    'Ville / Pays',
    'Équipe',
    'Personnes',
    'Reçue le',
  ]
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const lines = items.map((item) =>
    [
      item.reference,
      STATUS_LABEL[item.status],
      item.fullName,
      item.role,
      item.mediaName,
      mediaTypeLabel(item),
      item.email,
      item.phone,
      item.cityCountry,
      teamCount(item),
      item.teamMembers.replace(/\s*\n\s*/g, ' | '),
      formatWhen(item.createdAt),
    ]
      .map(cell)
      .join(';'),
  )
  return `\uFEFF${headers.map(cell).join(';')}\n${lines.join('\n')}\n`
}
