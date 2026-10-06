import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Download,
  Heart,
  IdCard,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react'
import Logo from '../../components/Logo'
import { api } from '../../lib/api'
import { navigate, usePathname, useSearch } from '../../lib/router'
import {
  STATUS_LABEL,
  demandeHref,
  type Accreditation,
  type Status,
} from '../../lib/accreditation/model'

export type SessionUser = { email: string; name: string; role: string }

type Toast = { id: number; title: string; text: string; tone: 'ok' | 'warn' }

type AdminContextValue = {
  session: SessionUser
  items: Accreditation[]
  capacity: number
  loading: boolean
  whatsappConfigured: boolean
  refresh: () => Promise<void>
  toast: (title: string, text: string, tone?: 'ok' | 'warn') => void
  setCapacity: (n: number) => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('Admin hors contexte')
  return ctx
}

export function statusClass(status: Status) {
  if (status === 'approuvee') return 'badge--ok'
  if (status === 'refusee') return 'badge--ko'
  if (status === 'complement') return 'badge--info'
  return 'badge--wait'
}

export function Badge({ status }: { status: Status }) {
  return (
    <span className={`badge ${statusClass(status)}`}>
      <i />
      {STATUS_LABEL[status]}
    </span>
  )
}

const LINKS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, group: 'Pilotage' },
  { href: '/admin/demandes', label: 'Demandes', icon: IdCard, group: 'Accréditations', count: true },
  { href: '/admin/personnes', label: 'Personnes accréditées', icon: Users, group: 'Accréditations' },
  { href: '/admin/export', label: 'Exports (CSV)', icon: Download, group: 'Accréditations' },
  { href: '/admin/dons', label: 'Dons FeexPay', icon: Heart, group: 'Dons' },
  { href: '/admin/modeles', label: 'Modèles de messages', icon: Mail, group: 'Réglages' },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings, group: 'Réglages' },
]

export function AdminProvider({
  session,
  children,
}: {
  session: SessionUser
  children: React.ReactNode
}) {
  const [items, setItems] = useState<Accreditation[]>([])
  const [capacity, setCapacity] = useState(150)
  const [whatsappConfigured, setWhatsappConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  const refresh = async () => {
    const data = await api<{ items: Accreditation[]; pressCapacity: number; whatsappConfigured?: boolean }>('/api/accreditations')
    setItems(data.items)
    setCapacity(data.pressCapacity)
    setWhatsappConfigured(data.whatsappConfigured !== false)
  }

  useEffect(() => {
    let cancelled = false
    refresh()
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toast = (title: string, text: string, tone: 'ok' | 'warn' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, title, text, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), tone === 'warn' ? 9000 : 4200)
  }

  const value = useMemo(
    () => ({ session, items, capacity, loading, whatsappConfigured, refresh, toast, setCapacity }),
    [session, items, capacity, loading, whatsappConfigured],
  )

  return (
    <AdminContext.Provider value={value}>
      {children}
      <div className="toasts">
        {toasts.map((item) => (
          <div className={`toast${item.tone === 'warn' ? ' toast--warn' : ''}`} key={item.id} role="status">
            <span className={`state__ring ${item.tone === 'warn' ? 'state__ring--ko' : 'state__ring--ok'}`}>
              <span className="toast__check">{item.tone === 'warn' ? '!' : '✓'}</span>
            </span>
            <div>
              <b>{item.title}</b>
              <span>{item.text}</span>
            </div>
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  )
}

export function Shell({
  crumbs,
  children,
}: {
  crumbs: string
  children: React.ReactNode
}) {
  const path = usePathname()
  const { session, items } = useAdmin()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [bell, setBell] = useState(false)
  const nouvelles = items.filter((item) => item.status === 'nouvelle')
  const groups = ['Pilotage', 'Accréditations', 'Dons', 'Réglages']

  const logout = async () => {
    await api('/api/admin/logout', { method: 'POST' })
    navigate('/admin/login')
    window.location.reload()
  }

  const active = (href: string) => {
    if (href === '/admin') return path === '/admin'
    return path === href || path.startsWith(`${href}/`)
  }

  return (
    <div className="admin">
      {open ? <button className="side-backdrop" aria-label="Fermer le menu" onClick={() => setOpen(false)} /> : null}
      <aside className={`side${open ? ' is-open' : ''}`}>
        <div className="side__brand">
          <span className="brand__logo-ring">
            <Logo />
          </span>
          <span className="brand__text">
            <span className="brand__mark">AFA Admin</span>
            <span className="brand__sub">Back-office 2026</span>
          </span>
        </div>
        {groups.map((group) => (
          <div className="side__group" key={group}>
            <span className="side__label">{group}</span>
            {LINKS.filter((link) => link.group === group).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`side__link${active(link.href) ? ' on' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  setOpen(false)
                  if (link.href === '/admin/export') {
                    window.location.href = '/api/accreditations/export'
                    return
                  }
                  navigate(link.href)
                }}
              >
                <link.icon size={16} />
                {link.label}
                {link.count ? <span className="side__count">{nouvelles.length}</span> : null}
              </a>
            ))}
          </div>
        ))}
        <div className="side__user">
          <span className="avatar">{initials(session.name)}</span>
          <div>
            <b>{session.name}</b>
            <small>{session.role}</small>
          </div>
          <button type="button" className="icon-btn" aria-label="Se déconnecter" onClick={() => void logout()}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div className="admin__main">
        <div className="topbar">
          <button type="button" className="icon-btn side-toggle" aria-label="Menu" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <p className="crumbs">{crumbs}</p>
          <form
            className="search"
            onSubmit={(event) => {
              event.preventDefault()
              navigate(`/admin/demandes?q=${encodeURIComponent(query.trim())}`)
            }}
          >
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un nom, un média, une référence…"
              aria-label="Rechercher"
            />
          </form>
          <div className="bell">
            <button type="button" className="icon-btn" aria-label="Notifications" onClick={() => setBell((v) => !v)}>
              <Bell size={16} />
              {nouvelles.length ? <i>{nouvelles.length}</i> : null}
            </button>
            {bell ? (
              <div className="bell__panel">
                <b>Nouvelles demandes</b>
                {nouvelles.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setBell(false)
                      navigate(demandeHref(item))
                    }}
                  >
                    {item.fullName}
                    <small>{item.reference}</small>
                  </button>
                ))}
                {!nouvelles.length ? <span>Aucune nouvelle demande.</span> : null}
              </div>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function useQueryState() {
  const search = useSearch()
  return {
    q: search.get('q') || '',
    statut: search.get('statut') || 'toutes',
  }
}

export function Modal({
  title,
  kicker,
  onClose,
  children,
}: {
  title: string
  kicker: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <button className="modal__overlay" aria-label="Fermer" onClick={onClose} />
      <div className="panel">
        <div className="panel__strip" />
        <div className="panel__body">
          <button type="button" className="panel__close" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
          <span className="panel__kicker">{kicker}</span>
          <h3 className="panel__title">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  )
}

function initials(name: string) {
  const parts = name.replace(/^@/, '').split(/\s+/).filter(Boolean)
  const letters = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
  return letters || 'A'
}
