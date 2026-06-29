---
name: Technical Precision
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#dcc0bb'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#a48b86'
  outline-variant: '#56423e'
  surface-tint: '#ffb4a5'
  primary: '#ffb4a5'
  on-primary: '#601407'
  primary-container: '#e87a64'
  on-primary-container: '#611508'
  inverse-primary: '#9e412f'
  secondary: '#b6c7eb'
  on-secondary: '#1f314d'
  secondary-container: '#364765'
  on-secondary-container: '#a4b6d9'
  tertiary: '#55dcbc'
  on-tertiary: '#00382d'
  tertiary-container: '#00ad90'
  on-tertiary-container: '#00392e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0400'
  on-primary-fixed-variant: '#7e2a1b'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#b6c7eb'
  on-secondary-fixed: '#081b37'
  on-secondary-fixed-variant: '#364765'
  tertiary-fixed: '#75f9d8'
  tertiary-fixed-dim: '#55dcbc'
  on-tertiary-fixed: '#002019'
  on-tertiary-fixed-variant: '#005142'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style
The design system is engineered for high-performance environments where technical clarity meets premium aesthetics. It utilizes a **Corporate / Modern** foundation with a distinct **High-Contrast** edge, driven by a bold, dual-tone color strategy. 

The brand personality is authoritative and precise, yet the introduction of warmer coral tones prevents it from feeling sterile. It aims to evoke a sense of "premium utility"—tools that are as beautiful as they are functional. The aesthetic is defined by sharp layouts, generous whitespace, and a meticulous attention to typographic hierarchy, ensuring that complex data remains accessible and visually engaging.

## Colors
The palette is built on a high-contrast relationship between **Desert Sand (#E87A64)** and **Dark Blue (#132541)**. 

- **Primary Accent:** Desert Sand is used sparingly for high-impact elements like primary buttons, active states, and critical data points.
- **Deep Core:** Dark Blue serves as the structural foundation, used for sidebar backgrounds, headers, and secondary containers.
- **Surface & Background:** In dark mode, the primary canvas is a deep obsidian blue to maintain depth, while light mode (if utilized) transitions to a crisp neutral off-white.
- **Functional Tones:** Success, warning, and error states should be desaturated to ensure they do not compete with the primary Desert Sand accent.

## Typography
The typographic system leverages a trio of fonts to balance impact and legibility:
- **Display & Headlines:** Montserrat provides a geometric, confident structure for all high-level headings.
- **Interface & Body:** Inter is the workhorse for all UI elements, chosen for its exceptional readability in dense applications.
- **Technical & Data:** JetBrains Mono is utilized for labels, metadata, and code snippets to reinforce the technical narrative of the design system.

Tighten letter spacing on large displays for a more "designed" editorial feel, while maintaining open spacing for technical labels to ensure clarity.

## Layout & Spacing
This design system utilizes a **Fluid Grid** model based on a strict 4px baseline. 

- **Desktop:** A 12-column grid with 24px gutters. Content should be centered within a maximum container width of 1440px.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px margins. 

Spacing between unrelated sections should be aggressive (80px+), while related interface components should use tight, 8px or 16px increments to maintain a compact, "dashboard" feel.

## Elevation & Depth
Depth is communicated through **Tonal Layers** rather than heavy shadows. 

In the dark theme, higher elevation is represented by lighter shades of the base navy color. Level 0 is the background; Level 1 is a card or container; Level 2 is a hover state or popover. 

When shadows are necessary (e.g., for modals), use a **tinted ambient shadow**—a deep navy shadow (#08101B) with 40% opacity and a 20px blur to ensure the element feels integrated into the environment rather than floating awkwardly above it.

## Shapes
The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern touch while maintaining the architectural "squareness" required for a technical product. 

- **Small Components:** Checkboxes and small buttons use the base 4px (0.25rem) radius.
- **Large Components:** Cards and main containers use `rounded-lg` (8px / 0.5rem) to soften the layout.
- **Selection States:** Use sharp inner corners for nested elements to maintain a disciplined, structural look.

## Components
- **Buttons:** Primary buttons use the Desert Sand background with Dark Blue text for maximum contrast. Secondary buttons use a transparent background with a 1px Dark Blue or Desert Sand border.
- **Input Fields:** Use a dark, semi-transparent fill with a 1px border. On focus, the border transitions to Desert Sand with a subtle glow.
- **Chips:** Highly technical; use JetBrains Mono for the text. Use the Dark Blue background with a slightly lighter border to differentiate from the main surface.
- **Cards:** No borders. Use a slightly lighter fill than the background (Tonal Layering) to define the boundary.
- **Checkboxes/Radios:** Use the Desert Sand color for the "checked" state. The unchecked state should be a subtle ghost-outline in a neutral grey-blue.
- **Data Tables:** Use thin, low-opacity dividers (10% white) to maintain horizontal flow without cluttering the UI with heavy lines.