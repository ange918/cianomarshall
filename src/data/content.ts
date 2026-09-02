// Contenu éditorial de la landing page AFA 2026.
// Centralisé et typé pour faciliter les mises à jour.

export const CONTACT = {
  phone: '+229 01 69 89 69 50',
  phoneHref: 'tel:+2290169896950',
  email: 'africafashionawards@gmail.com',
  emailHref: 'mailto:africafashionawards@gmail.com',
  social: '@africafashionawards-afa',
} as const

export const EVENT = {
  edition: '7ème édition',
  title: 'Africa Fashion Awards 2026',
  theme: 'L’Ère des Audacieux',
  date: '15 Novembre 2026',
  organizer: 'Royal Fashion Event',
  founder: 'Gauthier ORE',
} as const

// Bandeau « ils soutiennent l'audace » — partenaires officiels.
export const PARTNERS: string[] = [
  'Adjia',
  'One Touch',
  'AT',
  'Magik Golden',
  'Senan Concept',
  'Raim Bénin',
  'Sejeps Feli’x',
  '2 L’Or Event',
  'Susuni Lab',
  'Akanda & Fils',
  'Dahomey Tech',
  'DD Style Africa',
  'Tekof Promo Mode',
  'Cogito Arts',
  'ONG C-DACS',
  'Max 229',
  'Clean Ride',
  'CC Style',
  'Sin Nunu',
]

export type NavLink = { label: string; href: string }

export const NAV_LINKS: NavLink[] = [
  { label: 'L’Événement', href: '#evenement' },
  { label: 'Thématique', href: '#thematique' },
  { label: 'Impact', href: '#impact' },
  { label: 'Parcours', href: '#parcours' },
  { label: 'Soutenir', href: '#soutenir' },
]

export type Pillar = { title: string; description: string }

// Section 4 — Thématique « AUDACE » : piliers de l'édition.
export const AUDACE_PILLARS: Pillar[] = [
  {
    title: 'Liberté créative',
    description:
      'AUDACE est l’expression de la liberté créative, du courage esthétique et de la capacité à surprendre.',
  },
  {
    title: 'Bousculer les codes',
    description:
      'Chaque création doit être une déclaration forte, un geste qui ose bousculer les codes établis.',
  },
  {
    title: 'Le Tapis Rouge — Laboratoire',
    description:
      'Transformer le tapis rouge en laboratoire de créativité où chaque silhouette devient une œuvre d’art vivante.',
  },
  {
    title: 'Excès maîtrisé',
    description:
      'Une scène où l’originalité, l’excès maîtrisé et l’affirmation de soi prennent vie, avec élégance.',
  },
]

export type Advantage = { audience: string; icon: string; points: string[] }

// Section 5 — Impact & Avantages.
export const ADVANTAGES: Advantage[] = [
  {
    audience: 'Stylistes & Créateurs',
    icon: '✦',
    points: [
      'Interprétation personnelle : traduire l’audace selon son univers, son ADN et son positionnement.',
      'Innovation : explorer des matières inattendues, des coupes radicales, des associations inédites.',
      'Narration visuelle : chaque tenue raconte une histoire et marque les esprits.',
      'Cohérence : même dans l’extravagance, rester élégant et adapté au cadre prestigieux.',
      'Le Styliste comme Artiste : provoquer, séduire et inspirer, tout en respectant l’élégance.',
      'Le Tapis Rouge — Laboratoire : chaque silhouette devient une œuvre d’art vivante.',
    ],
  },
  {
    audience: 'Influenceurs & Invités',
    icon: '◆',
    points: [
      'Expérience immersive : incarner des silhouettes fortes et singulières.',
      'Visibilité accrue : les looks audacieux attirent médias et public.',
      'Engagement personnel : assumer pleinement le style et le défendre avec confiance.',
      'Interaction sociale : partager et valoriser la démarche créative des stylistes.',
    ],
  },
]

export type Impact = { title: string; description: string; icon: string }

export const IMPACTS: Impact[] = [
  {
    title: 'Impact Digital',
    icon: '↗',
    description:
      'Des contenus viraux sur Instagram et TikTok, portés par un hashtag officiel qui propulse l’événement dans les tendances et touche une large audience.',
  },
  {
    title: 'Impact Médiatique',
    icon: '◉',
    description:
      'Reportages dans la presse locale et internationale et segments à la télévision, mettant en avant la mode africaine devant un public global.',
  },
  {
    title: 'Impact Personnel',
    icon: '✷',
    description:
      'Un rayonnement personnel renforcé, de nouvelles collaborations et une reconnaissance officielle ouvrant la porte à d’innombrables opportunités.',
  },
]

export type Step = { number: string; title: string; description: string }

// Section 6 — Parcours des participants.
export const PROCESS_STEPS: Step[] = [
  {
    number: '01',
    title: 'Manifestation d’intérêt',
    description: 'Manifestez votre intérêt auprès de l’équipe AFA.',
  },
  {
    number: '02',
    title: 'Présentation du concept',
    description: 'Présentez votre concept de tenue sur le thème de l’audace.',
  },
  {
    number: '03',
    title: 'Validation artistique',
    description: 'Votre concept est validé par le comité artistique des AFA.',
  },
  {
    number: '04',
    title: 'Invitation VIP & Tapis Rouge',
    description:
      'Recevez votre invitation VIP pour la grande soirée du 15 novembre et bénéficiez d’une couverture médiatique sur divers canaux africains.',
  },
]

export type SupportTier = {
  name: string
  audience: string
  description: string
  featured?: boolean
  // 'donate' ouvre le paiement FeexPay ; 'email' ouvre le contact partenariats.
  action: 'donate' | 'email'
  // Montant suggéré (FCFA) pré-sélectionné à l'ouverture du don.
  suggested?: number
}

// Section 7 — Formules d'engagement / soutien.
export const SUPPORT_TIERS: SupportTier[] = [
  {
    name: 'Don Libre',
    audience: 'Public général',
    description:
      'Un soutien ponctuel, à la hauteur de vos moyens, pour accompagner l’émergence des créateurs africains.',
    action: 'donate',
  },
  {
    name: 'Mécénat Majeur',
    audience: 'Donateurs privilégiés',
    description:
      'Un engagement fort de particuliers privilégiés, reconnus comme piliers de l’excellence culturelle africaine.',
    featured: true,
    action: 'donate',
    suggested: 50000,
  },
  {
    name: 'Sponsoring & Partenariat',
    audience: 'Entreprises',
    description:
      'Associez votre marque à l’audace et à la modernité africaines à travers un partenariat sur-mesure.',
    action: 'email',
  },
]
