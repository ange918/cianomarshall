type LogoProps = {
  className?: string
  title?: string
}

/**
 * Emblème AFA — étoile posée sur un socle de trophée, en or.
 * Rendu en SVG vectoriel (net à toutes les tailles).
 */
export default function Logo({ className, title = 'Africa Fashion Awards' }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 220"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="afa-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a67c14" />
          <stop offset="40%" stopColor="#d4af37" />
          <stop offset="60%" stopColor="#f5d67b" />
          <stop offset="100%" stopColor="#c69a2a" />
        </linearGradient>
      </defs>

      <g fill="url(#afa-gold)">
        {/* Socle du trophée */}
        <path d="M52 196 L64 168 L136 168 L148 196 Z" />
        {/* Étoile pleine (base large intégrée au trophée) */}
        <path d="M100 12 L118 62 L172 64 L130 100 L146 156 L100 124 L54 156 L70 100 L28 64 L82 62 Z" />
      </g>

      {/* Étoile intérieure ajourée */}
      <path
        d="M100 46 L109 72 L137 73 L115 91 L123 118 L100 101 L77 118 L85 91 L63 73 L91 72 Z"
        fill="#0a0a0a"
      />
    </svg>
  )
}
