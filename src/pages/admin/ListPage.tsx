import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, X } from 'lucide-react'
import {
  MEDIA_TYPES,
  STATUS_LABEL,
  STATUS_ORDER,
  formatWhen,
  mediaTypeLabel,
  teamCount,
  type Accreditation,
} from '../../lib/accreditation/model'
import { navigate, useSearch } from '../../lib/router'
import DecisionModal, { type DecisionMode } from './DecisionModal'
import { Badge, Shell, useAdmin } from './ui'

const PAGE = 8

export default function ListPage({ initialQuery = '', initialStatus = 'toutes' }: { initialQuery?: string; initialStatus?: string }) {
  const { items, refresh, toast } = useAdmin()
  const search = useSearch()
  const [q, setQ] = useState(initialQuery || search.get('q') || '')
  const [statut, setStatut] = useState(initialStatus || search.get('statut') || 'toutes')
  const [media, setMedia] = useState('tous')
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [decision, setDecision] = useState<{ mode: DecisionMode; items: Accreditation[] } | null>(null)

  const queryString = search.toString()
  useEffect(() => {
    const params = new URLSearchParams(queryString)
    const nextQ = params.get('q')
    const nextStatus = params.get('statut')
    if (nextQ) setQ(nextQ)
    if (nextStatus) {
      setStatut(nextStatus)
      setPage(1)
    }
  }, [queryString])

  const counts = useMemo(() => {
    const base = { toutes: items.length } as Record<string, number>
    for (const status of STATUS_ORDER) base[status] = items.filter((item) => item.status === status).length
    return base
  }, [items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((item) => {
      if (statut !== 'toutes' && item.status !== statut) return false
      if (media !== 'tous' && item.mediaType !== media) return false
      if (!query) return true
      const blob = [item.fullName, item.mediaName, item.reference, item.email, item.cityCountry, item.role]
        .join(' ')
        .toLowerCase()
      return blob.includes(query)
    })
  }, [items, q, statut, media])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const safePage = Math.min(page, pages)
  const slice = filtered.slice((safePage - 1) * PAGE, safePage * PAGE)
  const selectedItems = items.filter((item) => selected.includes(item.id))

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const exportHref = () => {
    const params = new URLSearchParams()
    if (selected.length) params.set('ids', selected.join(','))
    else if (statut !== 'toutes') params.set('statut', statut)
    const qs = params.toString()
    return `/api/accreditations/export${qs ? `?${qs}` : ''}`
  }

  return (
    <Shell crumbs="Accréditations / Demandes">
      <header className="admin-head">
        <div>
          <h1>Demandes d’accréditation</h1>
          <p>
            {items.length} demande{items.length > 1 ? 's' : ''} · {counts.nouvelle || 0} nouvelle
            {(counts.nouvelle || 0) > 1 ? 's' : ''} à traiter
          </p>
        </div>
        <a className="btn btn--ghost" href={exportHref()}>
          Exporter {selected.length ? 'la sélection' : 'CSV'}
        </a>
      </header>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          <Tab on={statut === 'toutes'} onClick={() => { setStatut('toutes'); setPage(1) }} label="Toutes" count={counts.toutes || 0} />
          {STATUS_ORDER.map((status) => (
            <Tab
              key={status}
              on={statut === status}
              onClick={() => { setStatut(status); setPage(1) }}
              label={status === 'complement' ? 'Complément' : STATUS_LABEL[status]}
              count={counts[status] || 0}
            />
          ))}
        </div>
        <div className="filters">
          <input
            className="finput"
            value={q}
            placeholder="Nom, média, référence…"
            onChange={(event) => {
              setQ(event.target.value)
              setPage(1)
            }}
            aria-label="Filtrer"
          />
          <select
            className="finput"
            value={media}
            aria-label="Type de média"
            onChange={(event) => {
              setMedia(event.target.value)
              setPage(1)
            }}
          >
            <option value="tous">Type de média</option>
            {MEDIA_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedItems.length ? (
        <div className="bulk">
          <b>{selectedItems.length}</b> demande{selectedItems.length > 1 ? 's' : ''} sélectionnée
          {selectedItems.length > 1 ? 's' : ''}
          <button type="button" onClick={() => setDecision({ mode: 'approve', items: selectedItems })}>
            Approuver
          </button>
          <button type="button" onClick={() => setDecision({ mode: 'complement', items: selectedItems })}>
            Demander un complément
          </button>
          <button type="button" onClick={() => setDecision({ mode: 'refuse', items: selectedItems })}>
            Refuser
          </button>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  className={`cb${slice.length && slice.every((item) => selected.includes(item.id)) ? ' on' : ''}`}
                  aria-label="Tout sélectionner"
                  onClick={() => {
                    const ids = slice.map((item) => item.id)
                    const all = ids.every((id) => selected.includes(id))
                    setSelected((prev) => (all ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]))
                  }}
                >
                  {slice.length && slice.every((item) => selected.includes(item.id)) ? <Check size={12} /> : null}
                </button>
              </th>
              <th>Demandeur</th>
              <th>Média</th>
              <th>Type de média</th>
              <th>Équipe</th>
              <th>Ville / Pays</th>
              <th>Reçue le</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((item) => (
              <tr key={item.id} className={selected.includes(item.id) ? 'sel' : ''}>
                <td>
                  <button
                    type="button"
                    className={`cb${selected.includes(item.id) ? ' on' : ''}`}
                    aria-label={`Sélectionner ${item.fullName}`}
                    onClick={() => toggle(item.id)}
                  >
                    {selected.includes(item.id) ? <Check size={12} /> : null}
                  </button>
                </td>
                <td>
                  <div className="who">
                    <span className={`avatar${item.status === 'nouvelle' ? '' : ' avatar--dim'}`}>{initials(item.fullName)}</span>
                    <div>
                      <b>{item.fullName}</b>
                      <small>{item.role}</small>
                    </div>
                  </div>
                </td>
                <td className="who-media">{item.mediaName}</td>
                <td>
                  <span className="type">{mediaTypeLabel(item)}</span>
                </td>
                <td>{teamCount(item) || '—'} pers.</td>
                <td>{item.cityCountry}</td>
                <td>{formatWhen(item.createdAt)}</td>
                <td>
                  <Badge status={item.status} />
                </td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="ibtn" aria-label="Ouvrir" onClick={() => navigate(`/admin/demandes/${item.id}`)}>
                      <Eye size={15} />
                    </button>
                    {item.status === 'nouvelle' || item.status === 'complement' ? (
                      <>
                        <button type="button" className="ibtn ibtn--ok" aria-label="Approuver" onClick={() => setDecision({ mode: 'approve', items: [item] })}>
                          <Check size={15} />
                        </button>
                        <button type="button" className="ibtn ibtn--ko" aria-label="Refuser" onClick={() => setDecision({ mode: 'refuse', items: [item] })}>
                          <X size={15} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!slice.length ? (
              <tr>
                <td colSpan={9} className="empty">
                  Aucune demande pour ce filtre.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </span>
        <div>
          {Array.from({ length: pages }, (_, index) => (
            <button key={index} type="button" className={safePage === index + 1 ? 'on' : ''} onClick={() => setPage(index + 1)}>
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {decision ? (
        <DecisionModal
          mode={decision.mode}
          items={decision.items}
          onClose={() => setDecision(null)}
          onDone={async (title, text, warning) => {
            setDecision(null)
            setSelected([])
            await refresh()
            toast(title, text)
            if (warning) toast('WhatsApp non envoyé', warning, 'warn')
          }}
        />
      ) : null}
    </Shell>
  )
}

function Tab({ on, onClick, label, count }: { on: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button type="button" className={`tab${on ? ' on' : ''}`} onClick={onClick} role="tab" aria-selected={on}>
      {label} <em>{count}</em>
    </button>
  )
}

function initials(name: string) {
  const parts = name.replace(/^@/, '').split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '')).toUpperCase()
}
