import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import Logo from '../../components/Logo'
import { ApiError, api } from '../../lib/api'
import { navigate, usePathname } from '../../lib/router'
import DashboardPage from './DashboardPage'
import FichePage from './FichePage'
import { DonsPage, ExportHint, PeoplePage, SettingsPage, TemplatesPage } from './ExtraPages'
import ListPage from './ListPage'
import { AdminProvider, type SessionUser } from './ui'

export default function AdminApp() {
  const path = usePathname()
  const [session, setSession] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    document.title = 'Back-office — Africa Fashion Awards 2026'
    document.body.classList.add('page-admin')
    let meta = document.querySelector('meta[name="robots"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', 'noindex')
    return () => document.body.classList.remove('page-admin')
  }, [])

  useEffect(() => {
    let cancelled = false
    api<SessionUser>('/api/admin/session')
      .then((user) => {
        if (!cancelled) setSession(user)
      })
      .catch(() => {
        if (!cancelled) setSession(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <div className="admin-boot">Chargement du back-office…</div>
  }

  if (!session) return <LoginPage onSuccess={setSession} />

  const fiche = path.match(/^\/admin\/demandes\/([^/]+)$/)
  let page = <DashboardPage />
  if (fiche) page = <FichePage id={decodeURIComponent(fiche[1])} />
  else if (path.startsWith('/admin/demandes')) page = <ListPage />
  else if (path.startsWith('/admin/personnes')) page = <PeoplePage />
  else if (path.startsWith('/admin/export')) page = <ExportHint />
  else if (path.startsWith('/admin/dons')) page = <DonsPage />
  else if (path.startsWith('/admin/modeles')) page = <TemplatesPage />
  else if (path.startsWith('/admin/parametres')) page = <SettingsPage />

  return <AdminProvider session={session}>{page}</AdminProvider>
}

function LoginPage({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await api<SessionUser>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, remember }),
      })
      onSuccess(user)
      if (window.location.pathname === '/admin/login') navigate('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login__visual">
        <div className="login__visual-copy">
          <span className="acc-kicker">Back-office AFA 2026</span>
          <p className="login__title">
            L’Ère des
            <br />
            <span className="gold-text">Audacieux</span>
          </p>
          <p className="note">Gestion des accréditations médias.</p>
        </div>
      </div>
      <div className="login__form">
        <form className="login__card" onSubmit={(event) => void submit(event)}>
          <a
            className="brand"
            href="/"
            onClick={(event) => {
              event.preventDefault()
              navigate('/')
            }}
          >
            <span className="brand__logo-ring">
              <Logo />
            </span>
            <span className="brand__text">
              <span className="brand__mark">AFA Admin</span>
              <span className="brand__sub">Royal Fashion Event</span>
            </span>
          </a>
          <h1>Connexion</h1>
          <p className="section__intro">Accès réservé à l’équipe d’organisation.</p>
          <label className="field">
            <span>Adresse e-mail</span>
            <input className="input" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field">
            <span>Mot de passe</span>
            <span className="input input--wrap">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" aria-label={show ? 'Masquer' : 'Afficher'} onClick={() => setShow((value) => !value)}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          <div className="login__row">
            <button type="button" className="check" onClick={() => setRemember((value) => !value)}>
              <i className={remember ? 'on' : ''}>{remember ? '✓' : ''}</i>
              <span>Rester connecté</span>
            </button>
            <button type="button" className="text-link" onClick={() => setForgot((value) => !value)}>
              Mot de passe oublié&nbsp;?
            </button>
          </div>
          <button className="btn btn--gold btn--lg btn--block" type="submit" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'} <ArrowRight size={16} />
          </button>
          {error ? (
            <div className="notice notice--ko" role="alert">
              <span>{error}</span>
            </div>
          ) : null}
          {forgot ? (
            <p className="note">Le mot de passe est remis par l’équipe d’organisation. Compte de démonstration documenté pour la recette.</p>
          ) : null}
          <p className="note">Connexion chiffrée · session 8 h, ou 30 jours si « Rester connecté ».</p>
        </form>
      </div>
    </div>
  )
}
