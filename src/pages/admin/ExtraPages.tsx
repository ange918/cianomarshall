import { useEffect, useState } from 'react'
import { DONATION_TIERS } from '../../config/feexpay'
import { CONTACT } from '../../data/content'
import { api } from '../../lib/api'
import {
  REFUSAL_REASONS,
  approveMessage,
  demandeHref,
  formatWhen,
  mediaTypeLabel,
  parseTeam,
  teamCount,
} from '../../lib/accreditation/model'
import { navigate } from '../../lib/router'
import { Shell, useAdmin } from './ui'

export function PeoplePage() {
  const { items } = useAdmin()
  const rows = items
    .filter((item) => item.status === 'approuvee')
    .flatMap((item) => {
      const members = parseTeam(item.teamMembers)
      const list = members.length ? members : [{ name: item.fullName, role: item.role }]
      return list.map((member) => ({ member, item }))
    })

  return (
    <Shell crumbs="Accréditations / Personnes accréditées">
      <header className="admin-head">
        <div>
          <h1>Personnes accréditées</h1>
          <p>{rows.length} badge{rows.length > 1 ? 's' : ''} nominatif{rows.length > 1 ? 's' : ''} sur les demandes approuvées.</p>
        </div>
      </header>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Personne</th>
              <th>Fonction</th>
              <th>Média</th>
              <th>Référence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.item.id}-${row.member.name}`} onClick={() => navigate(demandeHref(row.item))}>
                <td className="who-media">{row.member.name}</td>
                <td>{row.member.role || '—'}</td>
                <td>
                  {row.item.mediaName}
                  <br />
                  <small>{mediaTypeLabel(row.item)}</small>
                </td>
                <td>{row.item.reference}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className="empty">
                  Aucune personne accréditée pour le moment.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Shell>
  )
}

export function TemplatesPage() {
  const sample = {
    fullName: 'le demandeur',
    teamSize: '1',
    teamMembers: '',
  }
  return (
    <Shell crumbs="Réglages / Modèles de messages">
      <header className="admin-head">
        <div>
          <h1>Modèles de messages</h1>
          <p>Textes pré-remplis dans les modales. À la validation, le message part par WhatsApp vers le numéro de la demande.</p>
        </div>
      </header>
      <section className="dcard">
        <div className="dcard__head">
          <h3>Approbation</h3>
        </div>
        <div className="dcard__body">
          <p className="pre">{approveMessage(sample)}</p>
        </div>
      </section>
      <section className="dcard">
        <div className="dcard__head">
          <h3>Refus</h3>
        </div>
        <div className="dcard__body stack">
          {REFUSAL_REASONS.map((reason) => (
            <p key={reason.id}>
              <b>{reason.label}.</b> {reason.message}
            </p>
          ))}
        </div>
      </section>
    </Shell>
  )
}

export function SettingsPage() {
  const { capacity, setCapacity, session, toast } = useAdmin()
  const [value, setValue] = useState(String(capacity))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setValue(String(capacity))
  }, [capacity])

  const save = async () => {
    setBusy(true)
    try {
      const data = await api<{ pressCapacity: number }>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ pressCapacity: Number(value) }),
      })
      setCapacity(data.pressCapacity)
      toast('Paramètres enregistrés', `Capacité presse : ${data.pressCapacity} places.`)
    } catch (error) {
      toast('Enregistrement impossible', error instanceof Error ? error.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell crumbs="Réglages / Paramètres">
      <header className="admin-head">
        <div>
          <h1>Paramètres</h1>
          <p>Compte connecté : {session.name} · {session.email}</p>
        </div>
      </header>
      <section className="dcard" style={{ maxWidth: 560 }}>
        <div className="dcard__head">
          <h3>Espace presse</h3>
        </div>
        <div className="dcard__body stack">
          <label className="field">
            <span>Capacité indicative (places)</span>
            <input className="input" inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
          <p className="note">Alerte tableau de bord à 90&nbsp;% des badges approuvés.</p>
          <button type="button" className="btn btn--gold" disabled={busy} onClick={() => void save()}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </section>
    </Shell>
  )
}

export function DonsPage() {
  return (
    <Shell crumbs="Dons / FeexPay">
      <header className="admin-head">
        <div>
          <h1>Dons FeexPay</h1>
          <p>
            Les dons passent par les liens FeexLink du site public. Cette page ne modifie pas le parcours de paiement.
          </p>
        </div>
      </header>
      <div className="amount-grid">
        {DONATION_TIERS.map((tier) => (
          <a key={tier.amount} className="amount-link" href={tier.link} target="_blank" rel="noreferrer">
            <b>{new Intl.NumberFormat('fr-FR').format(tier.amount)}</b>
            <span>FCFA · FeexLink</span>
          </a>
        ))}
      </div>
      <p className="note" style={{ marginTop: '1.2rem' }}>
        Contact dons : {CONTACT.email} · {CONTACT.phone}
      </p>
    </Shell>
  )
}

export function ExportHint() {
  const { items } = useAdmin()
  return (
    <Shell crumbs="Accréditations / Exports">
      <header className="admin-head">
        <div>
          <h1>Exports CSV</h1>
          <p>{items.length} demande{items.length > 1 ? 's' : ''} · séparateur point-virgule, ouvert par Excel.</p>
        </div>
        <a className="btn btn--gold" href="/api/accreditations/export">
          Télécharger le CSV
        </a>
      </header>
      <ul className="timeline">
        {items.slice(0, 5).map((item) => (
          <li key={item.id}>
            <i />
            <div>
              <b>
                {item.reference} · {item.fullName}
              </b>
              <small>
                {formatWhen(item.createdAt)} · {teamCount(item)} pers.
              </small>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  )
}
