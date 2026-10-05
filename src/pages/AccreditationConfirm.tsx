import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, Download } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { readConfirmation } from './AccreditationPage'
import { navigate } from '../lib/router'

export default function AccreditationConfirm() {
  const [data, setData] = useState(readConfirmation)

  useEffect(() => {
    document.title = 'Demande envoyée — Africa Fashion Awards 2026'
    document.body.classList.add('page-acc')
    setData(readConfirmation())
    return () => document.body.classList.remove('page-acc')
  }, [])

  const download = () => {
    if (!data) return
    const text = [
      'Africa Fashion Awards 2026 — Accréditation médias',
      '',
      `Référence : ${data.reference}`,
      `Demandeur : ${data.fullName}`,
      `Média : ${data.mediaName}`,
      `Personnes à accréditer : ${data.teamCount}`,
      `Statut : ${data.statusLabel}`,
      '',
      'Cette demande sera examinée par l’équipe AFA.',
      'La décision sera envoyée par WhatsApp.',
      'L’envoi ne vaut pas confirmation automatique d’accréditation.',
    ].join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.reference}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Header solid />
      <main className="acc-confirm">
        <div className="panel">
          <div className="panel__strip" />
          <div className="panel__body">
            {data ? (
              <div className="state">
                <span className="state__ring state__ring--ok">
                  <Check size={32} strokeWidth={2.4} />
                </span>
                <span className="panel__kicker">Demande envoyée</span>
                <h1 className="panel__title">Merci, {data.fullName.split(' ')[0]}&nbsp;!</h1>
                <p className="panel__lead">
                  Votre demande d’accréditation pour <b>{data.mediaName}</b> a bien été reçue. Elle
                  sera examinée par l’équipe AFA : l’envoi ne vaut pas confirmation automatique.
                </p>
                <ul className="receipt">
                  <li>
                    Référence <b>{data.reference}</b>
                  </li>
                  <li>
                    Personnes à accréditer <b>{data.teamCount}</b>
                  </li>
                  <li>
                    Statut{' '}
                    <b>
                      <span className="badge badge--wait">
                        <i />
                        {data.statusLabel}
                      </span>
                    </b>
                  </li>
                  <li>
                    Décision envoyée par <b>WhatsApp</b>
                  </li>
                </ul>
                <div className="panel__actions panel__actions--row">
                  <button type="button" className="btn btn--ghost" onClick={download}>
                    Télécharger le récapitulatif <Download size={16} />
                  </button>
                  <button type="button" className="btn btn--gold" onClick={() => navigate(`/accreditation/statut?code=${encodeURIComponent(data.reference)}`)}>
                    Suivre le statut <ArrowUpRight size={16} />
                  </button>
                </div>
                <p className="note">
                  La décision (validée, complément ou refus) vous sera envoyée par WhatsApp au numéro indiqué.
                  Cette page de suivi n’affiche que le statut, pas vos informations.
                </p>
              </div>
            ) : (
              <div className="state">
                <span className="panel__kicker">Accréditation</span>
                <h1 className="panel__title">Aucune demande récente</h1>
                <p className="panel__lead">
                  Le récapitulatif est conservé sur cet appareil juste après l’envoi.
                </p>
                <button type="button" className="btn btn--gold" onClick={() => navigate('/accreditation')}>
                  Remplir le formulaire
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
