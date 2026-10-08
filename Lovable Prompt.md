# Lovable build prompt — Way Brand Intelligence

Paste everything below the line into Lovable as your first message.

---

Build **Way Brand Intelligence**, an internal single-page web app for Way.com's brand team. It visualizes the relationships between Way's brands on a spatial canvas and generates new brand identity directions. React + Vite + TypeScript + Tailwind, Supabase for data, three.js for the 3D layer. Desktop-first, 1440px design width. No marketing page, no landing hero — this is a tool, and it opens straight into the canvas.

## Visual system (follow exactly)

Fonts: **Plus Jakarta Sans** (Bold 700) for display and headings, tracking `-0.02em`; **Inter** (400/500/600/700) for all UI, body and numeric data. Load both from Google Fonts. No other typefaces.

Colors — two brand colors only, everything else neutral or semantic:
- Ink `#101223`, body text `#15172E`, Aquamarine `#0CF0BB`
- Crimson accent `#E52B50`, hover crimson `#EA124F` (used for the canvas graph only)
- Neutral ramp `#FAFAFA → #0E0F10`; hairlines and dividers `#E5E7EB`; muted surface `#F9FAFB`; supporting text `#6B7280`
- Semantic: red `#DA1E28`/`#FCE9EA`, blue `#1B5BFF`/`#EBF0FF`, purple `#9747FF`/`#F0E5FB`, orange `#F57600`/`#FFF4EB`, green `#079271`/`#E6F9EB`, teal `#008489`/`#E6F3F4`

Radii: 4px chips, 6px medium buttons, 8px large buttons and inputs, 12px cards and panels, 20px feature cards, 999px pills.

Shadows: very light, Linear-style — `rgba(16,24,40,0.04–0.18)`. `shadow-xs` on cards at rest, `shadow-md` on hover, `shadow-2xl` only for the drawer and modals.

Motion: understated. 120ms ease-out on hover color changes, 180ms ease-in-out on card lift (`translateY(-2px)` + shadow-md), 240ms ease-out on dropdowns and accordions, `scale(0.96)` 150ms ease-in on press. No bouncy springs. Canvas transitions are the one exception and are specified below.

Copy voice: second-person, direct, utility-first. Title Case for titles and section headers, sentence case for body and buttons of three or more words, ALL CAPS with `letter-spacing: 0.16em` for eyebrow labels. **No emoji anywhere.** Icons are Lucide, 24×24, 2px stroke, rounded caps.

Cards: white surface, `1px solid #E5E7EB`, 12px radius, shadow-xs → shadow-md on hover. No left-border accent stripes, no colored card backgrounds, no gradient hero backgrounds.

## Data — Supabase

One table, `public.brands`, RLS on with a public read policy:

```sql
create table public.brands (
  id          text primary key,
  name        text not null,
  mark        text,          -- 1–2 char monogram, e.g. 'P', 'W+'
  logo        text,          -- path/URL to a 2D logo png
  model_3d    text,          -- raw URL to a .glb extruded logo mark
  color       text default '#E52B50',
  category    text default 'Mobility',   -- Mobility | Care | Fuel | Finance | Support | Membership
  status      text default 'Concept',    -- Live | Beta | Pilot | Concept
  tagline     text,
  description text,
  url         text,
  audience    text,
  personality text[] default '{}',       -- 5 adjectives
  keywords    text[] default '{}',       -- 10 adjectives
  sort        int  default 100,
  created_at  timestamptz default now()
);
```

Seed ten brands in `sort` order: Way Parking (P, Mobility, Live, `#2E3A59`), Way Car Wash (C, Care, Live, `#2F7A6E`), Way Gas (G, Fuel, Live, `#C1553B`), Way Refinance (R, Finance, Live, `#B98A2E`), Way Repair (M, Care, Live, `#5B3A6E`), Way EV Charging (E, Mobility, Live, `#2F7A6E`), Way Roadside (A, Support, Beta, `#C1553B`), Way Insurance (I, Finance, Live, `#2E3A59`), Way+ (W+, Membership, Live, `#B98A2E`), Paymeter (PM, Mobility, Pilot, `#5B3A6E`).

Each brand needs a real tagline, a two-to-three-sentence description of what the vertical does, the `way.com/...` url, a one-sentence audience description written as a specific person in a specific moment, five personality adjectives and ten keywords. Write these as actual product copy, not lorem. Examples: Way Parking — "Airport, city and event parking, booked ahead."; Way Roadside — "Help dispatched in minutes."; Way+ — "One membership across every vertical."

Also create `saved_directions` (id uuid, brand_id text, name text, keywords text[], notes text, created_at) for the Brand Builder output, and `recent_views` (id uuid, brand_id text, viewed_at timestamptz).

Fetch brands once on load into a store (Zustand), keyed by id. Never block first paint on the fetch — render the canvas skeleton immediately.

## Screen 1 — the canvas (the whole app)

Full-viewport dark canvas, background `#101223` with a very subtle radial vignette. Nothing scrolls; the canvas is the page.

**Center:** the Way mark, fixed at the visual center, always present, slightly larger than the satellites, with a soft crimson glow behind it. Clicking it opens a small radial menu of canvas actions (Reset view, Fit all, Toggle labels).

**Satellites:** the ten brands arranged in a compass ring around the center at equal angular intervals, first brand at 12 o'clock going clockwise. Each satellite is a node: the 3D extruded logo mark on a small pedestal, with the brand name in Inter 500 13px below it and the category as an ALL-CAPS eyebrow above.

**Spokes:** a thin hairline from center to each satellite, `rgba(255,255,255,0.12)` at rest.

**Node states:**
- Rest — white pedestal rail, node at rest scale, spoke at 12% white.
- Hover — pedestal rail turns `#EA124F`, node lifts and scales to 1.06, its spoke brightens to crimson, the node's label goes full opacity, **and every other satellite dims to 40% opacity**. Node auto-rotation pauses on the hovered node.
- Active — identical treatment to hover, but latched: when the side drawer is open on a brand, that brand's node holds the full hover state (crimson rail, lift, bright spoke) and all others stay dimmed, for as long as the drawer is open. Hovering a different node while the drawer is open takes visual priority over the latched one.
- Click — opens the Brand Detail drawer for that brand and records a `recent_views` row.

**3D layer:** a `three.js` scene layered under the DOM labels, one `WebGLRenderer` with `antialias`, pixel ratio capped at 2, `outputColorSpace = SRGBColorSpace`, ACES tone mapping, studio three-point lighting plus an environment map. Load each brand's `model_3d` GLB with `GLTFLoader`, center and normalize it to a fixed bounding size, stand it upright on the pedestal, and idle-rotate it slowly on Y.

> Critical material rule, this is the thing that goes wrong: **do not blanket-replace materials on loaded GLBs.** Traverse each model and check whether the mesh already carries maps (`map`, `normalMap`, `roughnessMap`, `emissiveMap`, `aoMap`) or vertex colors. If it does, keep its own material — just set `map.colorSpace = SRGBColorSpace`, `map.anisotropy = 4`, `envMapIntensity ≈ 0.85`, and `needsUpdate = true`. Only untextured single-color marks get retinted into the shared matte-plaster material. Replacing every material renders textured models as flat white.

Models that fail to load fall back to a flat extruded monogram plate in the brand's `color` with the `mark` letter on it. Never leave an empty node.

## Screen 1, mode switch — Brand Web ↔ Keywords

A liquid-glass segmented switcher pinned top-center: two options, "Brand Web" and "Keywords". `rgba(255,255,255,0.06)` fill, `backdrop-filter: blur(12px)`, 1px `rgba(255,255,255,0.12)` border, 999px radius, with a sliding indicator pill that animates between the two segments in 240ms ease-out.

- **Brand Web** — the compass layout described above.
- **Keywords** — the satellites dissolve and the canvas refills with the union of every brand's `keywords`, laid out as a floating tag cloud. Repeated keywords render larger and in crimson; single-brand keywords render small and white at 60%. Hovering a keyword highlights it and shows which brands carry it. Clicking one filters back to Brand Web with only the matching brands lit.

> **The two transitions must be symmetrical.** Both directions use the same choreography: outgoing elements fade and scale to 0.9 with a staggered exit, then incoming elements animate in with `opacity 0 → 1`, `scale 0.9 → 1`, 520ms `cubic-bezier(0.2,0.9,0.3,1)`, staggered ~55ms per item. Do not give one direction a spring or a longer stagger than the other. Drive both from a single shared `modeChangedAt` timestamp in state so the stagger recomputes identically each way.

## Screen 1, floating toolbar

Bottom-center, same liquid-glass treatment as the switcher, 999px radius, 8px gap between icon buttons, each 40×40 with a tooltip on hover: Brand Builder (pen), Recent & Saved (calendar), Settings (sliders), divider, Zoom out / Zoom in / Fit.

## The side drawer

One drawer shell, four tab variants. 560px wide, inset 10px from every edge including top and bottom, so it floats as a rounded panel rather than reaching the viewport edges. White surface, 12px radius, shadow-2xl, `1px solid #E5E7EB`. Scrim behind it at `rgba(16,18,35,0.48)` — clicking the scrim or pressing Escape closes it. Thin scrollbar (`scrollbar-width: thin`), header sticky to the top of the scroll container, with the brand name, a star (save) button, an external-link button, a download button and a close button.

On open, the drawer slides in from the right in 240ms ease-out and its child blocks stagger in with a fade-up (`opacity 0 → 1`, `translateY(12px) → 0`) over 400–500ms, ~60ms apart.

**Tab 1 — Brand Detail.** Logo, name, category eyebrow, status pill (Live green / Beta blue / Pilot orange / Concept purple tints), tagline in Plus Jakarta Sans 24px, description body, an Audience block, a Personality row of five pill tags, a Keywords grid of ten chips, and the `way.com` link as a tertiary button.

**Tab 2 — Brand Builder.** A generation flow in three steps with a step indicator at the top:
1. *Setup* — pick a base brand or start blank, pick 3–5 seed keywords from the pooled keyword list (chips, multi-select), optionally add your own, and mark keywords to exclude.
2. *Generate* — weight the selected keywords with sliders, a "Way-adjacent" toggle that biases toward the existing family, a notes field, then a primary "Generate directions" button.
3. *Results* — three or four generated direction cards, each with a candidate name, a positioning line, a keyword set and a suggested palette of three swatches. Each card has "Save direction" (writes `saved_directions`) and "Refine". Regenerate keeps prior results in a collapsed history.

**Tab 3 — Recent & Saved.** Two sections. Recent — the last brands viewed, from `recent_views`, newest first, each a compact row with logo, name and relative time. Saved — saved directions from `saved_directions`, each with name, keyword chips, created date and a remove action. Empty states are one line of body copy plus a tertiary CTA, no illustration.

**Tab 4 — Settings.** Grouped rows with labels on the left and controls on the right: Canvas (labels always visible toggle, auto-rotate toggle, motion intensity slider 0–1, reduce motion toggle), Data (Supabase status readout, refresh brands button), Appearance (canvas density segmented control), Danger (clear recent, clear saved).

## Behavior details that matter

- `prefers-reduced-motion` and the Settings reduce-motion toggle both collapse every canvas animation to a 1-frame crossfade and stop auto-rotation. All durations flow through one `ms(n)` helper multiplied by a motion factor, so one setting scales everything.
- Keyboard: Escape closes the drawer, `1`/`2` switch canvas modes, arrow keys move focus between satellites, Enter opens the focused brand, `/` focuses search.
- Every node and toolbar button is a real focusable button with a visible focus ring (2px `#0CF0BB`, 2px offset) and an accessible name.
- The canvas layout is computed from viewport size — the ring radius is `min(width, height) * 0.34`, clamped so labels never collide.
- Loading: canvas frame, switcher and toolbar render instantly; nodes fade in as their models resolve.

## Build order

1. Shell, tokens, fonts, Supabase client and the brands table with its seed.
2. Static canvas — center mark, ten DOM satellites with labels and spokes, hover/dim/active states, no 3D yet.
3. Drawer shell plus Brand Detail, wired to node clicks with the latched active state.
4. Mode switcher and the Keywords cloud, both transitions from the one shared timestamp.
5. Toolbar, then Recent & Saved and Settings.
6. The three.js layer, GLB loading with the material rule above, and the monogram fallback.
7. Brand Builder flow and `saved_directions`.

Do not add a landing page, sign-up, onboarding tour, pricing, footer, testimonials or any marketing content. The app opens on the canvas.
