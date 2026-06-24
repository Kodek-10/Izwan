---
name: Izwan Design System
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Poppins
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  code-block:
    fontFamily: Fira Code
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.7'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  sidebar-width: 280px
---

## Brand & Style
This design system is engineered for a premium, AI-assisted developer experience. The brand personality is professional, technical, and forward-leaning, prioritizing focus through a "Deep Dark" aesthetic. The visual style is a hybrid of **Modern Corporate** and **Subtle Glassmorphism**, utilizing depth and vibrant gradients to signify AI intelligence and high-performance capabilities.

The emotional response should be one of confidence and calm. By using spacious layouts and a sophisticated violet-to-cyan spectrum, the UI feels less like a basic utility and more like a high-end integrated development environment. All interface copy is to be authored in French, maintaining a tone that is precise and "expert-to-expert."

## Colors
The palette is centered around a "Deep Dark" foundation using `#020617` (Slate 950) to ensure code syntax highlighting pops with maximum legibility. The **Primary Brand Gradient** (Violet to Blue to Cyan) is the signature element, reserved for high-impact touchpoints: primary actions, active state indicators, and key marketing headlines.

- **Primary (Violet):** Core brand identification and focus states.
- **Secondary (Blue):** Informational elements and secondary accents.
- **Tertiary (Cyan):** AI-specific features and "Success" suggestions.
- **Neutral:** A range of deep slates to maintain professional gravity.
- **Support Colors:** Error states use a muted Red-Rose (`#E11D48`) to ensure it doesn't clash with the violet primary.

## Typography
The typography strategy balances editorial impact with technical utility. **Poppins** provides a clean, geometric structure for headlines, appearing modern and confident. **Inter** handles the heavy lifting for UI text, chosen for its exceptional readability at small sizes and high x-height. 

For all snippet displays, **Fira Code** is mandatory to support ligatures and provide the "developer-native" feel expected in a snippet manager. 
- Use `display-lg` for dashboard welcomes (e.g., "Bonjour, Développeur").
- Use `label-sm` in Uppercase for technical metadata like "ADMIN" or "C++".
- Code blocks should maintain a generous line height (1.7) to prevent visual fatigue during long debugging sessions.

## Layout & Spacing
This design system utilizes a **Fluid Grid** model with a strictly defined 12-column layout for desktop. The core philosophy is "Spacious Precision"—using ample whitespace to separate logical blocks of code and metadata.

- **Desktop:** 12 columns, 24px gutters, and 40px outer margins.
- **Tablet:** 8 columns, 16px gutters.
- **Mobile:** 4 columns, 16px gutters. Content reflows vertically; the sidebar transitions to a bottom-sheet or full-screen overlay.
- **Sidebar:** A fixed-width navigation (280px) remains docked on the left to provide instant access to folders and tags.

## Elevation & Depth
In the Deep Dark theme, depth is communicated through **Tonal Layering** and **Subtle Glows** rather than heavy shadows.
- **Level 0 (Base):** `#020617` — The canvas.
- **Level 1 (Cards/Sidebar):** `#0F172A` — Low elevation, used for the main code editor area.
- **Level 2 (Modals/Popovers):** `#1E293B` — Highest elevation, featuring a 1px border of `#334155`.
- **Glow Effect:** Primary active elements (like the current selected snippet) utilize a 20px blur, 15% opacity Violet (`#8B5CF6`) outer glow to simulate an illuminated hardware interface.

## Shapes
The shape language is refined and approachable. A standard `0.5rem` (8-10px) radius is applied to cards, input fields, and containers to soften the technical nature of the application. 
- **Buttons:** Use `rounded-lg` (16px) for a more modern, "pill-adjacent" feel.
- **Tags/Chips:** Use full `rounded-full` (pill) shapes to distinguish them from interactive buttons.
- **Inputs:** Maintain the standard `rounded-md` (8px) for structural consistency.

## Components
Consistent implementation of components is vital for the "Premium AI" feel:

- **Buttons:**
  - **Primary:** Background is the Brand Gradient. Text is white. No border. On hover, increase brightness by 10%.
  - **Secondary:** Transparent background with a 1px border of `#334155`. Text is `#94A3B8`.
  - **Danger:** Background `#991B1B`, used for "Supprimer" (Delete) actions.
- **Inputs:**
  - Background: `#0F172A`. Border: 1px solid `#334155`. 
  - Focus State: Border becomes `#8B5CF6` with a subtle 4px violet outer glow.
- **Cards:**
  - Background: `#1E293B` at 60% opacity with a `backdrop-filter: blur(10px)`. 
  - Borders: 1px top-weighted border to catch "light."
- **Badges/Chips:**
  - Technical metadata (e.g., "PYTHON") uses a subtle tinted background (10% opacity of primary color) and bold 11px text.
- **Navigation:**
  - Sidebar links use a "Vertical Indicator" on the left—a 3px thick gradient line that appears only on the active state.