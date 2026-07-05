---
name: Technical Precision Light
colors:
  surface: '#fff8f8'
  surface-dim: '#e0d8d9'
  surface-bright: '#fff8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf1f2'
  surface-container: '#f4eced'
  surface-container-high: '#efe6e7'
  surface-container-highest: '#e9e0e1'
  on-surface: '#1e1b1c'
  on-surface-variant: '#514346'
  inverse-surface: '#332f30'
  inverse-on-surface: '#f7eff0'
  outline: '#837376'
  outline-variant: '#d5c2c5'
  surface-tint: '#844f5c'
  primary: '#3b131f'
  on-primary: '#ffffff'
  primary-container: '#552834'
  on-primary-container: '#cc8e9c'
  inverse-primary: '#f7b5c3'
  secondary: '#7e525e'
  on-secondary: '#ffffff'
  secondary-container: '#ffc5d3'
  on-secondary-container: '#7b4f5b'
  tertiary: '#232020'
  on-tertiary: '#ffffff'
  tertiary-container: '#393535'
  on-tertiary-container: '#a49d9d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e0'
  primary-fixed-dim: '#f7b5c3'
  on-primary-fixed: '#350e1a'
  on-primary-fixed-variant: '#683844'
  secondary-fixed: '#ffd9e1'
  secondary-fixed-dim: '#f0b8c5'
  on-secondary-fixed: '#31111b'
  on-secondary-fixed-variant: '#643b46'
  tertiary-fixed: '#e9e1e1'
  tertiary-fixed-dim: '#ccc5c5'
  on-tertiary-fixed: '#1e1b1b'
  on-tertiary-fixed-variant: '#4a4646'
  background: '#fff8f8'
  on-background: '#1e1b1c'
  surface-variant: '#e9e0e1'
typography:
  display:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Poppins
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Poppins
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-md:
    fontFamily: Fira Code
    fontSize: 14px
    fontWeight: '450'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

This design system is a light-mode evolution of a high-performance technical brand. It balances the "Wine" primary tone's richness with a "White Smoke" environment to create a workspace that feels premium, academic, and hyper-focused. 

The aesthetic is **Corporate Modern with a Minimalist lean**. It prioritizes information density and clarity through high-contrast typography and precise spacing. The emotional goal is to evoke a sense of "digital craftsmanship"—where every element has a functional purpose and a structured place. Visual interest is generated not through decorative elements, but through the perfect execution of grids, crisp borders, and subtle tonal shifts.

## Colors

The palette is anchored by the **Wine (#552834)** primary color, which serves as the principal driver for actions, branding, and focused states. To maintain technical precision, the neutral palette is derived from the core Wine hue to ensure warmth and cohesion.

- **Primary (Wine):** Used for primary buttons, active navigation states, and high-level headers.
- **Surface (White Smoke):** The foundational canvas (#F7F4F4). It provides a softer, more sophisticated backdrop than pure white, reducing eye strain during long technical sessions.
- **Secondary/Accent:** A desaturated mid-tone of Wine used for secondary actions and subtle iconography.
- **Neutral:** A deep charcoal-burgundy for body text to ensure maximum legibility against the smoke background while avoiding the harshness of pure black.

## Typography

The typography strategy uses a three-tier system to organize information hierarchy:
1. **Poppins (Headings):** Provides a clean, geometric structure for titles. The bold weights should be used to anchor sections.
2. **Inter (Body):** Selected for its exceptional legibility in UI contexts. It handles data-heavy layouts and long-form technical documentation with ease.
3. **Fira Code (Technical/Mono):** Used for data values, code snippets, and specific technical metadata to reinforce the brand's precision.

**Scalability:** Headings utilize a tight line-height and negative letter-spacing at large sizes for a "compact" technical feel, while body text uses generous line-height to ensure readability.

## Layout & Spacing

The design system employs a **Fluid Grid** model based on an 8px rhythmic scale. 

- **Grid:** A 12-column layout for desktop (1440px+), 8-column for tablet, and 4-column for mobile.
- **Margins:** Desktop utilizes wide 64px margins to allow the "White Smoke" background to frame the content, creating a premium feel. Mobile margins tighten to 16px to maximize utility.
- **Density:** Components use a "comfortable" density by default, but spacing tokens are designed to scale down for "compact" data views if required by the technical nature of the content.

## Elevation & Depth

This system avoids heavy drop shadows in favor of **Tonal Layering** and **Micro-Borders**.

- **Level 0 (Base):** White Smoke (#F7F4F4) background.
- **Level 1 (Cards/Containers):** Pure White (#FFFFFF) surfaces. These should have a 1px border using the Tertiary color (#E0D8D8) to define edges without adding visual weight.
- **Elevation Shadows:** Only used for interactive overlays (modals, dropdowns). Use a very diffused, low-opacity Wine-tinted shadow: `0px 10px 30px rgba(85, 40, 52, 0.08)`.
- **Active State:** Elements being interacted with may gain a subtle "inner glow" or a slightly darker border to indicate focus.

## Shapes

The design system uses a consistent **Rounded** logic (~10px on standard components) to soften the high-contrast technical layout.

- **Standard (8px - 10px):** Primary buttons, input fields, and small cards.
- **Large (16px):** Main content containers and large feature sections.
- **Full (Pill):** Used exclusively for tags, badges, and search bars to differentiate them from actionable buttons.

## Components

### Buttons
- **Primary:** Solid Wine (#552834) background with Pure White text. 10px radius.
- **Secondary:** Transparent background with 1px Wine border and Wine text.
- **Ghost:** No border or background; Wine text. Used for low-priority actions.

### Input Fields
- Background: Pure White.
- Border: 1px #E0D8D8. 
- Focus State: 2px Wine (#552834) border with a soft Wine-tinted outer glow.
- Labels: Inter SemiBold, 12px, Uppercase (Label-Caps).

### Cards
- Surfaces are Pure White with a 1px #E0D8D8 border.
- Headers within cards should use Poppins Medium for clear sectioning.

### Chips & Badges
- Use a Pill-shape (rounded-full).
- Default: White Smoke background with Deep Grey text.
- Status: Use subtle tinted backgrounds (e.g., light green for success) with high-contrast text.

### Data Tables
- Use Inter for all row content and Fira Code for numeric data.
- Row separators: 1px #E0D8D8.
- Header background: A slightly darker tint of White Smoke (#F0EDED).