# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Egyptian healthcare professionals — doctors, surgeons, nurses, dentists, pharmacists, and medical students — working long, demanding shifts in hospitals, private clinics, and university medical centers across all 27 governorates of Egypt. They need comfortable, durable, well-fitting scrubs and lab coats that withstand daily sanitization, frequent movement, and long hours, while projecting a clean, respectable, and confident professional image.

## Product Purpose

Scrub Vibe provides medical practitioners with premium, locally manufactured medical apparel ("Confidence for every shift" / "ثقة في كل شيفت"). Success means effortless discovery, high fit confidence (via an interactive size calculator), fast order completion, trusted Egyptian payment methods (Vodafone Cash, InstaPay, COD with deposit, Paymob card), and clear, reliable delivery tracking to every Egyptian governorate.

## Positioning

Unlike mass-imported generic scrubs with inconsistent sizing and stiff synthetic fabric, Scrub Vibe owns its own manufacturing factory in Egypt. This provides superior fabric feel, exact tailoring, functional medical pockets, fast local replenishment, and honest local pricing with bilingual Arabic-first and English service.

## Operating Context

- **Environment:** Medical staff ordering during shift breaks, late nights, or between clinic rounds, predominantly on mobile phones (iOS / Android web browsers), often over cellular connections.
- **Geography:** All Egyptian governorates (Cairo, Giza, Alexandria, Delta, Canal, Upper Egypt).
- **Payment Ritual:** Cash on Delivery with a security deposit via mobile wallet (Vodafone Cash) or instant bank transfer (InstaPay), plus online debit/credit card via Paymob.
- **Language & Direction:** Native dual-locale experience: Arabic (`ar`, RTL) and English (`en`, LTR).

## Capabilities and Constraints

- **Technical Stack:** Next.js 16.3.3 (App Router, Turbopack, Dynamic rendering), React 19, TypeScript strict, Tailwind CSS v4, Lucide icons, Supabase (PostgreSQL, RLS, Storage), Resend email engine.
- **Currency & Pricing:** All monetary values stored as minor units (Egyptian piastres, integer) and formatted via `formatMoney`.
- **Catalogue & Inventory:** 9 localized products, multi-colour swatches with real stock tracking, multi-size variants (XS–2XL), interactive size guide.
- **Checkout & Fulfillment:** Transactional server-priced snapshots, deposit verification with screenshot proof upload, shipping fee calculation by governorate zone, single-use and campaign discount codes.
- **Customer & Admin Experience:** Customer address book with clinical presets (Clinic, Hospital, Home), order tracking timeline, persistent DB cart/wishlist with guest-to-login merge, admin operations suite (orders, banners, discounts, sizes, shipping).
- **Automated Retention:** 3-stage abandoned cart email recovery with 1-click HMAC-signed unsubscribe and conversion tracking.

## Brand Commitments

- **Name:** Scrub Vibe / سكراب فايب
- **Signature Tone:** Elevated Clinical-Editorial — quiet confidence, surgical precision, respectful medical authority, warm human photography, and crisp utility.
- **Colors:** Deep surgical teal (`#073b36`), surgical green accent (`#0e7468`), soft clinical sage (`#dce9e5`), warm paper canvas (`#f6f7f4`), crisp white cards (`#ffffff`), and deep charcoal ink (`#10201e`).
- **Authentic Assets:** Real Scrub Vibe factory & model photography; official Vodafone Cash and InstaPay Egypt iconography.

## Evidence on Hand

- Real catalog photography located in `public/images/scrub-vibe/` (female and male collections, laboratory coats).
- 9 verified live database products with complete Arabic and English descriptions, colors, and sizes.
- Real operational rules: Egyptian phone validation (`01[0125]XXXXXXXX`), governorate shipping zones, COD deposit structure.

## Product Principles

1. **Clarity Over Decoration:** The interface is a surgical tool. Product specifications, fit guides, prices, and shipping terms must be unambiguous and immediately graspable.
2. **Respect Shift Exhaustion:** Clean visual hierarchy, zero visual noise, generous touch targets (min 44–48px), and friction-free mobile purchasing for tired practitioners.
3. **True Bilingual Parity:** Arabic is a primary language, not a translated afterthought. RTL layout, typography, and phrasing feel natural and native to Egyptian medical culture.
4. **Earn Payment & Delivery Trust:** Transparent deposit policies, clear order timelines, recognized local payment marks, and prompt automated communication.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast ratios across light and dark surfaces.
- Logical layout direction (`dir="rtl"` / `dir="ltr"`) with full logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`).
- Semantic HTML landmarks, descriptive `aria-label` tags for icon buttons, visible focus indicators, and reduced-motion support.
