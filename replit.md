# Africa Fashion Awards 2026 — L'Ère des Audacieux

## Overview

Landing page de la 7ème édition des Africa Fashion Awards (AFA 2026), dont la
thématique artistique est « L'Ère des Audacieux ». Le site présente l'événement,
valorise la vision portée par Gauthier ORE et Royal Fashion Event, et incite le
public, les mécènes et les entreprises à soutenir financièrement l'événement
(appel aux dons — CTA majeur).

L'événement a lieu le **15 novembre 2026**.

## Tech Stack

- **React 18 + TypeScript** : interface construite en composants typés.
- **Vite** : outil de build et serveur de développement (port 5000).
- **CSS vanilla** : une feuille de style unique (`src/index.css`) définissant le
  thème « luxe africain » (noir profond & or métallique), sans framework CSS.
- **Google Fonts** : Cinzel (titres) et Plus Jakarta Sans (corps de texte).

## Scripts

- `npm run dev` — serveur de développement Vite (http://localhost:5000)
- `npm run build` — typecheck (`tsc -b`) puis build de production dans `dist/`
- `npm run preview` — prévisualise le build de production
- `npm run typecheck` — vérification TypeScript seule

## Project Structure

- `index.html` — point d'entrée HTML avec balises SEO, Open Graph et polices.
- `src/main.tsx` — montage de l'application React.
- `src/App.tsx` — assemble les sections de la page.
- `src/data/content.ts` — contenu éditorial centralisé et typé (textes, contacts,
  piliers, étapes, formules de soutien).
- `src/components/` — un composant par section :
  - `Header` — navigation fixe + bouton « Soutenir / Faire un don » (menu mobile).
  - `Hero` — bannière d'accueil avec titre, date et CTA principal.
  - `About` — présentation des AFA et des corps de métier honorés.
  - `Theme` — thématique « AUDACE » et ses piliers.
  - `Impact` — impact digital/médiatique/personnel et avantages par public.
  - `Process` — parcours des participants en 4 étapes.
  - `Support` — appel aux dons, formules d'engagement et actions directes.
  - `Footer` — mentions légales et contacts.

## Design System

- **Palette** : noir profond (#0A0A0A) / anthracite (#121212) en fond ; or brillant
  (#D4AF37) et dégradés dorés en accents ; blanc et gris clair pour le texte.
- **Typographies** : Cinzel (serif majestueuse) pour les titres, Plus Jakarta Sans
  (sans-serif moderne) pour le corps.
- **Responsive** : approche mobile-first, grilles CSS et flexbox, menu hamburger.
- **Animations** : transitions et apparitions douces, désactivées si
  `prefers-reduced-motion`.

## Contact

- Téléphone / Mobile Money : +229 01 69 89 69 50
- Email / Partenariats : africafashionawards@gmail.com
- Réseaux sociaux : @africafashionawards-afa

## Deployment

Déployé sur Vercel (framework Vite, dossier de sortie `dist/`). Voir `vercel.json`.
