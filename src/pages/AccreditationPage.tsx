import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Phone,
  Send,
} from 'lucide-react'
import { CONTACT, EVENT } from '../data/content'
import { ApiError, api } from '../lib/api'
import {
  COVERAGE_TYPES,
  ENGAGEMENT_17,
  ENGAGEMENT_18,
  MEDIA_TYPES,
  PEOPLE_TYPES,
  QUESTION_COUNT,
  SECTIONS,
  TEAM_NOTE,
  TEAM_SIZES,
  emptyForm,
  progressRatio,
  sectionErrors,
  validateForm,
  type FormValues,
} from '../lib/accreditation/model'
import { navigate } from '../lib/router'
import Header from '../components/Header'
import Footer from '../components/Footer'

const DRAFT_KEY = 'afa-acc-draft-v1'
const CONFIRM_KEY = 'afa-acc-confirmation'

type Confirmation = {
  reference: string
  statusLabel: string
  fullName: string
  mediaName: string
  teamCount: number
}

function daysUntilEvent() {
  const event = new Date('2026-11-15T00:00:00+01:00').getTime()
  return Math.max(0, Math.ceil((event - Date.now()) / 86_400_000))
}

function Field({
  n,
  label,
  required,
  hint,
  error,
  children,
  full,
}: {
  n: number
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
  full?: boolean
}) {
  return (
    <div className={`field${full ? ' full' : ''}`} id={`f-${n}`}>
      <span>
        <b>{n}.</b> {label}
        {required ? <i className="req">*</i> : null}
        {hint ? <em> — {hint}</em> : null}
      </span>
      {children}
      {error ? <span className="field__err">{error}</span> : null}
    </div>
  )
}

function Choices({
  options,
  value,
  onChange,
  multiple,
}: {
  options: readonly string[]
  value: string | string[]
  onChange: (next: string | string[]) => void
  multiple?: boolean
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : []
  return (
    <div className="choice" role={multiple ? 'group' : 'radiogroup'}>
      {options.map((option) => {
        const on = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            className={on ? 'on' : ''}
            aria-pressed={on}
            onClick={() => {
              if (multiple) {
                const list = selected.includes(option)
                  ? selected.filter((item) => item !== option)
                  : [...selected, option]
                onChange(list)
              } else {
                onChange(option)
              }
            }}
          >
            <i className={multiple ? `cb${on ? ' on' : ''}` : `radio${on ? ' on' : ''}`} aria-hidden="true">
              {on && multiple ? <Check size={12} strokeWidth={3} /> : null}
            </i>
            {option}
          </button>
        )
      })}
    </div>
  )
}

export default function AccreditationPage() {
  const [values, setValues] = useState<FormValues>(emptyForm)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)
  const [currentSection, setCurrentSection] = useState(1)

  useEffect(() => {
    document.title = 'Accréditation médias — Africa Fashion Awards 2026'
    document.body.classList.add('page-acc')
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw) as { values?: FormValues; step?: number }
        if (draft.values) setValues({ ...emptyForm(), ...draft.values })
        if (draft.step) setStep(Math.min(Math.max(1, draft.step), SECTIONS.length))
        setDraftSaved(true)
      }
    } catch {
      // brouillon illisible : on repart d'un formulaire vide
    }
    return () => document.body.classList.remove('page-acc')
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step }))
      setDraftSaved(true)
    }, 400)
    return () => window.clearTimeout(id)
  }, [values, step])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.fs'))
    if (!nodes.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const id = Number((visible?.target as HTMLElement | undefined)?.dataset.section)
        if (id) setCurrentSection(id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.2, 0.6] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const ratio = progressRatio(values)
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const stepErrorCount = useMemo(() => Object.keys(sectionErrors(values, step)).length, [values, step])
  const sectionCount = SECTIONS.length

  const goStep = (next: number) => {
    if (next > step) {
      const found = sectionErrors(values, step)
      if (Object.keys(found).length) {
        setErrors((prev) => ({ ...prev, ...found }))
        return
      }
    }
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    const found = validateForm(values)
    setErrors(found)
    if (Object.keys(found).length) {
      const firstSection = SECTIONS.find((section) =>
        Object.keys(sectionErrors(values, section.id)).length,
      )
      if (firstSection) setStep(firstSection.id)
      setFormError('Complétez les champs obligatoires avant d’envoyer.')
      const firstKey = Object.keys(found)[0]
      document.getElementById(`f-${fieldNumber(firstKey)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setBusy(true)
    setFormError('')
    try {
      const result = await api<Confirmation>('/api/accreditations', {
        method: 'POST',
        body: JSON.stringify(submissionPayload(values)),
      })
      const confirmation: Confirmation = {
        reference: result.reference,
        statusLabel: result.statusLabel,
        fullName: result.fullName,
        mediaName: result.mediaName,
        teamCount: result.teamCount,
      }
      sessionStorage.setItem(CONFIRM_KEY, JSON.stringify(confirmation))
      localStorage.removeItem(DRAFT_KEY)
      navigate(`/accreditation/confirmation?ref=${encodeURIComponent(result.reference)}`)
    } catch (error) {
      if (error instanceof ApiError && error.errors) setErrors(error.errors)
      setFormError(error instanceof Error ? error.message : 'Envoi impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Header solid />
      <main className="acc">
        <section className="acc-hero">
          <div className="acc-hero__bg" aria-hidden="true" />
          <div className="container">
            <p className="acc-hero__crumbs">
              Accueil / <b>Accréditation médias</b>
            </p>
            <div className="acc-hero__row">
              <div>
                <span className="acc-kicker">AFA 2026 · Presse &amp; créateurs</span>
                <h1>
                  Accréditation <span className="gold-text">médias</span>
                </h1>
                <p>
                  Journalistes, photographes, vidéastes, créateurs de contenu : demandez votre
                  accréditation pour couvrir le tapis rouge et la cérémonie de la 7<sup>e</sup> édition.
                </p>
              </div>
              <div className="acc-hero__facts">
                <div>
                  <span>Événement</span>
                  <b>15.11.2026</b>
                </div>
                <div>
                  <span>Lieu</span>
                  <b>{EVENT.venue}</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container acc-layout">
          <aside className="acc-aside">
            <div className="acc-box">
              <h3>Progression</h3>
              <ol className="acc-steps-nav">
                {SECTIONS.map((section) => {
                  const done = isSectionDone(values, section.id)
                  const current = section.id === currentSection
                  return (
                    <li key={section.id} className={current ? 'is-current' : ''}>
                      <a href={`#s${section.id}`}>
                        <span className={done ? 'done' : current ? 'now' : ''}>
                          {done ? <Check size={12} strokeWidth={3} /> : section.id}
                        </span>
                        <em>{section.title}</em>
                        <small>{section.questions} q.</small>
                      </a>
                    </li>
                  )
                })}
              </ol>
              <div className="acc-bar">
                <i style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>
              <p className="note">
                {Math.round(ratio * 100)} % complété
                {draftSaved ? ' · brouillon enregistré' : ''}
              </p>
            </div>
            <div className="acc-box">
              <h3>Après l’envoi</h3>
              <ol className="acc-steps">
                <li>
                  <i>1</i>
                  <div>
                    <b>Accusé de réception</b>
                    <span>La demande apparaît aussitôt au statut Nouvelle.</span>
                  </div>
                </li>
                <li>
                  <i>2</i>
                  <div>
                    <b>Examen par l’équipe AFA</b>
                    <span>Pas de confirmation automatique.</span>
                  </div>
                </li>
                <li>
                  <i>3</i>
                  <div>
                    <b>Décision &amp; badge</b>
                    <span>Badge nominatif par personne accréditée.</span>
                  </div>
                </li>
              </ol>
            </div>
            <div className="acc-box">
              <h3>Une question ?</h3>
              <ul className="acc-list">
                <li>
                  <Phone size={16} />
                  <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                </li>
                <li>
                  <Mail size={16} />
                  <a href={CONTACT.emailHref}>{CONTACT.email}</a>
                </li>
              </ul>
              <p className="note">J-{daysUntilEvent()} · {EVENT.date}</p>
            </div>
          </aside>

          <form
            className="form-card acc-wizard"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
            noValidate
          >
            <div className="form-card__top">
              <span className="label-xs">Formulaire d’accréditation · {QUESTION_COUNT} questions</span>
              <div className="form-progress">
                Section {currentSection} / {sectionCount}
                {SECTIONS.map((section) => (
                  <i key={section.id} className={section.id <= currentSection ? 'on' : ''} />
                ))}
              </div>
            </div>

            <div className="acc-mobile-progress">
              <div>
                <b>{SECTIONS[step - 1]?.title}</b>
                <span>
                  {step} / {sectionCount}
                </span>
              </div>
              <div className="acc-bar">
                <i style={{ width: `${(step / sectionCount) * 100}%` }} />
              </div>
            </div>

            {stepErrorCount > 0 && Object.keys(sectionErrors(values, step)).some((key) => errors[key]) ? (
              <p className="acc-alert">
                <AlertCircle size={16} />
                {stepErrorCount} champ{stepErrorCount > 1 ? 's' : ''} obligatoire{stepErrorCount > 1 ? 's' : ''} à
                compléter avant de continuer.
              </p>
            ) : null}

            <section className={`fs${step === 1 ? ' is-current' : ''}`} id="s1" data-section="1">
              <div className="fs__head">
                <span className="fs__num">01</span>
                <h3 className="fs__title">Identification</h3>
                <span className="fs__hint">Tous les champs sont obligatoires</span>
              </div>
              <div className="fgrid">
                <Field n={1} label="Nom et prénom" required error={errors.fullName}>
                  <input className={`input${errors.fullName ? ' is-error' : ''}`} value={values.fullName} placeholder="Ex. Prénom Nom" onChange={(e) => set('fullName', e.target.value)} />
                </Field>
                <Field n={2} label="Nom du média / de la structure" required error={errors.mediaName}>
                  <input className={`input${errors.mediaName ? ' is-error' : ''}`} value={values.mediaName} placeholder="Ex. Bénin Mode Mag" onChange={(e) => set('mediaName', e.target.value)} />
                </Field>
                <Field n={3} label="Fonction" required error={errors.role}>
                  <input className={`input${errors.role ? ' is-error' : ''}`} value={values.role} placeholder="Ex. Journaliste, photographe…" onChange={(e) => set('role', e.target.value)} />
                </Field>
                <Field n={4} label="Numéro WhatsApp / téléphone" required error={errors.phone}>
                  <input className={`input${errors.phone ? ' is-error' : ''}`} value={values.phone} inputMode="tel" placeholder="+229 01 00 00 00 00" onChange={(e) => set('phone', e.target.value)} />
                </Field>
                <Field n={5} label="Adresse e-mail" required error={errors.email}>
                  <input className={`input${errors.email ? ' is-error' : ''}`} type="email" value={values.email} placeholder="vous@media.com" onChange={(e) => set('email', e.target.value)} />
                </Field>
                <Field n={6} label="Ville / Pays" required error={errors.cityCountry}>
                  <input className={`input${errors.cityCountry ? ' is-error' : ''}`} value={values.cityCountry} placeholder="Ex. Cotonou, Bénin" onChange={(e) => set('cityCountry', e.target.value)} />
                </Field>
              </div>
            </section>

            <section className={`fs${step === 2 ? ' is-current' : ''}`} id="s2" data-section="2">
              <div className="fs__head">
                <span className="fs__num">02</span>
                <h3 className="fs__title">Profil média</h3>
                <span className="fs__hint">Votre média et votre présence en ligne</span>
              </div>
              <div className="fgrid">
                <Field n={7} label="Type de média" required hint="choix unique" error={errors.mediaType || errors.mediaTypeOther} full>
                  <Choices options={MEDIA_TYPES} value={values.mediaType} onChange={(next) => set('mediaType', String(next))} />
                  {values.mediaType === 'Autre' ? (
                    <input
                      className={`input other${errors.mediaTypeOther ? ' is-error' : ''}`}
                      placeholder="Si « Autre », précisez…"
                      value={values.mediaTypeOther}
                      onChange={(e) => set('mediaTypeOther', e.target.value)}
                    />
                  ) : null}
                </Field>
                <Field n={8} label="Liens réseaux sociaux pro" full>
                  <textarea className="input textarea" value={values.socialLinks} placeholder={'Un lien par ligne (Instagram, TikTok, Facebook, YouTube…)'} onChange={(e) => set('socialLinks', e.target.value)} />
                </Field>
              </div>
            </section>

            <section className={`fs${step === 3 ? ' is-current' : ''}`} id="s3" data-section="3">
              <div className="fs__head">
                <span className="fs__num">03</span>
                <h3 className="fs__title">Couverture</h3>
                <span className="fs__hint">Ce que vous prévoyez de couvrir</span>
              </div>
              <div className="fgrid">
                <Field n={9} label="Type(s) de couverture" hint="plusieurs choix possibles" full>
                  <Choices options={COVERAGE_TYPES} value={values.coverageTypes} multiple onChange={(next) => set('coverageTypes', next as string[])} />
                </Field>
                <Field n={10} label="Quels types de personnes prévoyez-vous d’interviewer ?" hint="plusieurs choix possibles" full>
                  <Choices options={PEOPLE_TYPES} value={values.interviewPeople} multiple onChange={(next) => set('interviewPeople', next as string[])} />
                </Field>
              </div>
            </section>

            <section className={`fs${step === 4 ? ' is-current' : ''}`} id="s4" data-section="4">
              <div className="fs__head">
                <span className="fs__num">04</span>
                <h3 className="fs__title">Équipe</h3>
                <span className="fs__hint">Qui sera présent le 15 novembre</span>
              </div>
              <div className="fgrid">
                <Field n={11} label="Nombre de personnes à accréditer" full>
                  <Choices options={TEAM_SIZES} value={values.teamSize} onChange={(next) => set('teamSize', String(next))} />
                </Field>
                <Field n={12} label="Noms et fonctions de l’équipe" full>
                  <p className="notice">
                    <AlertCircle size={16} />
                    <span>{TEAM_NOTE}</span>
                  </p>
                  <textarea className="input textarea" value={values.teamMembers} placeholder={'1. Nom Prénom — Fonction\n2. Nom Prénom — Fonction'} onChange={(e) => set('teamMembers', e.target.value)} />
                </Field>
              </div>
            </section>

            <section className={`fs${step === 5 ? ' is-current' : ''}`} id="s5" data-section="5">
              <div className="fs__head">
                <span className="fs__num">05</span>
                <h3 className="fs__title">Engagement</h3>
                <span className="fs__hint">Obligatoire pour envoyer</span>
              </div>
              <div className="engage">
                <div className={`acc-box engage__box${errors.acceptAccuracy ? ' is-error' : ''}`}>
                  <p>
                    <b>13.</b> {ENGAGEMENT_17} <i className="req">*</i>
                  </p>
                  <button type="button" className="check" onClick={() => set('acceptAccuracy', !values.acceptAccuracy)}>
                    <i className={values.acceptAccuracy ? 'on' : ''}>{values.acceptAccuracy ? <Check size={13} strokeWidth={3} /> : null}</i>
                    <span>J’accepte</span>
                  </button>
                  {errors.acceptAccuracy ? <span className="field__err">{errors.acceptAccuracy}</span> : null}
                </div>
                <div className={`acc-box engage__box${errors.acceptData ? ' is-error' : ''}`}>
                  <p>
                    <b>14.</b> {ENGAGEMENT_18} <i className="req">*</i>
                  </p>
                  <button type="button" className="check" onClick={() => set('acceptData', !values.acceptData)}>
                    <i className={values.acceptData ? 'on' : ''}>{values.acceptData ? <Check size={13} strokeWidth={3} /> : null}</i>
                    <span>J’accepte</span>
                  </button>
                  {errors.acceptData ? <span className="field__err">{errors.acceptData}</span> : null}
                </div>
              </div>
            </section>

            {formError ? <p className="acc-alert">{formError}</p> : null}

            <div className="form-card__submit">
              <p className="note">
                <i className="req">*</i> Champ obligatoire · Les deux engagements sont requis pour envoyer.
              </p>
              <button type="submit" className="btn btn--gold btn--lg" disabled={busy}>
                {busy ? 'Envoi…' : 'Envoyer ma demande'}
                <Send size={16} />
              </button>
            </div>

            <div className="acc-wizard-bar">
              {step > 1 ? (
                <button type="button" className="btn btn--ghost" onClick={() => goStep(step - 1)}>
                  <ArrowLeft size={16} /> Retour
                </button>
              ) : (
                <span />
              )}
              {step < sectionCount ? (
                <button type="button" className="btn btn--gold" onClick={() => goStep(step + 1)}>
                  Continuer <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" className="btn btn--gold" disabled={busy}>
                  {busy ? 'Envoi…' : 'Envoyer ma demande'} <Send size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}

function submissionPayload(values: FormValues) {
  const body: Partial<FormValues> = { ...values }
  delete body.mediaLink
  delete body.coverageProject
  delete body.interviews
  delete body.gear
  return body
}

function fieldNumber(key: string) {
  const map: Record<string, number> = {
    fullName: 1,
    mediaName: 2,
    role: 3,
    phone: 4,
    email: 5,
    cityCountry: 6,
    mediaType: 7,
    mediaTypeOther: 7,
    acceptAccuracy: 13,
    acceptData: 14,
  }
  return map[key] ?? 1
}

function isSectionDone(values: FormValues, section: number) {
  return Object.keys(sectionErrors(values, section)).length === 0 && sectionFilled(values, section)
}

function sectionFilled(values: FormValues, section: number) {
  if (section === 1) return Boolean(values.fullName && values.mediaName && values.role && values.phone && values.email && values.cityCountry)
  if (section === 2) return Boolean(values.mediaType && (values.mediaType !== 'Autre' || values.mediaTypeOther.trim()))
  if (section === 3) return values.coverageTypes.length > 0 || values.interviewPeople.length > 0
  if (section === 4) return Boolean(values.teamSize || values.teamMembers.trim())
  return values.acceptAccuracy && values.acceptData
}

export function readConfirmation(): Confirmation | null {
  try {
    const raw = sessionStorage.getItem(CONFIRM_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Confirmation
  } catch {
    return null
  }
}
