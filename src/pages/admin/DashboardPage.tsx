import { ArrowUpRight, Download } from 'lucide-react'
import {
  computeStats,
  formatWhen,
  mediaTypeLabel,
  teamCount,
} from '../../lib/accreditation/model'
import { navigate } from '../../lib/router'
import { Badge, Shell, useAdmin } from './ui'

export default function DashboardPage() {
  const { items, capacity, loading } = useAdmin()
  const stats = computeStats(items)
  const maxMedia = Math.max(1, ...stats.byMedia.map((row) => row.count))
  const ratio = capacity ? Math.min(100, Math.round((stats.capacityUsed / capacity) * 100)) : 0

  return (
    <Shell crumbs="Back-office / Tableau de bord">
      <header className="admin-head">
        <div>
          <h1>Accréditations médias</h1>
          <p>7<sup>e</sup> édition · Cérémonie du 15 novembre 2026 · J-{daysLeft()}</p>
        </div>
        <div className="admin-head__actions">
          <a className="btn btn--ghost" href="/api/accreditations/export">
            <Download size={15} /> Exporter CSV
          </a>
          <button type="button" className="btn btn--gold" onClick={() => navigate('/admin/demandes?statut=nouvelle')}>
            Voir les nouvelles demandes <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      <section className="kpis">
        <article className="kpi">
          <span>Total demandes</span>
          <b>{loading ? '—' : stats.total}</b>
          <small>+{stats.week} cette semaine</small>
        </article>
        <article className="kpi" style={{ ['--kc' as string]: '#e7c65a' }}>
          <span>Nouvelles</span>
          <b className="gold">{loading ? '—' : stats.nouvelle}</b>
          <small>À traiter</small>
        </article>
        <article className="kpi" style={{ ['--kc' as string]: '#7fbf8e' }}>
          <span>Approuvées</span>
          <b>{loading ? '—' : stats.approuvee}</b>
          <small>{stats.badges} badges nominatifs</small>
        </article>
        <article className="kpi" style={{ ['--kc' as string]: '#e0705f' }}>
          <span>Refusées</span>
          <b>{loading ? '—' : stats.refusee}</b>
          <small>{stats.refusedRatio} % des décisions</small>
        </article>
        <article className="kpi" style={{ ['--kc' as string]: '#9db4e6' }}>
          <span>Complément demandé</span>
          <b>{loading ? '—' : stats.complement}</b>
          <small>En attente du demandeur</small>
        </article>
      </section>

      <div className="dash-grid">
        <section className="dcard">
          <div className="dcard__head">
            <h3>Demandes reçues · 14 derniers jours</h3>
            <span className="note">Pic : {stats.peak} / jour</span>
          </div>
          <div className="dcard__body">
            <div className="bars" aria-hidden="true">
              {stats.byDay.map((point) => (
                <i key={point.key} style={{ height: `${stats.peak ? Math.max(6, (point.count / stats.peak) * 100) : 6}%` }} title={`${point.label} : ${point.count}`} />
              ))}
            </div>
            <div className="bars__labels">
              {stats.byDay.map((point) => (
                <span key={point.key}>{point.label}</span>
              ))}
            </div>
          </div>
        </section>
        <section className="dcard">
          <div className="dcard__head">
            <h3>Par type de média</h3>
            <span className="note">Q7</span>
          </div>
          <div className="dcard__body hbars">
            {stats.byMedia.length ? (
              stats.byMedia.map((row) => (
                <div key={row.label}>
                  <span>{row.label}</span>
                  <i>
                    <b style={{ width: `${(row.count / maxMedia) * 100}%` }} />
                  </i>
                  <em>{row.count}</em>
                </div>
              ))
            ) : (
              <p className="note">Aucune demande.</p>
            )}
          </div>
        </section>
      </div>

      <div className="dash-grid">
        <section className="dcard">
          <div className="dcard__head">
            <h3>Dernières demandes</h3>
            <button type="button" className="text-link" onClick={() => navigate('/admin/demandes')}>
              Tout voir →
            </button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Demandeur</th>
                  <th>Média · type</th>
                  <th>Équipe</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 6).map((item) => (
                  <tr key={item.id} onClick={() => navigate(`/admin/demandes/${item.id}`)}>
                    <td>
                      <div className="who">
                        <span className={`avatar${item.status === 'nouvelle' ? '' : ' avatar--dim'}`}>
                          {initials(item.fullName)}
                        </span>
                        <div>
                          <b>{item.fullName}</b>
                          <small>{formatWhen(item.createdAt)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="who-media">{item.mediaName}</span>
                      <small>{mediaTypeLabel(item)}</small>
                    </td>
                    <td>{teamCount(item) || '—'} pers.</td>
                    <td>
                      <Badge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="dash-side">
          <section className="dcard">
            <div className="dcard__head">
              <h3>Couverture demandée</h3>
              <span className="note">Q10</span>
            </div>
            <div className="dcard__body chips">
              {stats.byCoverage.map((row) => (
                <span key={row.label}>
                  {row.label} <b>{row.count}</b>
                </span>
              ))}
              {!stats.byCoverage.length ? <p className="note">Aucune couverture renseignée.</p> : null}
            </div>
          </section>
          <section className="dcard">
            <div className="dcard__head">
              <h3>Capacité espace presse</h3>
            </div>
            <div className="dcard__body capacity">
              <p>
                <b>{stats.capacityUsed}</b> <span>/ {capacity} places</span>
              </p>
              <div className="acc-bar">
                <i style={{ width: `${ratio}%` }} />
              </div>
              <p className="note">
                Capacité indicative à confirmer · alerte à 90&nbsp;%.
                {ratio >= 90 ? ' Seuil atteint.' : ''}
              </p>
            </div>
          </section>
        </div>
      </div>
    </Shell>
  )
}

function daysLeft() {
  const event = new Date('2026-11-15T00:00:00+01:00').getTime()
  return Math.max(0, Math.ceil((event - Date.now()) / 86_400_000))
}

function initials(name: string) {
  const parts = name.replace(/^@/, '').split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}
