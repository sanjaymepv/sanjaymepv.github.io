# Way Web Design System

Recreation of the **Way Web Design System** — the foundation that powers [Way.com](https://www.way.com), a multi-service automotive SuperApp. Way.com is not just parking: the brand covers **airport & city parking, car washes, gas, vehicle repair & maintenance, auto insurance, EV charging, roadside assistance and auto refinance** — all wrapped into one consumer marketplace.

This system is the *web* arm of a broader brand (a companion iOS/Android app exists); every primitive in here came out of the Figma library that governs the marketing site, listing pages and booking flows.

## Source of truth

| Resource | Provenance |
| --- | --- |
| Figma library | `Way Web Design System.fig` (mounted read-only — 35 pages, ~196 top-level frames) |
| Codebase | *not provided* — all values reconstructed from the Figma binary |
| Primary product | **Way.com** marketing + booking web |

> ⚠️ We were given the Figma only. Component behaviours (hover/active/focus, animation curves, dark mode specifics) are inferred from static variants and common design-system conventions. Flag anything below that does not match the live product and we will correct it.

---

## Verticals (a.k.a. "More than just parking")

From the cover deck — this is how Way frames the product surface:

1. **Parking** — airports, cruise ports, cities, events
2. **Car Wash**
3. **Gas**
4. **Refinance**
5. **Repair & Maintenance**
6. **EV Charging**
7. **Roadside Assistance**
8. **Insurance**

Every vertical has its own outline icon set and its own listing/card template.

---

## CONTENT FUNDAMENTALS

Way's voice is **transactional but warm** — the copy works hard to reduce friction for a driver who is already stressed (late for a flight, broken down, shopping for insurance).

**Tone & register**
- **Second-person, direct.** "Find cheap parking near you", "Save on your next wash", "Get a quote in 60 seconds".
- **Utility-first headlines, benefit sub-copy.** Big number or noun → soft explanation underneath. e.g. `H1: Airport Parking` / `body: Book covered lots near SFO from $6.99/day.`
- **Numbers do the selling.** "From $6.99/day", "Save up to 60%", "24/7", "Free cancellation". Prices, timeframes and discounts are ubiquitous.
- **Friendly but never cute.** No exclamation marks outside of toasts, no winking.

**Casing & punctuation**
- **Title Case** for screen titles, section headers, card titles ("Top Airport Lots", "Way+ Benefits").
- **Sentence case** for body copy, buttons with ≥3 words ("Book a reservation"), menu items.
- **ALL CAPS with `letter-spacing: 0.16em`** for eyebrow labels, "01 / WAY.COM" page numbers, service-vertical labels ("PARKING", "CAR WASH").
- Minimal punctuation in CTAs ("Book now", "See all listings →", never "Book now!").

**Pronouns & voice**
- "**You**" for the reader ("your car", "your next trip").
- "**We**" sparingly, for support/legal moments ("We'll refund your booking within 24h").
- The brand name is always **Way** or **Way.com**, never "way.com" lowercase.

**Emoji & iconography in copy**
- **No emoji** in the design system. Iconography is handled exclusively through the Way icon set (outline + filled variants).
- Unicode symbols are rare — `·` bullet separator, `→` inside CTAs, `$` for prices, `/` in rate copy (`$6.99/day`).

**Example specimens pulled from the Figma**
- Cover: *"Way Web Design system"* (sentence case inside Title Case file name)
- Eyebrow: *"01 / WAY.COM"* (caps + tracking)
- Color section body: *"Way app uses a flexible color palette to achieve clean interfaces and captivating brand experiences."*
- Spacing section body: *"A comprehensive spacing system with proportional to a 4px scale which properly aligns to the layout and elements look harmonious."*
- Shadows body: *"Shadows serve a number of purposes from aesthetics to functionality. They can enable you to signify that an element is interactive, like making an element seem clickable."*

---

## VISUAL FOUNDATIONS

### Palette vibe
- **Two brand colors, nothing more.** `#101223` (Oxford Ink) + `#0CF0BB` (Aquamarine). Everything else is a neutral or a semantic color.
- **Neutrals dominate.** The most-used swatches are `rgb(21,23,46)` (4,561×) and white (4,368×); pure black is third (1,815×). Interfaces read as **black text on white, with aqua + navy accents**.
- **Wide neutral ramp** — 10 grey steps from `#FAFAFA` to `#0E0F10`. Subtle steps are used for borders, alternating rows, disabled states.
- **Semantic colors each have one light tint + one saturated hue.** Red `#DA1E28`/`#FCE9EA`, Blue `#1B5BFF`/`#EBF0FF`, Purple `#9747FF`/`#F0E5FB`, Orange `#F57600`/`#FFF4EB`, Green `#079271`/`#E6F9EB`, Teal `#008489`/`#E6F3F4`.

### Type
- **Plus Jakarta Sans** for display/headings (Bold 700, 52px page heading canonical size, `-0.02em` tracking, `56px` line-height).
- **Inter** for body, UI, labels, and numeric data. Regular (400), Medium (500), Semi Bold (600), Bold (700). Sizes 10–18px for UI; body 16px.
- **Roboto Mono** Medium 14px for codes/specs (rare).
- Numbers are aligned lining figures; no oldstyle.
- **Body color is not true black** — it's `#15172E` (Oxford 1000), softer on warm white.

### Backgrounds
- **White (`#FFFFFF`) is the dominant canvas.** `#F9FAFB` (grey-50) is used for left page sidebars, muted sections, and row alternation.
- **Dark mode = navy, not black.** `#101223` / `#131525` dark surfaces; the cover uses a **dark geometric "background pattern"** (abstract tech mesh). No true `#000000` panels in marketing.
- **Imagery is photographic and warm** — parking lots, dashboards, pumps, aerial views. No illustrations-as-hero; illustrations are used *only* for empty states / error flows (`1-OhNo`, `2-Couldn'tFind`, `4-DidntWork`, `5-Offers`, `7-GetStarted`, `ShareLocation`, `PaymeterStarted`).
- **No gradients as hero backgrounds.** Gradients appear only as very subtle vertical fades on image protection overlays and on some card CTAs.
- **No grain, no texture overlays.**

### Corner radii
- `4px` — chips, inline small buttons
- `6px` — medium buttons
- `8px` — large buttons, inputs, primitive color swatches
- `12px` — cards, panels, page-sidebar corners
- `20px` — hero feature cards (Way+ plan cards)
- `999px` — pill tags, chip tags with icon

### Cards
- **White surface, `1px solid #E5E7EB` border, `12px` radius, shadow-xs on rest → shadow-md on hover.**
- Listing cards are **horizontal**: image on the left (aspect ~1.33 with rounded-left corners), content block on the right, primary CTA bottom-right.
- No left-border accent stripes. No colored backgrounds on cards by default.

### Shadows & elevation
- Very light, Linear/Untitled UI style — soft `rgba(16, 24, 40, 0.04–0.18)` drop shadows.
- `--shadow-xs` for cards at rest, `--shadow-md` for hovered/raised, `--shadow-2xl` only for modals & drawers.
- **Inset divider** `inset 0px -1px 0px 0px #E5E7EB` on page sidebars — a recurring motif across every foundation frame.

### Borders & dividers
- Hairline `1px` in `#E5E7EB` for cards, inputs, dividers.
- `1.5px` for emphasised spec-sheet dividers (only on the "xx-big" spacing row — their visual loudness cue).
- Dashed `#9747FF` (purple) dashed borders are **reserved for Figma design-spec containers** (e.g. the Logos grid). Do *not* ship dashed-purple in production UI.

### Animation
- **Understated.** Figma shows static variants only; the brand reads as a fast, information-dense marketplace, which calls for:
  - `120ms` ease-out on hover color/background changes
  - `180ms` ease-in-out on card lift (translateY(-2px) + shadow-md)
  - `240ms` ease-out for dropdowns/accordions opening
  - `0.96` scale on press, `150ms` ease-in
- No bouncy springs, no large-distance entrance animations on marketing content.

### Hover & press states (inferred from variants)
- **Primary button (ink):** rest `#101223` → hover `#15172E` (slightly lighter) → pressed `scale(0.98)`.
- **Aqua button:** rest `#0CF0BB` → hover `#07C398` → pressed `#079271`.
- **Outlined/tertiary:** rest transparent → hover bg `#F3F5F9`.
- **Cards:** rest `shadow-xs` → hover `shadow-md` + `translateY(-2px)`.
- **Disabled:** bg `#D3D5D9`, text white or `#BDC0C6`, no pointer.

### Transparency & blur
- **Backdrop blur is used sparingly** — sticky top navs use `backdrop-filter: blur(8px)` + `rgba(255,255,255,0.9)` on scroll.
- Overlay scrims for modals: `rgba(16, 18, 35, 0.48)`.
- Image "protection gradient" for text over photography: vertical `linear-gradient(180deg, transparent 0%, rgba(16,18,35,0.72) 100%)`.

### Layout
- **12-column desktop grid, 1440px design width, 100–140px page gutters.**
- Section titles sit at `60px` from container left; body copy at `--font-size-body` (16px) in `#555963`/`#6B7280` for supporting text.
- Full-bleed is reserved for hero sections; otherwise content is contained at `max-width: 1200–1440px` and centered.
- **Fixed elements:** sticky top nav, floating "search" pill on listing pages, bottom CTA drawer on mobile.

---

## ICONOGRAPHY

Way has **its own proprietary icon set**, not a third-party library. The Figma contains hundreds of components named `NameIcon<Name>Weight<Light|Regular|Bold>` plus vertical-specific icons under `Verticals*` and gold-tier "GoldIcon*" badges.

**Characteristics**
- **Outline + filled** variants for every icon.
- **24×24 canvas, 2px stroke**, rounded line caps, rounded joins.
- **Three weights** — Light, Regular (default), Bold.
- Filled variants use **solid fills** — no dual-color, no gradient-fill icons.
- Two colour treatments:
  - **Monochrome** (inherits `currentColor`, most common)
  - **Brand ink + aquamarine accent** (used on feature badges, "Why Way+" sections)
- Additional categories:
  - `Verticals` icons (one per service line, always outline, 58–68px)
  - `GoldIcon*` (Champion, Fast-Selling, Gift, Honour Star, Medal, Shield, Star-Award) — used for tier/reward badges on Way+ cards.
  - Benefit icons ("Free Shuttle Service", "CCTV Monitoring", "24HR Security", etc.) — these are *pictorial*, slightly more illustrative, 32–48px, used as amenity chips.

**No emoji.** No unicode character iconography (beyond `→` `·` `$`). No font-icon library (no FontAwesome, no Material Icons).

**What we shipped**
- `assets/logo-valvoline.png` — the partner Valvoline logo used in the Gas vertical symbol component.
- **Lucide via CDN** as a *substitute* for the proprietary Way icon set, because we cannot redraw hundreds of SVGs without loss of fidelity. Flagged below.

> 🚩 **Substitution to confirm:** The UI kit uses [Lucide](https://lucide.dev) icons (2px stroke, rounded caps — closest match to Way's outline style). Ship the production site with Way's own SVG exports; the Figma component library has them.

---

## Font substitution

- **Plus Jakarta Sans** — available on Google Fonts. No substitution needed.
- **Inter** — available on Google Fonts. No substitution needed.
- **Roboto Mono** — available on Google Fonts. No substitution needed.
- **Bricolage Grotesque** — appears 4× (only on a single typography specimen, display sizes). Available on Google Fonts. Not used in production components.
- **SF Pro** — appears 28× (likely used for iOS mirror screens referenced in the Figma). Google Fonts *Inter* is already our fallback.
- **Mulish, Product Sans** — trace usage (all <25×). Likely legacy/archive. No substitution made.

> 🚩 Load `Plus Jakarta Sans`, `Inter`, and `Roboto Mono` from Google Fonts in `colors_and_type.css`. If Way has licensed versions of any of these as self-hosted webfonts, drop them into `fonts/` and update the `@import` at the top of that file.

---

## File index

```
Way Web Design System/
├── README.md                    ← you are here
├── SKILL.md                     ← portable Claude Skill manifest
├── colors_and_type.css          ← CSS custom properties (colors, type, spacing, radii, shadows)
├── assets/
│   └── logo-valvoline.png       ← Valvoline partner mark (Gas vertical)
├── preview/                     ← design-system review cards (rendered into the Design System tab)
│   ├── colors-brand.html
│   ├── colors-oxford.html
│   ├── colors-aqua.html
│   ├── colors-neutrals.html
│   ├── colors-semantic.html
│   ├── type-display.html
│   ├── type-scale.html
│   ├── type-body.html
│   ├── spacing.html
│   ├── radii.html
│   ├── shadows.html
│   ├── buttons.html
│   ├── inputs.html
│   ├── cards.html
│   ├── tags-chips.html
│   └── iconography.html
└── ui_kits/
    └── way_web/
        ├── README.md
        ├── index.html           ← interactive listing-page mock
        ├── components.jsx       ← Button, Input, Card, Nav, Tag, etc.
        └── app.jsx              ← screens wired together
```

