import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle } from 'lucide-react'
import { ApiError, api } from '../../lib/api'
import {
  answerSections,
  demandeHref,
  formatWhen,
  parseTeam,
  teamCount,
  type Accreditation,
  type AnswerRow,
  type HistoryEntry,
  type TeamMember,
} from '../../lib/accreditation/model'
import { contactWhatsAppUrl } from '../../lib/accreditation/phone'
import { navigate } from '../../lib/router'
import DecisionModal, { type DecisionMode } from './DecisionModal'
import { Badge, Shell, useAdmin } from './ui'

type Detail = {
  item: Accreditation
  controls: { engagements: boolean; linkOk: boolean | null; duplicateNames: string[] }
  team: TeamMember[]
}

export default function FichePage({ id }: { id: string }) {
  const { items, refresh, toast } = useAdmin()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [notesFor, setNotesFor] = useState('')
  const [mode, setMode] = useState<DecisionMode | null>(null)
  const [saving, setSaving] = useState(false)

  const cached = useMemo(
    () => items.find((row) => row.id === id || row.reference === id) ?? null,
    [items, id],
  )

  const load = async () => {
    const data = await api<Detail>(`/api/accreditations/${encodeURIComponent(id)}`)
    if (!data?.item) throw new Error('Demande introuvable.')
    setDetail(data)
    setNotes(data.item.internalNotes || '')
    setNotesFor(data.item.id || data.item.reference)
    setError('')
    return data
  }

  useEffect(() => {
    let cancelled = false
    setError('')
    setDetail(null)
    api<Detail>(`/api/accreditations/${encodeURIComponent(id)}`)
      .then((data) => {
        if (cancelled) return
        if (!data?.item) throw new Error('Demande introuvable.')
        setDetail(data)
        setNotes(data.item.internalNotes || '')
        setNotesFor(data.item.id || data.item.reference)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Introuvable')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const item = detail?.item ?? cached
  const sections = item ? answerSections(item) : []
  const history = item && Array.isArray(item.history) ? item.history : []
  const team = detail?.team ?? (item ? parseTeam(item.teamMembers) : [])
  const controls = detail?.controls ?? {
    engagements: Boolean(item?.acceptAccuracy && item?.acceptData),
    linkOk: null as boolean | null,
    duplicateNames: [] as string[],
  }

  useEffect(() => {
    if (!item || detail) return
    const key = item.id || item.reference
    if (notesFor === key) return
    setNotes(item.internalNotes || '')
    setNotesFor(key)
  }, [item, detail, notesFor])
  const contactUrl = item ? contactWhatsAppUrl(item) : null
  const same = item ? items.filter((row) => row.status === item.status) : []
  const index = item ? same.findIndex((row) => row.id === item.id) : -1
  const prev = index > 0 ? same[index - 1] : undefined
  const next = index >= 0 && index < same.length - 1 ? same[index + 1] : undefined

  const saveNotes = async () => {
    if (!item) return
    setSaving(true)
    try {
      await api(`/api/accreditations/${encodeURIComponent(item.id || item.reference)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'notes', internalNotes: notes }),
      })
      await load()
      toast('Note enregistrée', 'Visible uniquement par l’équipe AFA.')
    } catch (err) {
      toast('Note non enregistrée', err instanceof ApiError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell crumbs={`Accréditations / Demandes / ${item?.reference || '…'}`}>
      <div className="fiche-top">
        <button type="button" className="text-link" onClick={() => navigate('/admin/demandes')}>
          ← Retour à la liste
        </button>
        {item ? (
          <div className="fiche-nav">
            <button type="button" disabled={!prev} aria-label="Précédente" onClick={() => prev && navigate(demandeHref(prev))}>
              <ArrowLeft size={16} />
            </button>
            <span>
              {index + 1} / {same.length} {item.status === 'nouvelle' ? 'nouvelles' : 'demandes'}
            </span>
            <button type="button" disabled={!next} aria-label="Suivante" onClick={() => next && navigate(demandeHref(next))}>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : null}
      </div>

      {error && !item ? <p className="acc-alert">{error}</p> : null}
      {error && item ? (
        <p className="note">Les réponses du formulaire sont affichées. Actualisation de la fiche impossible : {error}</p>
      ) : null}
      {!item && !error ? <p className="note">Chargement de la fiche…</p> : null}

      {item ? (
        <div className="detail">
          <div>
            <article className="dcard">
              <div className="profile">
                <span className="avatar">{initials(item.fullName)}</span>
                <div>
                  <Badge status={item.status} />
                  <h2>{item.fullName}</h2>
                  <p>
                    {item.role} · {item.mediaName} · {item.cityCountry}
                  </p>
                </div>
                <div className="profile__actions">
                  {contactUrl ? (
                    <a className="btn btn--ghost btn--sm" href={contactUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  ) : (
                    <span className="btn btn--ghost btn--sm" aria-disabled="true">
                      <MessageCircle size={14} /> WhatsApp
                    </span>
                  )}
                  <a className="btn btn--ghost btn--sm" href={`mailto:${item.email}`}>
                    <Mail size={14} /> E-mail
                  </a>
                </div>
              </div>
            </article>

            <p className="note answers-lead">
              Réponses du formulaire · {sections.reduce((sum, section) => sum + section.rows.length, 0)} questions
              {team.length ? ` · ${teamCount(item)} badge${teamCount(item) > 1 ? 's' : ''}` : ''}
            </p>
            {sections.map((section) => (
              <Card key={section.id} n={section.id} title={section.title}>
                {section.engage ? (
                  section.rows.map((row) => (
                    <p key={row.n} className={row.value === 'J’accepte' ? 'ok-line' : 'ko-line'}>
                      <Check size={14} /> {row.n}. {row.label} — {row.value}
                    </p>
                  ))
                ) : (
                  <dl className="kv">
                    {section.rows.map((row) => (
                      <Answer key={row.n} row={row} />
                    ))}
                    {section.id === '04' ? (
                      <Row k="Badges à émettre" v={`${teamCount(item) || 0} badge${teamCount(item) > 1 ? 's' : ''} nominatif${teamCount(item) > 1 ? 's' : ''}`} />
                    ) : null}
                  </dl>
                )}
              </Card>
            ))}
          </div>

          <aside className="decision">
            <section className="dcard">
              <div className="dcard__head">
                <h3>Décision</h3>
                <Badge status={item.status} />
              </div>
              <div className="dcard__body">
                {contactUrl ? (
                  <a className="btn btn--ok btn--lg" href={contactUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} /> Contacter
                  </a>
                ) : (
                  <button type="button" className="btn btn--ok btn--lg" disabled>
                    <MessageCircle size={16} /> Contacter
                  </button>
                )}
                <button type="button" className="btn btn--ghost btn--lg" onClick={() => setMode('complement')}>
                  Demander un complément
                </button>
                <button type="button" className="btn btn--ko btn--lg" onClick={() => setMode('refuse')}>
                  Refuser
                </button>
                <button type="button" className="btn btn--quiet" onClick={() => setMode('approve')}>
                  Marquer comme validée
                </button>
                <p className="note">
                  {contactUrl
                    ? 'Contacter ouvre WhatsApp avec un message prérempli, à compléter avant l’envoi. Complément et refus mettent à jour le dossier et tentent une notification. « Marquer comme validée » enregistre le statut Approuvée.'
                    : 'Le numéro indiqué ne permet pas d’ouvrir WhatsApp. Complément, refus et « Marquer comme validée » restent disponibles.'}
                </p>
                {lastWhatsApp(item) && !lastWhatsApp(item)?.ok ? (
                  <div className="notice notice--ko" role="status">
                    {lastWhatsApp(item)?.error || 'WhatsApp non envoyé.'}
                  </div>
                ) : null}
                {item.decisionMessage ? <p className="decision-msg">{item.decisionMessage}</p> : null}
              </div>
            </section>
            <section className="dcard">
              <div className="dcard__head">
                <h3>Notes internes</h3>
              </div>
              <div className="dcard__body">
                <textarea className="input textarea notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
                <button type="button" className="btn btn--ghost" disabled={saving} onClick={() => void saveNotes()}>
                  {saving ? 'Enregistrement…' : 'Enregistrer la note'}
                </button>
                <p className="note">Visible uniquement par l’équipe AFA.</p>
              </div>
            </section>
            <section className="dcard">
              <div className="dcard__head">
                <h3>Contrôles</h3>
              </div>
              <ul className="controls">
                {item.mediaLink?.trim() ? (
                  <li className={controls.linkOk ? 'ok' : 'warn'}>
                    {controls.linkOk ? 'Lien média accessible' : controls.linkOk === false ? 'Lien média inaccessible' : 'Lien média non vérifié'}
                  </li>
                ) : null}
                <li className={controls.engagements ? 'ok' : 'warn'}>
                  {controls.engagements ? 'Engagements acceptés' : 'Engagements incomplets'}
                </li>
                <li className={controls.duplicateNames.length ? 'warn' : 'ok'}>
                  {controls.duplicateNames.length
                    ? `${controls.duplicateNames.length} nom présent dans une autre demande (${controls.duplicateNames.join(', ')})`
                    : 'Aucun nom en doublon'}
                </li>
              </ul>
            </section>
            <section className="dcard">
              <div className="dcard__head">
                <h3>Historique</h3>
              </div>
              <ul className="timeline">
                {history.map((entry: HistoryEntry, index) => (
                  <li key={`${entry.at}-${index}`}>
                    <i className={index === history.length - 1 ? 'dim' : ''} />
                    <div>
                      <b>{entry.action}</b>
                      <small>
                        {formatWhen(entry.at)} · {entry.actor}
                        {entry.detail ? ` · ${entry.detail}` : ''}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      ) : null}

      {mode && item ? (
        <DecisionModal
          mode={mode}
          items={[item]}
          onClose={() => setMode(null)}
          onDone={async (title, text, warning) => {
            setMode(null)
            await refresh()
            await load()
            toast(title, text)
            if (warning) toast('WhatsApp non envoyé', warning, 'warn')
          }}
        />
      ) : null}
    </Shell>
  )
}

function Card({ n, title, children }: { n?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="dcard">
      <div className="dcard__head">
        <h3>
          {n ? <span className="fs__num">{n}</span> : null} {title}
        </h3>
      </div>
      <div className="dcard__body">{children}</div>
    </section>
  )
}

function Answer({ row }: { row: AnswerRow }) {
  const chips = row.chips
  return (
    <div className={chips || row.value.includes('\n') || row.href ? 'full' : undefined}>
      <span>
        {row.n}. {row.label}
      </span>
      {chips ? (
        <div className="chips">
          {chips.length ? chips.map((type) => <span key={type}>{type}</span>) : <span className="pre">—</span>}
        </div>
      ) : row.href ? (
        <b>
          <a href={row.href} target="_blank" rel="noreferrer">
            {row.value}
          </a>
        </b>
      ) : (
        <b className="pre">{row.value || '—'}</b>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span>{k}</span>
      <b>{v || '—'}</b>
    </div>
  )
}

function initials(name: string) {
  const parts = String(name || '').replace(/^@/, '').split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

function lastWhatsApp(item: { notifications?: { ok: boolean; error?: string }[] }) {
  const list = item.notifications || []
  return list[list.length - 1]
}
