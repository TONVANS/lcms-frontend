# LCMS Design System

Legal Contract Management System — UI/UX design guidelines.
Source of truth: Claude Design canvas "Legal Contract Hub" (12 artboards). UI copy language: **Lao only**.

## 1. Design Direction

- **Mood:** Premium, luxury, institutional. Calm, trustworthy, precise.
- **Style:** Glassmorphism on a cool-tone navy gradient background.
- **Signature details:** champagne-gold hairlines and active indicators, serif display headings, soft blurred light glows behind glass.
- **Themes:** Dark "Midnight Navy" (default) and Light "Cool Ice". User toggles in the top bar (sun/moon icon).
- **Rule of restraint:** Gold is an accent, never a fill for large areas. One primary CTA per view.

## 2. Color Tokens

### 2.1 Core — Dark (Midnight Navy, default)

| Token | Value | Use |
|---|---|---|
| `--bg-gradient` | `linear-gradient(160deg, #050B1A 0%, #0A1630 45%, #13294F 100%)` | Page background |
| `--bg-base` | `#050B1A` | Body fallback |
| `--surface-glass` | `rgba(255,255,255,0.05)` → cards `linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))` | Glass cards |
| `--surface-inset` | `rgba(5,11,26,0.35)` | Rows / inner tiles inside cards |
| `--surface-input` | `rgba(5,11,26,0.50)` | Inputs |
| `--surface-modal` | `linear-gradient(160deg, rgba(23,42,84,0.92), rgba(10,22,48,0.92))` | Dialogs |
| `--border-glass` | `rgba(255,255,255,0.10)` – `0.14` | Card / input borders |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Dividers, table rows |
| `--text-strong` | `#F5F8FD` | Headings |
| `--text` | `#E8EEF9` | Body |
| `--text-secondary` | `#C9D5EA` | Labels, nav items |
| `--text-muted` | `#9FB0CC` | Meta, captions |
| `--text-dim` | `#8396B6` | Placeholders, section labels |
| `--overlay` | `rgba(3,8,20,0.62)` + `blur(6px)` | Modal backdrop |

### 2.2 Core — Light (Cool Ice)

| Token | Value | Use |
|---|---|---|
| `--bg-gradient` | `linear-gradient(160deg, #F4F7FC 0%, #E6EDF8 50%, #D5E1F2 100%)` | Page background |
| `--bg-base` | `#EEF3FA` | Body fallback |
| `--surface-glass` | `rgba(255,255,255,0.62)`; cards `linear-gradient(160deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))` | Glass cards |
| `--surface-inset` | `rgba(255,255,255,0.70)` | Rows |
| `--surface-input` | `rgba(255,255,255,0.80–0.90)` | Inputs |
| `--surface-navy` | `linear-gradient(180deg, #0B1B3A, #13294F)` | **Sidebar, top bar on Home, hero KPI — stay navy in light mode** |
| `--border-glass` | `rgba(255,255,255,0.90)` | Card borders |
| `--border-subtle` | `rgba(11,27,58,0.08)` | Dividers |
| `--text-strong` | `#0B1B3A` | Headings / body |
| `--text-secondary` | `#1E2E4F` | Labels |
| `--text-muted` | `#4A5B78` | Meta |
| `--text-dim` | `#5B6B86` | Placeholders |
| `--shadow-card` | `0 20px 40px -28px rgba(15,35,80,0.35)` | Card elevation |

### 2.3 Brand

| Token | Dark | Light | Use |
|---|---|---|---|
| `--primary-gradient` | `linear-gradient(135deg, #1E3A8A, #2563EB)` | `linear-gradient(135deg, #0B1B3A, #1E3A8A 55%, #2563EB)` | Primary buttons, active nav, selected states |
| `--primary` | `#2563EB` | `#1E3A8A` | Focus, links on light |
| `--gold` | `#D4B37A` | `#B08A4A` (decor) / `#8A6A2F` (text) | Accent lines, active indicator, key KPI numbers, focus ring (dark) |
| `--gold-soft` | `#F3E3C2` | — | Logo text, text on gold-tinted surfaces |
| `--gold-gradient` | `linear-gradient(135deg, #B08A4A, #D4B37A)` | same | Legal module CTA (text `#0A1630`) |

### 2.4 Module Accents

Each module has an identity color used for its icon chip, top accent line, eyebrow label and glow.

| Module | Dark | Light (text-safe) | Icon |
|---|---|---|---|
| PPA | `#5CC8FF` | `#0369A1` (deco `#0EA5E9`) | bolt |
| General Contract | `#8B9CFF` (CTA `#312E81→#4F46E5`) | `#4338CA` (deco `#6366F1`) | file-text |
| Legal, Regulation & Litigation | `#D4B37A` | `#8A6A2F` | scale |
| Litigation sub-area | `#C4B5FD` | `#6D28D9` | gavel |

Tinted chip recipe: `background: rgba(<accent>,0.12); border: 1px solid rgba(<accent>,0.30); color: <accent>`.

### 2.5 Status Colors (reserved — never reuse as series colors)

| Status (Lao label) | Dot / bar | Dark badge bg / text | Light badge bg / text |
|---|---|---|---|
| Active — ມີຜົນບັງຄັບໃຊ້ | `#34D399` / light `#059669` | `rgba(52,211,153,0.12)` / `#6EE7B7` | `#D1FAE5` / `#047857` |
| Negotiating — ກຳລັງເຈລະຈາ | `#60A5FA` / `#2563EB` | `rgba(96,165,250,0.12)` / `#93C5FD` | `#DBEAFE` / `#1E40AF` |
| Pending COD — ລໍຖ້າ COD / In litigation | `#A78BFA` / `#7C3AED` | `rgba(167,139,250,0.14)` / `#C4B5FD` | `#EDE9FE` / `#5B21B6` |
| Expiring — ໃກ້ໝົດອາຍຸ | `#FBBF24` | `rgba(251,191,36,0.12)` / `#FCD34D` | `#FEF3C7` / `#92400E` |
| Expired / Urgent — ໝົດອາຍຸ | `#FB7185` / `#E11D48` | `rgba(251,113,133,0.12)` / `#FDA4AF` | `#FFE4E6` / `#BE123C` |
| Draft — ຮ່າງ | `#94A3B8` | `rgba(148,163,184,0.14)` / `#CBD5E1` | `#F1F5F9` / `#334155` |

Status badge = dot + label (never color alone). Shape: pill, `padding 5px 10px`, `font 12px/600`.

### 2.6 Countdown Badge Rule (deadlines, expiry, hearings)

| Days left | Color | Notes |
|---|---|---|
| ≤ 7 | Rose (urgent) | also used for "hearing this week" |
| 8 – 30 | Amber | |
| 31 – 90 | Blue | planning window |
| > 90 | no badge / neutral | |

Label format: `ອີກ N ມື້` or `N ມື້`. Default alert schedule: 90, 30, 7 days before + due day.

## 3. Typography

| Role | Family | Weight | Size / line-height |
|---|---|---|---|
| Display / H1 | `'Noto Serif Display', 'Noto Serif Lao', serif` | 600 | 46–52px / 1.3 (Home, Login); 32–34px / 1.35 (pages) |
| H2 card title | same serif | 600 | 18–25px / 1.4 |
| Body | `'Inter', 'Noto Sans Lao', system-ui, sans-serif` | 400–500 | 14px / 1.6–1.7 (16px for intro text) |
| Label | sans | 400–500 | 13px |
| Meta / caption | sans | 400 | 12px |
| Eyebrow | sans | 500–600 | 12–13px, `letter-spacing: 0.12–0.18em`, module color or gold |
| KPI number | sans | 600 | 34px, `font-variant-numeric: tabular-nums` |

- Latin characters render in Inter / Noto Serif Display; Lao glyphs fall back to Noto Sans Lao / Noto Serif Lao.
- All numbers, dates, money and IDs use `tabular-nums`.
- Google Fonts: `Inter:400..700`, `Noto Sans Lao:400..700`, `Noto Serif Lao:500..700`, `Noto Serif Display:500;600`. Use `next/font/google`.

## 4. Shape, Spacing, Elevation

- **Radius:** page panels 24–28px · cards 20–22px · inner tiles/rows 14–16px · inputs & buttons 12px (login 14px) · chips/badges 999px · bars 4px.
- **Spacing scale:** 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48. Card padding 20–28px. Section gap 24px. Page padding 24px (desktop).
- **Glass recipe (dark):**
  ```css
  background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.11);
  backdrop-filter: blur(20px) saturate(140%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 60px -30px rgba(0,0,0,0.7);
  ```
- **Glass recipe (light):**
  ```css
  background: linear-gradient(160deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55));
  border: 1px solid rgba(255,255,255,0.95);
  backdrop-filter: blur(20px) saturate(160%);
  box-shadow: inset 0 1px 0 #fff, 0 20px 40px -28px rgba(15,35,80,0.35);
  ```
- **Background glows:** 2–3 absolutely positioned radial gradients per page (`pointer-events:none`, `aria-hidden`), e.g. blue `rgba(59,130,246,.34)` top-right, indigo `rgba(99,102,241,.26)` bottom-left, gold `rgba(212,179,122,.10)` center. Module pages tint the main glow with the module accent.
- **Accent line:** 2–3px top border gradient on hero/module cards: `linear-gradient(90deg, <accent>, transparent)`.
- **Highlight card:** navy-gold card `linear-gradient(160deg, rgba(30,58,138,0.45), rgba(19,41,79,0.35)); border: 1px solid rgba(212,179,122,0.25)` for summaries / side panels.

## 5. Layout

- **App shell (module pages):** flex-wrap row, gap 24px, padding 24px.
  - Sidebar: `flex: 1 1 248px`, glass (dark) / navy gradient (light). Stacks above content on mobile.
  - Main: `flex: 999 1 560px; min-width: 0`.
- **Sidebar content:** logo (LCMS + subtitle) → module switcher card (shows current module, links to Home, only for multi-module users) → nav (Home, section label, module items with count badges) → user card at bottom.
- **Active nav item:** primary gradient at 45%→10% opacity, blue border, 3px gold left indicator, white 600 text.
- **Top bar:** glass bar with breadcrumb (left) and search 260–300px, theme toggle, notifications bell (rose dot), avatar (right).
- **Page header:** eyebrow (module code) → serif H1 → meta line; actions right (secondary + primary).
- **Content grids:** KPI row `repeat(auto-fit, minmax(220px, 1fr))`; two-column sections via flex-wrap with ratio 3:2.
- **Home:** no sidebar, max-width 1280px centered, module cards `repeat(auto-fit, minmax(300px,1fr))`.
- **Login:** split screen — brand panel (left, `flex 1 1 520px`) + form card max-width 500–520px (right).
- **Wizard:** focused layout, max-width 1180px, stepper on top, form card + live summary aside.
- **Breakpoints (Tailwind):** sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536. Tables wrap in `overflow-x-auto`. Touch targets ≥ 44px.

## 6. Components

| Component | Spec |
|---|---|
| **Button – primary** | primary gradient, 1px gold border `rgba(212,179,122,0.5)`, white 14px/600, h 44 (login 52), shadow `0 12px 30px -14px rgba(37,99,235,0.9)`, hover brightness +12% |
| **Button – secondary** | `rgba(255,255,255,0.06)` + border 0.14, text `#E8EEF9` (light: white 80% + navy border 0.14) |
| **Button – ghost** | transparent + border 0.16 |
| **Button – gold** | gold gradient, text `#0A1630` 700 — Legal module primary only |
| **Icon button** | 44×44, radius 12, glass; `aria-label` required |
| **Input / Select / Textarea** | h 44 (login 50), radius 12, input surface, border 0.14, focus: gold border + 4px gold ring (dark) / navy ring (light); required marker `*` in gold |
| **Segmented chips** | pill 40–44px; selected = gold-tint (filters) or module-tint (energy type) |
| **Status badge** | §2.5 |
| **Countdown badge** | §2.6 |
| **KPI card** | label 13 muted → value 34/600 tabular → delta 12 (emerald for positive). Warning variant uses amber/rose tinted glass |
| **Data table** | header row on inset surface, 12px muted labels; rows 14px, border-bottom subtle, hover `rgba(255,255,255,0.045)`; first column links to detail; actions column icon buttons; footer "ສະແດງ X ຈາກ Y" + pagination |
| **Modal form (Dialog)** | max-w 780, radius 26, modal surface + blur 28; header (icon chip, serif title, required hint, close) / body grid `auto-fit minmax(240px,1fr)` / footer (Cancel ghost, Save draft secondary, Save primary) |
| **Wizard stepper** | 4 steps; circle 36px: done = gold fill + ✓, current = primary gradient + ring, todo = glass; live summary panel with gold progress bar |
| **Tabs** | segmented container `rgba(5,11,26,0.4)`, selected tab primary gradient |
| **Timeline** | 10–12px dots (done gold, current amber ring, future outline) + 1px connector |
| **Calendar** | 7-col grid Monday-first, day cell 40px; today = gold outline; selected = primary gradient; event dot rose (upcoming) / dim (past) |
| **File dropzone** | dashed 1.5px gold `rgba(212,179,122,0.45)`, gold-tint bg, upload icon; file rows with type tile (PDF rose, DOC blue) and progress bar |
| **Toast** | bottom-right, success = emerald glass `rgba(6,78,59,0.75)`; use `sonner` |
| **Alert banner** | amber/rose tinted glass, icon + title (600) + description + optional action |
| **Empty state** | centered muted text with suggestion to change filters |

## 7. Charts

- Use shadcn Charts (Recharts). Single-series bars use a single-hue gradient of the module accent (PPA `#2563EB→#5CC8FF`, GC `#4F46E5→#8B9CFF`, Legal `#9C7C45→#D4B37A`, Litigation `#6D28D9→#C4B5FD`).
- Part-to-whole = stacked horizontal bar with 2px gaps + legend with counts and %. Status charts use status colors only.
- 4px rounded bar ends, recessive grid, values in text tokens (never in series color), tooltip on hover, no dual axes.
- Highlight threshold windows (e.g. ≤ 90 days) with a dashed gold reference line or amber bars.

## 8. Motion

### 8.1 Principles

- Motion is quiet and premium: short, soft, never bouncy. Only `opacity` and `transform` are animated (GPU-friendly). Never animate `backdrop-filter`, `blur`, width/height or box-shadow size.
- Animate on **first mount / open** only. Re-fetches, filter changes and pagination swap content without re-playing entrance animations.
- Respect `prefers-reduced-motion`: no transforms, opacity-only fades at 1ms (effectively instant).

### 8.2 Motion Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | All entrances |
| `--ease-in-soft` | `cubic-bezier(0.4, 0, 1, 1)` | Exits |
| `--dur-fast` | `150ms` | Hover, focus, chips, tooltips |
| `--dur-base` | `250ms` | Dropdowns, popovers, toasts, tab panels |
| `--dur-enter` | `400ms` | Page sections, cards, modals |
| `--dur-slow` | `600ms` | Hero (Login/Home headline), chart bars |
| `--stagger` | `60ms` | Delay step between siblings |
| `--fade-distance` | `12px` (cards) / `8px` (rows) / `16px` (hero) | translateY offset |

### 8.3 Fade-in Variants

| Name | From → To | Duration | Applied to |
|---|---|---|---|
| `fade-in` | opacity 0 → 1 | 250ms | Overlays, modal backdrop, tab panel content, toast |
| `fade-in-up` | opacity 0, translateY(12px) → 1, 0 | 400ms | Page header, KPI cards, glass cards, module cards, sections |
| `fade-in-up-sm` | opacity 0, translateY(8px) → 1, 0 | 250ms | Table rows (first load), list items, timeline items |
| `fade-in-scale` | opacity 0, scale(0.96) → 1, 1 | 250ms | Dialog / modal panel, dropdown, popover, calendar popover |
| `fade-in-down` | opacity 0, translateY(-8px) → 1, 0 | 250ms | Top bar, alert banner, notification panel |
| `fade-in-hero` | opacity 0, translateY(16px) → 1, 0 | 600ms | Login brand panel, Home H1 + intro |
| `grow-bar` | scaleX(0) → 1 (origin left) / scaleY(0) → 1 (origin bottom) | 600ms | Chart bars, progress bars |

Exit (dialogs, dropdowns, toasts): reverse of entrance, `150ms`, `--ease-in-soft`.

### 8.4 Stagger & Sequence

- Siblings in a group fade in with `delay = index × 60ms`; cap at **8 items** (max 420ms) — items beyond 8 appear with the last delay.
- Page entrance order: top bar (0ms) → page header (60ms) → KPI row (120ms, staggered) → charts (240ms) → tables/lists (300ms).
- Home: H1/intro `fade-in-hero` → module cards `fade-in-up` staggered 80ms → upcoming list.
- Login: brand panel `fade-in-hero` (0ms) → form card `fade-in-scale` (150ms) → fields `fade-in-up-sm` staggered 60ms.
- Sidebar does **not** animate on route change (persistent shell).
- Table rows: stagger only first 10 rows on initial load; skeleton → content swaps with plain `fade-in` 150ms.

### 8.5 Other Interactions

- Card hover: `translateY(-3px)` + gold border, 200ms `--ease-out-soft`.
- Button hover: brightness +12%, `translateY(-1px)`, 150ms. Active: `scale(0.98)`.
- Focus ring: appears instantly (no transition).

### 8.6 Implementation (Tailwind v4 + shadcn)

```css
/* app/globals.css */
@theme {
  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
  --animate-fade-in: fade-in 250ms var(--ease-out-soft) both;
  --animate-fade-in-up: fade-in-up 400ms var(--ease-out-soft) both;
  --animate-fade-in-up-sm: fade-in-up-sm 250ms var(--ease-out-soft) both;
  --animate-fade-in-scale: fade-in-scale 250ms var(--ease-out-soft) both;
  --animate-fade-in-down: fade-in-down 250ms var(--ease-out-soft) both;
  --animate-fade-in-hero: fade-in-up-lg 600ms var(--ease-out-soft) both;
  --animate-grow-x: grow-x 600ms var(--ease-out-soft) both;

  @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
  @keyframes fade-in-up-sm { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
  @keyframes fade-in-up-lg { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
  @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: none } }
  @keyframes fade-in-down { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }
  @keyframes grow-x { from { transform: scaleX(0) } to { transform: scaleX(1) } }
}

/* stagger helper: set --i on each child (0..7) */
@utility stagger {
  animation-delay: calc(min(var(--i, 0), 7) * 60ms);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
  }
}
```

Usage:

```tsx
<section className="animate-fade-in-up">…</section>

{kpis.map((k, i) => (
  <KpiCard key={k.id} className="animate-fade-in-up stagger" style={{ '--i': i } as React.CSSProperties} />
))}

<div className="origin-left animate-grow-x" />   {/* chart / progress bar */}
```

- shadcn `Dialog`, `DropdownMenu`, `Popover`, `Tooltip` keep their built-in `tw-animate-css` classes (`data-[state=open]:animate-in fade-in-0 zoom-in-95`, `data-[state=closed]:animate-out fade-out-0 zoom-out-95`); set duration to `250ms` open / `150ms` close.
- Provide a reusable `<FadeIn as="div" variant="up" index={i}>` wrapper in `components/shared/fade-in.tsx` that applies the class + `--i`, so pages stay declarative.
- Do not use JS animation libraries for entrance effects; CSS only. (Framer Motion is allowed later only for complex gestures.)

## 9. Accessibility

- Contrast ≥ 4.5:1 for text (tokens above are chosen to pass on their surfaces).
- Real semantic elements: `<button>`, `<a href>`, `<label for>`, `<fieldset>/<legend>`, `role="dialog" aria-modal`, `role="tablist"`, `aria-current="page"`, `aria-pressed` on toggles.
- Icon-only buttons need Lao `aria-label`. Decorative SVG `aria-hidden="true"`.
- Focus visible: `outline: 2px solid #D4B37A` (dark) / `#1E3A8A` (light), offset 2px.
- Status never by color alone (dot + text).

## 10. Content Rules (Lao)

- `<html lang="lo">`. All UI strings in Lao; module codes/abbreviations (PPA, COD, MOU, MW, US¢/kWh) may stay Latin.
- Date: `dd/mm/yyyy`; month-year `mm/yyyy`. Short months: ມ.ກ., ກ.ພ., ມ.ນ., ເມ.ສ., ພ.ພ., ມິ.ຖ., ກ.ລ., ສ.ຫ., ກ.ຍ., ຕ.ລ., ພ.ຈ., ທ.ວ.
- Weekdays (Mon-first): ຈ, ອ, ພ, ພຫ, ສຸ, ເສົາ, ອາ.
- Numbers `1,240` with comma grouping; currency after amount: `1,200,000 USD`, `386 ຕື້ກີບ`.
- Placeholders for unknown real data: `[ຊື່ອົງກອນ]`, `[ເລກທີ]`, `[ເບີໂທ]`.

## 11. Role-Based Visibility

| Role | Modules | Landing after login |
|---|---|---|
| Admin | all 3 | Home (module launcher) |
| Department user, 1 module | its module | that module's Dashboard (skip Home) |
| Department user, ≥ 2 modules | assigned modules | Home showing only assigned cards |

- Menus, module switcher, notifications and search results of non-assigned modules are hidden (not disabled).
- Home "upcoming 30 days" list and alert summary are filtered by the user's modules.

## 12. Screen Inventory (canvas → route)

| Artboard | Route |
|---|---|
| 00 Login / Login-Light | `/login` |
| 01 Home (Admin) / 09 Home-Light | `/` |
| 02 PPA Dashboard / 10 Light | `/ppa` |
| 05 PPA List + Modal form | `/ppa/contracts` |
| 06 PPA Detail | `/ppa/contracts/[id]` |
| 03 General Contract Dashboard | `/contracts` |
| 04 Legal Dashboard | `/legal` |
| 07 Litigation list + hearing calendar | `/legal/cases`, `/legal/hearings` |
| 08 Create Wizard | `/[module]/new` (type preselected by module) |

Not yet designed (reuse patterns above): GC list/detail, Regulation list/detail, Procurement list/detail, Law library, Notifications center, Forgot password, User/Role admin.

## 13. Tailwind v4 / shadcn Theme Mapping

```css
/* app/globals.css */
@import "tailwindcss";

:root {            /* light */
  --background: #EEF3FA;
  --foreground: #0B1B3A;
  --card: rgba(255,255,255,0.62);
  --card-foreground: #0B1B3A;
  --popover: rgba(255,255,255,0.92);
  --primary: #1E3A8A;
  --primary-foreground: #FFFFFF;
  --secondary: rgba(255,255,255,0.80);
  --secondary-foreground: #0B1B3A;
  --muted: rgba(11,27,58,0.06);
  --muted-foreground: #4A5B78;
  --accent: #B08A4A;
  --accent-foreground: #0B1B3A;
  --destructive: #E11D48;
  --border: rgba(11,27,58,0.12);
  --input: rgba(11,27,58,0.16);
  --ring: #1E3A8A;
  --radius: 0.75rem;
  --sidebar: #0B1B3A;
  --sidebar-foreground: #E8EEF9;
  --gold: #8A6A2F;
  --ppa: #0369A1; --gc: #4338CA; --legal: #8A6A2F;
}

.dark {
  --background: #050B1A;
  --foreground: #E8EEF9;
  --card: rgba(255,255,255,0.06);
  --card-foreground: #E8EEF9;
  --popover: rgba(16,30,62,0.92);
  --primary: #2563EB;
  --primary-foreground: #FFFFFF;
  --secondary: rgba(255,255,255,0.06);
  --secondary-foreground: #E8EEF9;
  --muted: rgba(5,11,26,0.35);
  --muted-foreground: #9FB0CC;
  --accent: #D4B37A;
  --accent-foreground: #0A1630;
  --destructive: #FB7185;
  --border: rgba(255,255,255,0.10);
  --input: rgba(255,255,255,0.14);
  --ring: #D4B37A;
  --sidebar: rgba(255,255,255,0.05);
  --sidebar-foreground: #C9D5EA;
  --gold: #D4B37A;
  --ppa: #5CC8FF; --gc: #8B9CFF; --legal: #D4B37A;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-gold: var(--gold);
  --color-ppa: var(--ppa);
  --color-gc: var(--gc);
  --color-legal: var(--legal);
  --font-sans: var(--font-inter), var(--font-noto-sans-lao), system-ui, sans-serif;
  --font-serif: var(--font-noto-serif-display), var(--font-noto-serif-lao), serif;
}

@utility glass {
  background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  border: 1px solid var(--border);
  backdrop-filter: blur(20px) saturate(140%);
}
```

Theme switching: `next-themes` with `attribute="class"`, `defaultTheme="dark"`.
