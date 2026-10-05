import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Mail, MessageCircle } from 'lucide-react'
import { ApiError, api } from '../../lib/api'
import {
  formatWhen,
  mediaTypeLabel,
  teamCount,
  type Accreditation,
  type HistoryEntry,
  type TeamMember,
} from '../../lib/accreditation/model'
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
  const [mode, setMode] = useState<DecisionMode | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const data = await api<Detail>(`/api/accreditations/${id}`)
    setDetail(data)
    setNotes(data.item.internalNotes)
  }

  useEffect(() => {
    let cancelled = false
    setError('')
    load()
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Introuvable')
      })
    return () => {
      cancelled = true
    }
    // rechargement explicite après décision
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const item = detail?.item
  const same = item ? items.filter((row) => row.status === item.status) : []
  const index = item ? same.findIndex((row) => row.id === item.id) : -1
  const prev = index > 0 ? same[index - 1] : undefined
  const next = index >= 0 && index < same.length - 1 ? same[index + 1] : undefined

  const saveNotes = async () => {
    if (!item) return
    setSaving(true)
    try {
      await api(`/api/accreditations/${item.id}`, {
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
            <button type="button" disabled={!prev} aria-label="Précédente" onClick={() => prev && navigate(`/admin/demandes/${prev.id}`)}>
              <ArrowLeft size={16} />
            </button>
            <span>
              {index + 1} / {same.length} {item.status === 'nouvelle' ? 'nouvelles' : 'demandes'}
            </span>
            <button type="button" disabled={!next} aria-label="Suivante" onClick={() => next && navigate(`/admin/demandes/${next.id}`)}>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="acc-alert">{error}</p> : null}
      {!item && !error ? <p className="note">Chargement de la fiche…</p> : null}

      {item && detail ? (
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
                  <a className="btn btn--ghost btn--sm" href={wa(item.phone)} target="_blank" rel="noreferrer">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <a className="btn btn--ghost btn--sm" href={`mailto:${item.email}`}>
                    <Mail size={14} /> E-mail
                  </a>
                </div>
              </div>
            </article>

            <Card n="01" title="Identification">
              <dl className="kv">
                <Row k="1. Nom et prénom" v={item.fullName} />
                <Row k="2. Média / structure" v={item.mediaName} />
                <Row k="3. Fonction" v={item.role} />
                <Row k="4. WhatsApp / téléphone" v={item.phone} />
                <Row k="5. Adresse e-mail" v={item.email} />
                <Row k="6. Ville / Pays" v={item.cityCountry} />
              </dl>
            </Card>
            <Card n="02" title="Profil média">
              <dl className="kv">
                <Row k="7. Type de média" v={mediaTypeLabel(item)} />
                <div className="full">
                  <span>8. Lien média / site / page pro</span>
                  <b>
                    <a href={item.mediaLink.startsWith('http') ? item.mediaLink : `https://${item.mediaLink}`} target="_blank" rel="noreferrer">
                      {item.mediaLink}
                    </a>
                  </b>
                </div>
                <div className="full">
                  <span>9. Réseaux sociaux pro</span>
                  <b className="pre">{item.socialLinks || '—'}</b>
                </div>
              </dl>
            </Card>
            <Card n="03" title="Couverture">
              <dl className="kv">
                <div className="full">
                  <span>10. Type(s) de couverture</span>
                  <div className="chips">
                    {item.coverageTypes.length ? item.coverageTypes.map((type) => <span key={type}>{type}</span>) : <b>—</b>}
                  </div>
                </div>
                <div className="full">
                  <span>11. Projet de couverture</span>
                  <b className="pre">{item.coverageProject || '—'}</b>
                </div>
                <Row k="12. Interviews pendant l’événement" v={item.interviews || '—'} />
                <div className="full">
                  <span>13. Personnes interviewées</span>
                  <div className="chips">
                    {item.interviewPeople.length ? item.interviewPeople.map((type) => <span key={type}>{type}</span>) : <b>—</b>}
                  </div>
                </div>
              </dl>
            </Card>
            <Card n="04" title="Équipe">
              <dl className="kv">
                <Row k="14. Personnes à accréditer" v={String(teamCount(item) || '—')} />
                <Row k="Badges à émettre" v={`${teamCount(item) || 0} badge${teamCount(item) > 1 ? 's' : ''} nominatif${teamCount(item) > 1 ? 's' : ''}`} />
                <div className="full">
                  <span>15. Noms et fonctions</span>
                  <ol className="team-list">
                    {detail.team.map((member) => (
                      <li key={member.name}>
                        {member.name}
                        {member.role ? ` — ${member.role}` : ''}
                      </li>
                    ))}
                    {!detail.team.length ? <li>—</li> : null}
                  </ol>
                </div>
              </dl>
            </Card>
            <Card n="05" title="Matériel">
              <div className="chips">
                {item.gear.length ? item.gear.map((type) => <span key={type}>{type}</span>) : <b>—</b>}
              </div>
            </Card>
            <Card n="06" title="Engagement">
              <p className={item.acceptAccuracy ? 'ok-line' : 'ko-line'}>
                <Check size={14} /> 17. Exactitude {item.acceptAccuracy ? '— J’accepte' : '— non accepté'}
              </p>
              <p className={item.acceptData ? 'ok-line' : 'ko-line'}>
                <Check size={14} /> 18. Traitement des informations {item.acceptData ? '— J’accepte' : '— non accepté'}
              </p>
            </Card>
          </div>

          <aside className="decision">
            <section className="dcard">
              <div className="dcard__head">
                <h3>Décision</h3>
                <Badge status={item.status} />
              </div>
              <div className="dcard__body">
                <button type="button" className="btn btn--ok btn--lg" onClick={() => setMode('approve')}>
                  <Check size={16} /> Approuver
                </button>
                <button type="button" className="btn btn--ghost btn--lg" onClick={() => setMode('complement')}>
                  Demander un complément
                </button>
                <button type="button" className="btn btn--ko btn--lg" onClick={() => setMode('refuse')}>
                  Refuser
                </button>
                <p className="note">Le demandeur n’est pas notifié automatiquement (e-mail et WhatsApp hors V1).</p>
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
                <li className={detail.controls.linkOk ? 'ok' : 'warn'}>
                  {detail.controls.linkOk ? 'Lien média accessible' : detail.controls.linkOk === false ? 'Lien média inaccessible' : 'Lien média non vérifié'}
                </li>
                <li className={detail.controls.engagements ? 'ok' : 'warn'}>
                  {detail.controls.engagements ? 'Engagements 17 & 18 acceptés' : 'Engagements incomplets'}
                </li>
                <li className={detail.controls.duplicateNames.length ? 'warn' : 'ok'}>
                  {detail.controls.duplicateNames.length
                    ? `${detail.controls.duplicateNames.length} nom présent dans une autre demande (${detail.controls.duplicateNames.join(', ')})`
                    : 'Aucun nom en doublon'}
                </li>
              </ul>
            </section>
            <section className="dcard">
              <div className="dcard__head">
                <h3>Historique</h3>
              </div>
              <ul className="timeline">
                {item.history.map((entry: HistoryEntry, index) => (
                  <li key={`${entry.at}-${index}`}>
                    <i className={index === item.history.length - 1 ? 'dim' : ''} />
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
          onDone={async (title, text) => {
            setMode(null)
            await refresh()
            await load()
            toast(title, text)
          }}
        />
      ) : null}
    </Shell>
  )
}

function Card({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="dcard">
      <div className="dcard__head">
        <h3>
          <span className="fs__num">{n}</span> {title}
        </h3>
      </div>
      <div className="dcard__body">{children}</div>
    </section>
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
  const parts = name.replace(/^@/, '').split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

function wa(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}
