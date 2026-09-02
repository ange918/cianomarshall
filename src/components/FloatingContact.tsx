import { MessageCircle } from 'lucide-react'
import { CONTACT } from '../data/content'

// Pastille flottante de contact rapide (WhatsApp), en bas à droite.
// Le numéro est dérivé de CONTACT.phone (chiffres uniquement).
const WA_NUMBER = CONTACT.phone.replace(/[^0-9]/g, '')

export default function FloatingContact() {
  return (
    <a
      className="floating-contact"
      href={`https://wa.me/${WA_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous contacter sur WhatsApp"
    >
      <MessageCircle size={24} strokeWidth={2} aria-hidden="true" />
    </a>
  )
}
