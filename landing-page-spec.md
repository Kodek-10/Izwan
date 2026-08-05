# Spécification Landing Page Izwan

> **Statut** : spécification de la landing page, désormais **implémentée** dans `frontend/src/routes/index.tsx` (route `/`). Ce document décrit l'architecture et les choix d'implémentation de cette page.

## Vue d'ensemble
Nouvelle page d'accueil pour l'application web Izwan. L'objectif est de présenter clairement la **valeur ajoutée** (cerveau numérique pour développeurs) et de **convertir** les visiteurs en utilisateurs (inscription / téléchargement).

---

## Architecture de la page

```
LandingPage
├── Navbar                          (sticky, backdrop blur)
├── HeroSection                     (full screen, fond animé)
│   ├── TrustBadges                 (badges "Gratuit", "Open Source", "Hors-ligne")
│   ├── Headline                    (titre + sous-titre)
│   ├── CTAButtons                  (téléchargement + app web)
│   └── DashboardMockup             (maquette visuelle de l'app, desktop only)
├── FeaturesSection                 (bento grid, 6 cartes)
│   ├── FeatureCardSnippets         (large 2 cols)
│   ├── FeatureCardOfflineAI        (tall 2 rows)
│   ├── FeatureCardSearch           (large 2 cols)
│   ├── FeatureCardMultiSurface     (1 col)
│   ├── FeatureCardSecurity         (1 col)
│   └── FeatureCardSmartTags        (large 2 cols)
├── CTASection                      (background gradient + card flottante)
├── Footer                          (logo, liens, copyright)
└── Background Effects
    └── WebGL canvas                (hero background animé)
```

---

## Sections détaillées

### 1. Navbar
- **Sticky** en haut, `z-50`
- Fond : `bg-background/80 backdrop-blur-xl`
- Structure :
  ```
  [Logo + Nom]  |  [Fonctionnalités] [Tarifs] [Doc]  |  [ThemeToggle] [Connexion] [Commencer]
  ```
- **Responsive** : sur mobile, les nav links passent en menu hamburger
- Composant `Logo` utilise `IzwaLogo` + `IzwaWordmark` de `@/components/izwan-logo`

### 2. Hero
- **Full screen** : `h-screen min-h-[600px]`
- Fond : canvas WebGL avec animation shader (dark/light)
- **Overlay** gradient `from-background/80 via-background/30 to-transparent`
- Grille 12 colonnes (lg:col-span-6 + lg:col-span-6)
- **Contenu gauche** :
  - Badges : "Gratuit", "Open Source", "Fonctionne hors-ligne"
  - Titre : "Votre cerveau numérique pour le code"
  - Sous-titre : description de la plateforme
  - 2 CTA : "Télécharger pour Windows" (brand-gradient) + "Ouvrir l'app web" (outline)
  - Version tag
- **Dashboard mockup** (droite, hidden mobile) : sidebar + zone de code + widget
- **Animations** : GSAP + Framer Motion

### 3. Features (Bento Grid)
- Titre : "Une plateforme pensée pour votre flux"
- Grille : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **6 cartes** :
  1. **Gestion des Snippets** (lg:col-span-2) — Code2 + placeholders
  2. **IA Locale** (row-span-2) — WifiOff + CPU visuel
  3. **Recherche & Organisation** (lg:col-span-2) — Search + barre mockup
  4. **Multi-surfaces** (1 col) — Monitor
  5. **Sécurité Avancée** (1 col) — ShieldCheck
  6. **Tags Intelligents** (lg:col-span-2) — FolderKanban + tags mockup
- Chaque carte : `bg-card rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md`

### 4. CTA Section
- Fond : `bg-gradient-to-br from-primary/5 to-background`
- Carte : `max-w-3xl rounded-3xl border border-border/50 bg-card/90 shadow-2xl`
- Titre : "Prêt à libérer votre productivité ?"
- 2 boutons : "Créer un compte gratuit" + "Voir sur GitHub"

### 5. Footer
- Logo + nom | Liens (Confidentialité, Licence, Documentation) | Copyright
- Layout : `flex flex-col md:flex-row justify-between items-center`

---

## Composants & dépendances

### Composants réutilisés
| Composant | Chemin |
|---|---|
| `Button` | `@/components/ui/button` |
| `IzwaLogo` | `@/components/izwan-logo` |
| `IzwaWordmark` | `@/components/izwan-logo` |
| `useTheme` | `@/components/theme-provider` |
| `useLandingAnimations` | `@/hooks/use-landing-animations` |

### Librairies
- `framer-motion` : animations entrée/sortie, stagger, hover
- `gsap` : scroll animations (via hook existant)
- `lucide-react` : icônes
- `@tanstack/react-router` : navigation (`Link`)

---

## Styles

### Layout
- Conteneur : `max-w-7xl mx-auto px-6 lg:px-8`
- Sections : `py-24`

### Typographie
- Titres : `font-display text-3xl md:text-4xl lg:text-5xl/6xl font-black tracking-tight`
- Sous-titres : `text-base md:text-lg text-foreground/80 max-w-2xl`

### Couleurs (shadcn/ui)
| Token | Usage |
|---|---|
| `bg-background` | fonds |
| `bg-card` | cartes features |
| `text-foreground` | texte |
| `text-muted-foreground` | texte secondaire |
| `text-primary` | accents |
| `border-border/50` | bordures |

---

## Animations

### GSAP (via useLandingAnimations)
- Attributs `data-gsap` : `hero-badge`, `hero-title`, `hero-subtitle`, `hero-cta`, `hero-version`, `hero-visual`, `features-title`, `features-grid`, `feature-card`, `cta-content`

### Framer Motion
- Mockup : `opacity:0 x:50` → `opacity:1 x:0` delay 0.3
- Features grid : staggerContainer (0.1s) + fadeInUp
- Hover : `whileHover={{ y: -4, scale: 1.01 }}`

### WebGL
- Canvas hero, ratio devicePixelRatio
- Shaders dark/light avec couleurs adaptées
- Uniformes : `u_time` + `u_resolution`

---

## Responsive

| Breakpoint | Comportement |
|---|---|
| `< md` | Hero empilé, mockup caché, nav links → hamburger |
| `md` | Grille features 2 colonnes |
| `lg` | Grille 3 colonnes, bento spans actifs |
| `xl+` | Taille max hero, espacement max |

---

## Pistes d'amélioration

| Piste | Priorité |
|---|---|
| Menu hamburger mobile | Haute |
| SEO meta (description, og:image, twitter:card) | Haute |
| Lazy-load canvas WebGL sur mobile | Moyenne |
| Remplacer lien "Tarifs" inactif par une section ou le supprimer | Basse |
| Ajouter `aria-label` et `role` (a11y) | Moyenne |

---

## Fichier cible
- **Route** : `frontend/src/routes/index.tsx` (remplacement complet)
- **Hooks** : `frontend/src/hooks/use-landing-animations.ts` (existant, inchangé)
