/**
 * Numéro WhatsApp au format E.164.
 * Un numéro local béninois (8 chiffres, ou 10 chiffres commençant par 01)
 * reçoit le préfixe +229. Le 0 national béninois est conservé.
 * Un numéro déjà international (+ ou 00) est conservé tel quel.
 */
export function normalizeWhatsAppPhone(raw: string): string | null {
  let value = String(raw || '')
    .trim()
    .replace(/[^\d+]/g, '')
  if (!value) return null
  if (value.startsWith('00')) value = `+${value.slice(2)}`
  if (value.startsWith('+')) {
    const digits = value.slice(1)
    if (!/^\d{8,15}$/.test(digits)) return null
    return `+${digits}`
  }
  if (/^229(?:\d{8}|0\d{9})$/.test(value)) return `+${value}`
  if (/^\d{8}$/.test(value)) return `+229${value}`
  if (/^01\d{8}$/.test(value)) return `+229${value}`
  if (/^\d{11,15}$/.test(value)) return `+${value}`
  return null
}

export function maskPhone(e164: string) {
  const digits = e164.replace(/\D/g, '')
  if (digits.length < 6) return 'numéro masqué'
  return `+${digits.slice(0, 3)}···${digits.slice(-4)}`
}
