import { useEffect, useState, type FormEvent } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ApiError, api } from '../lib/api'
import { navigate, useSearch } from '../lib/router'
import { STATUS_LABEL, type Status } from '../lib/accreditation/model'

type PublicStatus = {
  reference: string
  status: Status
  statusLabel: string
  summary: string
  updatedAt: string
}

export default function AccreditationStatus() {
  const search = useSearch()
  const code = (search.get('code') || '').trim().toUpperCase()
  const [draft, setDraft] = useState(code)
  const [data, setData] = useState<PublicStatus | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(code))

  useEffect(() => {
    document.title = 'Statut d’accréditation — Africa Fashion Awards 2026'
    document.body.classList.add('page-acc')
    return () => document.body.classList.remove('page-acc')
  }, [])

  useEffect(() => {
    setDraft(code)
    if (!code) {
      setData(null)
      setError('')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    api<PublicStatus>(`/api/accreditations/statut?code=${encodeURIComponent(code)}`)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setData(null)
        setError(err instanceof ApiError ? err.message : 'Statut indisponible.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [code])

  const lookup = (event: FormEvent) => {
    event.preventDefault()
    const next = draft.trim().toUpperCase()
    if (!next) return
    navigate(`/accreditation/statut?code=${encodeURIComponent(next)}`)
  }

  const when = data
    ? new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Africa/Porto-Novo',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(data.updatedAt))
    : ''

  return (
    <>
      <Header solid />
      <main className="acc-confirm">
        <div className="panel">
          <div className="panel__strip" />
          <div className="panel__body">
            <span className="panel__kicker">Africa Fashion Awards 2026</span>
            <h1 className="panel__title">Statut de la demande</h1>
            <p className="panel__lead">
              Cette page indique uniquement l’avancement. La décision détaillée est envoyée par WhatsApp au numéro
              indiqué dans le formulaire.
            </p>
            <form className="status-lookup" onSubmit={lookup}>
              <label className="field">
                <span>Référence</span>
                <input
                  className="input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="AFA26-ACC-0001"
                  autoComplete="off"
                />
              </label>
              <button type="submit" className="btn btn--gold">
                Consulter
              </button>
            </form>
            {loading ? <p className="note">Recherche…</p> : null}
            {error ? (
              <div className="notice notice--ko" role="alert">
                {error}
              </div>
            ) : null}
            {data ? (
              <ul className="receipt">
                <li>
                  Référence <b>{data.reference}</b>
                </li>
                <li>
                  Statut <b>{data.statusLabel || STATUS_LABEL[data.status]}</b>
                </li>
                <li>
                  Mise à jour <b>{when}</b>
                </li>
                <li>{data.summary}</li>
              </ul>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
