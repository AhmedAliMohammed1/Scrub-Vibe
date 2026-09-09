---
name: Scrub Vibe
description: Elevated Clinical-Editorial commerce system for Egyptian healthcare apparel
colors:
  teal-deep: "#073b36"
  teal-primary: "#0e7468"
  teal-soft: "#dce9e5"
  teal-surface: "#f0f5f3"
  paper-canvas: "#f6f7f4"
  surface-card: "#ffffff"
  ink-primary: "#10201e"
  ink-muted: "#536460"
  border-subtle: "#d8deda"
  border-strong: "#10201e"
  accent-terracotta: "#a5472f"
  status-success: "#18794e"
  status-warning: "#a15c00"
  status-danger: "#b42318"
typography:
  display:
    fontFamily: "Iowan Old Style, Baskerville, Georgia, Noto Naskh Arabic, serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Iowan Old Style, Baskerville, Georgia, Noto Naskh Arabic, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.75rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, Aptos, Segoe UI, Noto Sans Arabic, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, Aptos, Segoe UI, Noto Sans Arabic, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Aptos, Segoe UI, Noto Sans Arabic, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.teal-deep}"
    textColor: "{colors.surface-card}"
    rounded: "{rounded.xs}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.teal-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.teal-deep}"
    rounded: "{rounded.xs}"
    padding: "14px 28px"
  button-secondary-hover:
    backgroundColor: "{colors.teal-soft}"
---

# Design System: Scrub Vibe

## Overview

**Creative North Star: "The Surgeon’s Atelier"**

Scrub Vibe synthesizes medical-grade functional utility with refined editorial apparel presentation. Born in an Egyptian apparel manufacturing house dedicated exclusively to healthcare practitioners, the visual language balances the surgical sterility and precision of the operating theatre with the warmth, dignity, and tailored confidence deserving of long, demanding hospital shifts.

The aesthetic rejects both the hyper-commercialized neon tech-gimmickry of generic consumer e-commerce and the dry, utilitarian catalog formatting of legacy uniform distributors. Surfaces feature generous, calibrated white space, disciplined hairline structural borders, warm paper-tinted canvases, rich surgical-teal focal points, and authentic photography capturing Egyptian medical practitioners in action.

**Key Characteristics:**
- Disciplined chromatic hierarchy: 80% calm neutral paper/canvas, 15% surgical deep teal anchors, 5% warm terracotta/sage functional accents.
- Dual-culture typographic mastery: balanced bilingual serif editorial display paired with ultra-legible grotesque interface typography in both Arabic (RTL) and English (LTR).
- Uncompromising tactile utility: clear 44px+ minimum touch surfaces, high-contrast states, and immediate scanability under shift fatigue.
- Authentic institutional trust: clear local payment identities (Vodafone Cash, InstaPay, COD with deposit), transparent delivery timetables, and exact size calculators.

## Colors

The palette draws directly from the Egyptian surgical and clinical theatre: deep hospital scrubs teal, cool surgical draping greens, sterile white cotton, and warm desert paper tones.

### Primary
- **Deep Surgical Teal** (`#073b36`): The anchor of the brand. Used for primary CTAs, site header accents, footer backgrounds, and high-emphasis focal containers.
- **Surgical Green Accent** (`#0e7468`): The operational accent. Used for active navigation links, secondary badges, interactive size guide triggers, and highlight borders.

### Secondary
- **Soft Clinical Sage** (`#dce9e5`): Tonal ground for secondary containers, selected radio chips, banner contrast blocks, and notification panels.
- **Pale Wash Sage** (`#f0f5f3`): Subtle row-alternating and soft-hover tint.

### Tertiary
- **Terracotta Accent** (`#a5472f`): Reserved strictly for price reductions, urgent low-stock indicators, delete/trash actions, and critical notifications.
- **Status Emerald** (`#18794e`): Operational confirmations, order verified states, in-stock confirmations.

### Neutral
- **Paper Canvas** (`#f6f7f4`): The foundational background tone of all customer-facing viewports. Warmer and softer than harsh clinical #ffffff, reducing eye fatigue during night shifts.
- **Surface Card** (`#ffffff`): Elevated card and dialog backgrounds. Stands crisp against the paper canvas.
- **Ink Primary** (`#10201e`): High-contrast, deep charcoal text color. Replaces harsh pure black for superior readability.
- **Ink Muted** (`#536460`): Secondary descriptors, metadata labels, breadcrumbs, and helper copy.
- **Border Subtle** (`#d8deda`): Hairline dividers, card outlines, and grid separators.

### Named Rules
**The Surgical Focus Rule.** Deep Surgical Teal (`#073b36`) is reserved for primary actions, navigation anchors, and significant headings. It never exceeds 20% of viewport area on content pages to preserve its commanding visual priority.

**The Functional Accent Rule.** Terracotta (`#a5472f`) is never decorative; it communicates discount magnitude, stock depletion, or destructive state. If everything shouts urgency, nothing is urgent.

## Typography

**Display Font:** Iowan Old Style, Baskerville, Georgia (Latin); Noto Naskh Arabic (Arabic).
**Body & UI Font:** Inter, Aptos, Segoe UI (Latin); Noto Sans Arabic (Arabic).
**Label Font:** Inter, Aptos (Latin); Noto Sans Arabic (Arabic).

**Character:** The serif display pairing delivers tailored bespoke dignity and editorial authority, while the clean geometric sans provides crisp, error-free legibility on mobile viewports under hospital lighting.

### Hierarchy
- **Display** (Regular 400, `clamp(2.5rem, 5vw, 4.5rem)`, line-height `1.05`, letter-spacing `-0.04em`): Editorial hero titles, page introductions.
- **Headline** (Regular 400, `clamp(1.75rem, 3vw, 2.75rem)`, line-height `1.15`, letter-spacing `-0.02em`): Section titles, product modal titles, order completion headers.
- **Title** (SemiBold 600, `1.125rem` / 18px, line-height `1.35`, letter-spacing `-0.01em`): Product titles on catalog, card headers, drawer group titles.
- **Body** (Regular 400, `0.9375rem` / 15px, line-height `1.6`): Product descriptions, informational summaries, policy copy (max line length 65–72ch).
- **Label** (Bold 700, `0.6875rem` / 11px, letter-spacing `0.14em`, uppercase): Eyebrows, category markers, badge text, table headers.

### Named Rules
**The Arabic Diacritical Clearance Rule.** In Arabic (`locale === "ar"`), all serif display and headline titles must maintain `line-height >= 1.2` and omit tight negative leading (`leading-none` or `leading-[.94]`) to prevent clipping of high ascenders and lower loops.

## Layout

- **Spatial Grid:** 12-column grid on desktop (`1440px` max container), 6-column on tablet, 2-column on mobile.
- **Gutters & Padding:** Mobile (`px-4` / 16px), Tablet (`px-8` / 32px), Desktop (`px-12` / 48px).
- **Rhythm Scale:** Increments of 4px (4, 8, 12, 16, 24, 32, 48, 64, 96px). Spacing above section titles is always 1.5× to 2× the spacing below them.
- **Logical Flow:** Strict adherence to CSS Logical Properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `border-inline-*`) ensuring seamless symmetry between LTR and RTL.

## Elevation & Depth

Scrub Vibe utilizes a tonal and hairline-structure model rather than artificial drop shadows. Surfaces communicate hierarchy through border contrast, background layering (`var(--paper-canvas)` vs `var(--surface-card)`), and razor-sharp hairlines.

### Shadow Vocabulary
- **Subtle Elevation** (`box-shadow: 0 4px 20px -2px rgba(7, 59, 54, 0.06)`): Used exclusively for sticky headers on scroll, floating cart summary panels, and elevated modal dialogs.
- **Focus Glow** (`box-shadow: 0 0 0 3px rgba(14, 116, 104, 0.25)`): Accessible focus ring for inputs and interactive buttons.

### Named Rules
**The Flat-By-Default Rule.** Content cards, catalog tiles, and table rows rest completely flat on the canvas. Shadows are never used for static cards; depth is achieved by the white card resting on the paper canvas enclosed by a subtle 1px border.

## Shapes

- **Corners:** Razor 2px radius (`rounded-xs`) for structural buttons, input fields, cards, and modal windows, reflecting surgical equipment precision.
- **Full Radius (`rounded-full`):** Reserved exclusively for circular color swatches, icon action buttons (wishlist heart, close buttons), and pill-shaped quantity counters.
- **Borders:** Consistent 1px solid hairline (`border border-[var(--border-subtle)]`).

## Components

### Buttons
- **Shape:** 2px subtle radius (`rounded-xs`), minimum 48px height on primary actions (`min-h-[48px]`).
- **Primary:** Deep surgical teal background (`#073b36`), white text, bold uppercase tracked lettering (`text-xs tracking-[.14em]`). Hover shifts to `#0e7468`.
- **Secondary:** Surface card background (`#ffffff`), 1px subtle border, deep teal text. Hover shifts to soft sage (`#dce9e5`).
- **Ghost:** Transparent background, underlined or subtle hover fill.

### Cards
- **Product Card:** 4/5 fixed aspect ratio media container, neutral stone background (`#ebe9e4`), floating badge at top start, floating circular wishlist button at top end, permanent or smoothly revealed quick-add trigger, clear color swatch indicators with active selection rings.
- **Summary & Metric Cards:** 1px subtle border, white surface, generous 24px internal padding, clear key-value typography.

### Form Inputs & Selects
- **Style:** 48px height, 1px subtle border (`#d8deda`), white background, 15px font size to prevent mobile iOS auto-zoom, clear floating or top-aligned labels.
- **Focus:** 2px solid teal outline (`#0e7468`) with 2px offset.
- **Error:** 1px terracotta border (`#a5472f`) with inline validation icon and descriptive helper copy.

### Navigation & Header
- **Desktop Navigation:** Elevated sticky top bar with blur backdrop, clear logo wordmark with surgical precision, primary category links, language switch indicator, and quick-access utility icons (Search, Account, Wishlist, Bag with live counter).
- **Mobile Navigation:** Seamless slide-over navigation drawer with categorized shop links, brand quality story, Instagram link, and direct contact avenues.

## Do's and Don'ts

### Do:
- **Do** test every layout in both English LTR and Arabic RTL at 390px, 768px, and 1440px viewports.
- **Do** use CSS logical properties (`start`, `end`, `ps`, `pe`, `ms`, `me`) across all spacing and layout rules.
- **Do** format all prices using `formatMoney(minor, locale)`.
- **Do** ensure every interactive element has a minimum touch target of 44×44px.
- **Do** preserve every existing server action, data fetch, Supabase RLS policy, and cart/wishlist sync state.

### Don't:
- **Don't** use decorative gradients over text or artificial glassmorphism backdrops.
- **Don't** use raw pure black (`#000000`) for text; use Ink Primary (`#10201e`).
- **Don't** hide essential information or purchasing actions behind desktop-only hover states.
- **Don't** alter cart calculation keys, variant IDs, or checkout validation contracts.
- **Don't** compromise the official brand marks for Vodafone Cash and InstaPay Egypt.
