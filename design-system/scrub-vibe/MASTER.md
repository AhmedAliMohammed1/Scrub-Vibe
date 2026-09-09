# Scrub Vibe — UI/UX Design System

> Page-specific files in `pages/` override this master. Generated with UI/UX Pro Max and refined against the existing bilingual commerce architecture and live storefront audit.

## Direction

**Clinical editorial:** quiet confidence, precise product information, warm human photography, and a deep surgical-teal signature. Premium and fashion-aware without reducing clarity.

- Use a clean 12-column grid and generous whitespace.
- Prioritize discovery, fit confidence, price clarity, delivery/payment trust, and the next action.
- Keep decoration restrained: no glassmorphism, gradients only over photography, no floating shapes, no emoji icons.
- Use Lucide icons consistently; labels remain visible when meaning is not universal.
- Motion is 150–250ms and never required to understand state. Respect reduced motion.

## Tokens

| Role | Value | CSS token |
|---|---:|---|
| Deep teal | `#073B36` | `--brand-950` |
| Primary teal | `#0E7468` | `--brand-700` |
| Soft teal | `#DCE9E5` | `--brand-100` |
| Canvas | `#F6F7F4` | `--surface-canvas` |
| Surface | `#FFFFFF` | `--surface-raised` |
| Ink | `#10201E` | `--text-strong` |
| Muted text | `#536460` | `--text-muted` |
| Border | `#D8DEDA` | `--border-subtle` |
| Warm accent | `#A5472F` | `--accent-warm` |
| Success | `#18794E` | `--status-success` |
| Warning | `#A15C00` | `--status-warning` |
| Danger | `#B42318` | `--status-danger` |

Use a maximum of one brand accent per component. Status colours always include an icon or text label.

## Typography

- English display: `Iowan Old Style`, `Baskerville`, `Georgia`.
- Arabic display: `Noto Naskh Arabic`, `Amiri`, then serif.
- UI/body: `Inter`, `Aptos`, `Segoe UI`, `Noto Sans Arabic`, then sans-serif.
- Body minimum: 16px on mobile and form controls. Supporting copy may be 14px. Labels may be 11px only with strong contrast and generous tracking.
- Display headings use balanced wrapping and never reduce below 40px on primary pages.

## Layout and spacing

- Content width: `1440px`; reading width: `720px`; form width: `640px`.
- Gutters: 20px mobile, 32px tablet, 48px desktop.
- Rhythm: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Corners: 2px for controls/cards; full radius only for chips, swatches, and icon buttons.
- Shadows are reserved for overlays or sticky panels. Structure uses borders and surface contrast.

## Component principles

- Buttons: 48px minimum height, direct verb labels, high-contrast primary and quiet secondary.
- Inputs: visible labels, 48px minimum height, 16px input text, inline help/error, strong focus ring.
- Product cards: image, badge, title, available-colour summary, price. Do not render every size.
- Mobile filters: collapsed by default; show applied-filter count; products begin above the fold.
- Product detail: buying controls appear quickly; media uses stable aspect ratios; colour and size states are explicit.
- Empty states: one clear explanation and one primary recovery action.
- Admin: denser than storefront, with readable groups, workflow navigation, explicit statuses, and text equivalents for charts.

## Accessibility and responsive acceptance

- WCAG AA contrast, visible `:focus-visible`, semantic landmarks, labelled controls, 44px minimum touch targets.
- No horizontal overflow at 375px. Validate 375, 768, 1024, and 1440 widths.
- RTL is structural: use logical spacing/alignment and test Arabic layouts.
- Hover never reveals the only way to perform an action.
- Autoplay pauses on hover/focus and becomes static with reduced motion.

## Anti-patterns

- No liquid glass, excessive blur, decorative gradients, pill-shaped everything, layout-shifting hover effects, hidden labels, hover-only actions, or low-contrast grey text.
- No changes to pricing units, cart identity, checkout validation, RBAC, RLS, analytics semantics, or Supabase contracts as part of visual work.
