import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import {
  COMPLEMENT_FIELDS,
  REFUSAL_REASONS,
  approveMessage,
  complementMessage,
  parseTeam,
  teamCount,
  type Accreditation,
} from '../../lib/accreditation/model'
import { Modal } from './ui'

export type DecisionMode = 'approve' | 'refuse' | 'complement'

const TITLES: Record<DecisionMode, { kicker: string; title: string; confirm: string }> = {
  approve: { kicker: 'Approuver', title: 'Approuver la demande', confirm: 'Confirmer l’approbation' },
  refuse: { kicker: 'Refuser', title: 'Refuser la demande', confirm: 'Confirmer le refus' },
  complement: { kicker: 'Demande de complément', title: 'Demande de complément', confirm: 'Envoyer la demande' },
}

export default function DecisionModal({
  mode,
  items,
  onClose,
  onDone,
}: {
  mode: DecisionMode
  items: Accreditation[]
  onClose: () => void
  onDone: (title: string, text: string) => void
}) {
  const first = items[0]
  const [reason, setReason] = useState(REFUSAL_REASONS[1]?.id || 'lien')
  const [fields, setFields] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!first) return
    if (mode === 'approve') setMessage(approveMessage(first))
    if (mode === 'refuse') {
      const found = REFUSAL_REASONS.find((item) => item.id === reason)
      setMessage(found?.message || '')
    }
    if (mode === 'complement') setMessage(complementMessage(first.fullName, fields))
  }, [mode, first, reason, fields])

  if (!first) return null
  const meta = TITLES[mode]
  const many = items.length > 1

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      for (const item of items) {
        const body =
          mode === 'approve'
            ? { action: 'approve', message: many ? approveMessage(item) : message }
            : mode === 'refuse'
              ? { action: 'refuse', reason, message: many ? message : message }
              : { action: 'complement', fields, message: many ? complementMessage(item.fullName, fields) : message }
        await api(`/api/accreditations/${item.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      }
      const name = many ? `${items.length} demandes` : first.fullName
      const title =
        mode === 'approve' ? 'Demande approuvée' : mode === 'refuse' ? 'Demande refusée' : 'Complément demandé'
      const text =
        mode === 'approve'
          ? `${name} · ${teamCount(first)} badge${teamCount(first) > 1 ? 's' : ''}`
          : name
      onDone(many && mode === 'approve' ? 'Demandes approuvées' : title, text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={meta.title} kicker={meta.kicker} onClose={onClose}>
      <p className="panel__lead">
        {many
          ? `${items.length} demandes sélectionnées.`
          : `${first.fullName} · ${teamCount(first) || '—'} badge${teamCount(first) > 1 ? 's' : ''}`}
      </p>
      {mode === 'approve' && !many ? (
        <ul className="people-mini">
          {parseTeam(first.teamMembers).map((member) => (
            <li key={member.name}>
              <b>{member.name}</b>
              <span>{member.role || 'Personne à accréditer'}</span>
            </li>
          ))}
          {!parseTeam(first.teamMembers).length ? <li>Les badges seront émis pour les personnes listées en Q15.</li> : null}
        </ul>
      ) : null}
      {mode === 'refuse' ? (
        <fieldset className="reasons">
          <legend>Motif du refus</legend>
          <p className="note">Le motif sélectionné pré-remplit le message (modifiable).</p>
          {REFUSAL_REASONS.map((item) => (
            <label key={item.id} className={reason === item.id ? 'on' : ''}>
              <input type="radio" name="reason" checked={reason === item.id} onChange={() => setReason(item.id)} />
              {item.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      {mode === 'complement' ? (
        <fieldset className="reasons">
          <legend>Informations à préciser</legend>
          {COMPLEMENT_FIELDS.map((field) => {
            const on = fields.includes(field)
            return (
              <label key={field} className={on ? 'on' : ''}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    setFields((prev) => (prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field]))
                  }
                />
                {field}
              </label>
            )
          })}
        </fieldset>
      ) : null}
      <label className="field">
        <span>Message au demandeur</span>
        <textarea className="input textarea" value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <p className="note">Le message est enregistré dans l’historique. L’envoi e-mail / WhatsApp n’est pas activé dans cette version.</p>
      {error ? <p className="field__err">{error}</p> : null}
      <div className="panel__actions">
        <button type="button" className={`btn btn--lg ${mode === 'refuse' ? 'btn--ko-solid' : 'btn--gold'}`} disabled={busy} onClick={() => void submit()}>
          {busy ? 'Enregistrement…' : meta.confirm}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Annuler
        </button>
      </div>
    </Modal>
  )
}
