/**
 * Visuel décoratif de la section héro : un trophée-étoile « cristal »
 * posé sur un socle sombre avec plaque dorée. Rendu en SVG.
 */
export default function HeroVisual() {
  return (
    <svg
      className="hero-visual"
      viewBox="0 0 420 460"
      role="img"
      aria-label="Trophée Africa Fashion Awards"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#dfe6ef" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#aab6c6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e8eef5" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="crystal-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d67b" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#a67c14" />
        </linearGradient>
        <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2a2e" />
          <stop offset="100%" stopColor="#0e0e10" />
        </linearGradient>
        <linearGradient id="plaque" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a67c14" />
          <stop offset="50%" stopColor="#f5d67b" />
          <stop offset="100%" stopColor="#c69a2a" />
        </linearGradient>
        <radialGradient id="halo" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo lumineux */}
      <ellipse cx="210" cy="200" rx="200" ry="210" fill="url(#halo)" />

      {/* Socle marbre noir */}
      <path d="M96 360 L324 360 L344 424 L76 424 Z" fill="url(#base)" />
      <path d="M96 360 L324 360 L322 372 L98 372 Z" fill="#3a3a40" opacity="0.7" />

      {/* Plaque dorée */}
      <rect x="150" y="384" width="120" height="30" rx="3" fill="url(#plaque)" />
      <rect x="162" y="392" width="96" height="3.4" rx="1.7" fill="#5a4410" opacity="0.7" />
      <rect x="162" y="400" width="72" height="3.4" rx="1.7" fill="#5a4410" opacity="0.55" />

      {/* Étoile cristal */}
      <g transform="translate(210 190)">
        <path
          d="M0 -170 L38 -54 L160 -50 L62 26 L96 150 L0 78 L-96 150 L-62 26 L-160 -50 L-38 -54 Z"
          fill="url(#crystal)"
          stroke="url(#crystal-edge)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* Facettes internes */}
        <g stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" fill="none">
          <path d="M0 -170 L0 78" />
          <path d="M-160 -50 L96 150" />
          <path d="M160 -50 L-96 150" />
          <path d="M-38 -54 L38 -54" />
        </g>
        {/* Reflet */}
        <path d="M0 -150 L22 -58 L-30 20 Z" fill="#ffffff" fillOpacity="0.35" />
      </g>
    </svg>
  )
}
