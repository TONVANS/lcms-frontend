# LCMS Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Model split (user requirement):** Opus 5.5 = controller/reviewer, Sonnet 5.5 = implementer + tester (dispatch with `model: "sonnet"`). See `2026-10-20-lcms-roadmap.md §1`.

**Goal:** A running Next.js 16 app with the LCMS design tokens, dark/light theme, mock-backed API layer, login, role/module-based access control, the app shell and the Home module launcher.

**Architecture:** Next.js App Router with thin route files that compose feature components. All HTTP goes through one axios instance; in `mock` mode `axios-mock-adapter` answers on that same instance, so switching to `live` changes no feature code. Route protection is two layers: `src/proxy.ts` (cookie present?) and client guards (`AuthGate`, `ModuleGuard`) that use the user from `/auth/me`.

**Tech Stack:** Next.js 16, React 19.2, TypeScript strict, Tailwind CSS v4, shadcn/ui, axios, zustand, react-hook-form + zod, next-themes, lucide-react, sonner, date-fns, Vitest + Testing Library, Playwright.

**Spec:** `Design.md`, `Frontend_LCMS_Project.md` (copied into the repo root in Task 1). Read both before any task.

## Global Constraints

- Node ≥ 20.9 (installed: 24.13). Package manager **pnpm** (installed: 10.20). Repo root: `d:\LCMS\lcms-frontend`.
- `<html lang="lo">`. Every UI string comes from `src/lib/i18n/lo.ts`; no Lao literals in components. Code, comments, docs in English.
- Next 16: route protection lives in `src/proxy.ts` exporting `proxy()`; there is no `middleware.ts`. `params`/`searchParams` are async. `next lint` does not exist — use `eslint .`.
- No `axios` import outside `src/lib/api/**` and `src/features/*/api/**`.
- Features import other features only via their `index.ts`.
- File names kebab-case; components PascalCase; stores `*.store.ts`; schemas `*.schema.ts`.
- `NEXT_PUBLIC_*` env vars must be read as literal `process.env.NEXT_PUBLIC_X` expressions (Next inlines them only that way).
- Data fetching in Phase 1 is client-side (stores call services) — mock mode runs in the browser.
- Animations: CSS only, `opacity`/`transform` only, Design.md §8 tokens; never animate `backdrop-filter`.
- Numbers: comma grouping (`1,240`) regardless of locale → use `Intl.NumberFormat('en-US')`. Dates `dd/mm/yyyy`.
- Icon-only buttons have a Lao `aria-label`; decorative SVGs `aria-hidden="true"`; status never by color alone.
- Unit tests colocated as `src/**/*.test.ts(x)`; e2e in `e2e/`. Unit run: `pnpm test --run <path>`.
- Commit after each task with a conventional-commit message, following the attribution line in your system reminder.

## Review Focus

1. **Open redirect via `?next=`** — `/login?next=//evil.com` or `https://evil.com` must land on the user's landing route, never off-site. → tests in Task 5 (`getSafeNext`) and Task 7 (LoginForm) and Task 12 (e2e).
2. **Stale session cookie loop** — cookie present but `/auth/me` returns 401: proxy sends `/login`→`/`, AuthGate sends `/`→`/login`, forever. Expected: one hop to `/login?reason=expired&next=…`, cookie cleared, banner shown. → Task 5 (`decideRedirect` honours `reason=expired`), Task 10 (AuthGate), Task 12 (e2e).
3. **401 storms and refresh loops** — several parallel requests 401 at once must trigger exactly one `POST /auth/refresh`; a wrong password on `/auth/login` must show "invalid credentials", not trigger refresh/logout. → Task 4.
4. **Date-only ISO strings off by one** — `new Date('2026-10-27')` is UTC midnight; `daysLeft` and `formatDate` must use calendar days in local time (`parseISO`). Today = 0 → `ມື້ນີ້`; past → overdue label, rose tone. → Task 3.
5. **Non-admin user with `modules: []`** — the spec's `getLandingRoute` indexes `MODULE_HOME[undefined]`. Expected: `/forbidden`, no crash, Home shows no cards. → Task 5, Task 11.

---

## File Map (Phase 1)

```
lcms-frontend/
├─ CLAUDE.md, Design.md, Frontend_LCMS_Project.md, docs/superpowers/plans/*
├─ .env.example, .env.local, .prettierrc, vitest.config.mts, vitest.setup.ts, playwright.config.ts
├─ e2e/{auth,rbac,theme,responsive-a11y}.spec.ts
└─ src/
   ├─ proxy.ts
   ├─ app/
   │  ├─ layout.tsx, globals.css, not-found.tsx, error.tsx, providers.tsx
   │  ├─ (auth)/{layout.tsx, login/page.tsx, forgot-password/page.tsx}
   │  └─ (app)/{layout.tsx, page.tsx, notifications/page.tsx, forbidden/page.tsx,
   │           ppa/{layout,page}.tsx, contracts/{layout,page}.tsx, legal/{layout,page}.tsx}
   ├─ components/
   │  ├─ ui/              shadcn primitives (button, input restyled)
   │  ├─ layout/          app-shell, app-sidebar, topbar, module-switcher, breadcrumbs,
   │  │                   theme-toggle, user-menu, notification-bell, page-header, background-glows
   │  ├─ shared/          glass-card, fade-in, status-badge, countdown-badge, kpi-card,
   │  │                   empty-state, alert-banner, search-input
   │  └─ guards/          auth-gate, module-guard, role-gate
   ├─ features/
   │  ├─ auth/            api/auth.service.ts, components/login-form.tsx, forgot-password-form.tsx,
   │  │                   schemas/login.schema.ts, store/auth.store.ts, mocks/auth.mock.ts, index.ts
   │  ├─ alerts/          api/alerts.service.ts, store/alerts.store.ts, mocks/alerts.mock.ts, index.ts
   │  └─ home/            api/home.service.ts, components/{home-view,module-card,upcoming-list,alert-summary}.tsx,
   │                      lib/filter-summary.ts, types.ts, mocks/home.mock.ts, index.ts
   ├─ lib/
   │  ├─ api/             client.ts, interceptors.ts, endpoints.ts, errors.ts,
   │  │                   mock/{index.ts, handlers/{auth,home,alerts}.ts}
   │  ├─ auth/            permissions.ts, session.ts, route-decision.ts
   │  ├─ i18n/lo.ts
   │  ├─ constants/       modules.ts, status.ts, routes.ts, alert-windows.ts
   │  └─ utils/           cn.ts, date.ts, number.ts, money.ts, countdown.ts
   ├─ config/{env.ts, navigation.ts}
   ├─ stores/ui.store.ts
   └─ types/{api.ts, domain.ts}
```

---

### Task 1: Scaffold project, tooling and agent rules

**Files:**
- Create: `lcms-frontend/` (via create-next-app), `.env.example`, `.env.local`, `.prettierrc`, `vitest.config.mts`, `vitest.setup.ts`, `CLAUDE.md`
- Copy in: `d:\LCMS\Design.md`, `d:\LCMS\Frontend_LCMS_Project.md`, `d:\LCMS\docs\` → repo root
- Modify: `package.json` (scripts), `src/lib/utils.ts` → move to `src/lib/utils/cn.ts` and update `components.json` alias `utils` to `@/lib/utils/cn`
- Test: `src/lib/utils/cn.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `@/lib/utils/cn`; scripts `dev, build, start, lint, format, typecheck, test, e2e` exactly as spec §9.

- [ ] **Step 1: Create the app**

```bash
cd /d/LCMS
pnpm create next-app@latest lcms-frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes
cd lcms-frontend
git status || git init   # create-next-app usually inits git; init only if it did not
```
Expected: `package.json` lists `next@16.x`, `react@19.2.x`, `tailwindcss@4.x`.

- [ ] **Step 2: Install dependencies**

```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button card input textarea select checkbox radio-group label form dialog sheet tabs table badge avatar dropdown-menu popover tooltip calendar separator skeleton scroll-area breadcrumb pagination sidebar chart sonner
pnpm add axios zustand react-hook-form zod @hookform/resolvers @tanstack/react-table date-fns next-themes lucide-react recharts axios-mock-adapter
pnpm add -D prettier prettier-plugin-tailwindcss vitest @vitejs/plugin-react vite-tsconfig-paths @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test @axe-core/playwright
```
Decision: `axios-mock-adapter` is a **runtime** dependency (not dev) because `client.ts` installs it whenever `NEXT_PUBLIC_API_MODE=mock`, including demo builds. If `shadcn add form` reports the component as unavailable, add `field` instead and note it in the task report.

- [ ] **Step 3: Configure tooling**
  - `vitest.config.mts`: plugins `tsconfigPaths()`, `react()`; `environment: 'jsdom'`, `setupFiles: ['./vitest.setup.ts']`, `include: ['src/**/*.test.{ts,tsx}']`, `css: false`.
  - `vitest.setup.ts`: `import '@testing-library/jest-dom/vitest'` and `afterEach(cleanup)`.
  - `.prettierrc`: `{ "singleQuote": true, "semi": true, "printWidth": 100, "plugins": ["prettier-plugin-tailwindcss"] }`.
  - `package.json` scripts: exactly spec §9.
  - `.env.example`: exactly spec §8. `.env.local`: same values (git-ignored).
  - `tsconfig.json`: confirm `"strict": true`; exclude `e2e`.

- [ ] **Step 4: Write `CLAUDE.md`**

Contents (English): read `Design.md` and `Frontend_LCMS_Project.md` before UI work; use the ui-ux-pro-max skill for UX review but never to replace LCMS tokens, fonts, colors or the glassmorphism navy style; UI copy in Lao via `src/lib/i18n/lo.ts`, code in English; the Global Constraints list above; the model workflow from roadmap §1; verification commands (`pnpm typecheck && pnpm lint && pnpm test --run`).

- [ ] **Step 5: Install ui-ux-pro-max project-locally**

```bash
npx uipro-cli init --ai claude
python .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
```
Expected: search prints results. If offline, skip and note it in the report (the user-level plugin is already installed).

- [ ] **Step 6: Write the failing test** `src/lib/utils/cn.test.ts`

```ts
it('merges tailwind classes, last wins', () => {
  expect(cn('px-2 text-sm', false && 'hidden', 'px-4')).toBe('text-sm px-4');
});
```

- [ ] **Step 7: Move `utils.ts` → `utils/cn.ts`, fix imports in `components/ui/*`, run**

Run: `pnpm test --run src/lib/utils/cn.test.ts && pnpm typecheck && pnpm lint && pnpm build`
Expected: 1 test passes; typecheck, lint, build exit 0.

- [ ] **Step 8: Commit** on `main` (`chore: scaffold lcms-frontend`), then `git checkout -b phase-1-foundation`.

---

### Task 2: Design tokens, fonts, theme provider, motion, FadeIn, ThemeToggle

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/app/providers.tsx`, `src/components/shared/fade-in.tsx`, `src/components/layout/theme-toggle.tsx`, `src/components/layout/background-glows.tsx`
- Test: `src/components/shared/fade-in.test.tsx`, `src/components/layout/theme-toggle.test.tsx`

**Interfaces:**
- Produces:
  - CSS: all Design.md §2 tokens as CSS variables on `:root` (light) and `.dark` (dark), §13 shadcn mapping + `@theme inline`, §8.6 motion `@theme` + keyframes + `stagger` utility + reduced-motion block.
  - `@utility glass` that is **theme-aware**: reads `--glass-bg`, `--glass-border`, `--glass-shadow`, `--glass-blur` which are defined per theme with the §4 dark/light recipes (§13's sample is dark-only — do not copy it verbatim).
  - Tailwind colors: `gold`, `ppa`, `gc`, `legal`, `litigation` (`#C4B5FD` dark / `#6D28D9` light), plus `--surface-navy` for sidebar/topbar-on-home.
  - Font CSS variables: `--font-inter`, `--font-noto-sans-lao`, `--font-noto-serif-lao`, `--font-noto-serif-display` (next/font/google; Inter 400–700 latin; Noto Sans Lao 400–700 lao; Noto Serif Lao 500–700 lao; Noto Serif Display 500/600 latin).
  - `Providers({ children })` — `ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}` + `<Toaster position="bottom-right" />`.
  - `FadeIn({ as?: ElementType = 'div', variant?: 'in'|'up'|'up-sm'|'scale'|'down'|'hero' = 'up', index?: number, className?, style?, children })` → applies `animate-fade-in-<variant>` and, when `index` is given, `stagger` + `--i: index`.
  - `ThemeToggle()` — 44×44 icon button, `aria-label={lo.topbar.themeToggle}`, `aria-pressed={theme === 'light'}`, sun/moon icon.
  - `BackgroundGlows({ accent?: 'default'|'ppa'|'gc'|'legal' })` — 3 radial glows, `aria-hidden`, `pointer-events-none`.

- [ ] **Step 1: Write failing tests**

```tsx
// fade-in.test.tsx
it('applies variant class and stagger index', () => {
  render(<FadeIn variant="up" index={3}>x</FadeIn>);
  const el = screen.getByText('x');
  expect(el).toHaveClass('animate-fade-in-up', 'stagger');
  expect(el.style.getPropertyValue('--i')).toBe('3');
});
it('omits stagger when no index', () => {
  render(<FadeIn variant="scale">y</FadeIn>);
  expect(screen.getByText('y')).not.toHaveClass('stagger');
});

// theme-toggle.test.tsx — vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: theme, setTheme }) }))
it('switches dark → light and exposes pressed state', async () => {
  // theme = 'dark'
  await userEvent.click(screen.getByRole('button', { name: lo.topbar.themeToggle }));
  expect(setTheme).toHaveBeenCalledWith('light');
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
});
```
(`lo` comes from Task 3 — if Task 3 is not merged yet, create `lo.ts` with just the `topbar` keys from Task 3's dictionary now; Task 3 extends it.)

- [ ] **Step 2: Run** `pnpm test --run src/components` → FAIL (modules not found).

- [ ] **Step 3: Implement** globals.css, layout.tsx (`<html lang="lo" suppressHydrationWarning>`, font variables on `<html>`, `body` uses `--bg-gradient` with `min-h-dvh`, metadata title `LCMS`), providers, FadeIn, ThemeToggle, BackgroundGlows. Focus-visible ring per Design.md §9 (2px `#D4B37A` dark / `#1E3A8A` light, offset 2px) as a base-layer rule. Set shadcn Dialog/Dropdown/Popover/Tooltip open duration 250ms, close 150ms.

- [ ] **Step 4: Run** `pnpm test --run src/components && pnpm typecheck && pnpm build` → PASS.

- [ ] **Step 5: Commit** `feat: design tokens, fonts, theme and motion`.

---

### Task 3: Domain types, constants, Lao dictionary, formatting utils

**Files:**
- Create: `src/types/api.ts`, `src/types/domain.ts`, `src/lib/i18n/lo.ts`, `src/lib/constants/{modules,status,routes,alert-windows}.ts`, `src/lib/utils/{date,number,money,countdown}.ts`
- Test: `src/lib/utils/{date,number,money,countdown}.test.ts`, `src/lib/constants/status.test.ts`

**Interfaces:**
- Produces:
  - `types/api.ts`: `Paginated<T>`, `ListQuery`, `ApiError`, `ID = string`, `ISODate = string` — exactly spec §5.
  - `types/domain.ts`: `ModuleKey`, `Role`, `Permission`, `User` (spec §4), `ContractStatus`, `KeyEvent`, `DocumentFile`, `Alert`, `Money`, `Department { id; name }` (spec §6; module-specific entities stay for their phases).
  - `lo` — `export const lo = {...} as const`; parametrised strings are functions. Required keys below.
  - `MODULES: Record<ModuleKey, { key; code: 'PPA'|'GC'|'LEGAL'; name: string; href: string; icon: LucideIcon }>` — icons `Zap` (bolt), `FileText`, `Scale`; hrefs `/ppa`, `/contracts`, `/legal`; names from `lo.modules`.
  - `ROUTES = { home: '/', login: '/login', forgotPassword: '/forgot-password', forbidden: '/forbidden', notifications: '/notifications' } as const`; `PUBLIC_ROUTES = ['/login', '/forgot-password']`.
  - `ALERT_WINDOWS = [90, 30, 7] as const`.
  - `StatusTone = 'emerald'|'blue'|'violet'|'amber'|'rose'|'slate'`; `STATUS_META: Record<ContractStatus, { label: string; tone: StatusTone }>`.
  - `formatDate(iso?: string | null): string`, `formatMonthYear(iso?: string | null): string`, `daysLeft(iso: string, today?: Date): number`, `LAO_MONTHS_SHORT: readonly string[]`, `LAO_WEEKDAYS: readonly string[]`.
  - `formatNumber(n: number, maxFractionDigits = 2): string`; `formatMoney(m: Money): string`.
  - `CountdownTone = 'urgent'|'warning'|'planning'`; `getCountdownTone(days: number): CountdownTone | null`; `formatCountdown(days: number): string`.

**Required `lo` keys and exact copy** (strings not listed here may be drafted by the implementer; all are flagged for native-speaker review per roadmap §4):

```ts
common: { appName: 'LCMS', appSubtitle: 'ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ', loading: 'ກຳລັງໂຫຼດ...', home: 'ໜ້າຫຼັກ',
          search: 'ຄົ້ນຫາ...', underConstruction: 'ໜ້ານີ້ກຳລັງພັດທະນາ', backHome: 'ກັບໄປໜ້າຫຼັກ',
          showing: (x: number, y: number) => `ສະແດງ ${x} ຈາກ ${y}` },
modules: { ppa: 'ສັນຍາຊື້-ຂາຍພະລັງງານ', gc: 'ສັນຍາທົ່ວໄປ', legal: 'ນິຕິກຳ, ຈັດຊື້-ຈັດຈ້າງ ແລະ ຄະດີ' },
status: { active: 'ມີຜົນບັງຄັບໃຊ້', negotiating: 'ກຳລັງເຈລະຈາ', pending_cod: 'ລໍຖ້າ COD', expiring: 'ໃກ້ໝົດອາຍຸ',
          expired: 'ໝົດອາຍຸ', draft: 'ຮ່າງ', terminated: 'ຍົກເລີກ' },
countdown: { daysLeft: (n: number) => `ອີກ ${n} ມື້`, today: 'ມື້ນີ້', overdue: (n: number) => `ກາຍກຳນົດ ${n} ມື້` },
date: { monthsShort: ['ມ.ກ.','ກ.ພ.','ມ.ນ.','ເມ.ສ.','ພ.ພ.','ມິ.ຖ.','ກ.ລ.','ສ.ຫ.','ກ.ຍ.','ຕ.ລ.','ພ.ຈ.','ທ.ວ.'],
        weekdays: ['ຈ','ອ','ພ','ພຫ','ສຸ','ເສົາ','ອາ'] },
auth: { loginTitle: 'ເຂົ້າສູ່ລະບົບ', username: 'ຊື່ຜູ້ໃຊ້', password: 'ລະຫັດຜ່ານ', remember: 'ຈື່ຂ້ອຍໄວ້',
        forgot: 'ລືມລະຫັດຜ່ານ?', submit: 'ເຂົ້າສູ່ລະບົບ', showPassword: 'ສະແດງລະຫັດຜ່ານ', hidePassword: 'ເຊື່ອງລະຫັດຜ່ານ',
        logout: 'ອອກຈາກລະບົບ', sessionExpired: 'ໝົດເວລາເຂົ້າໃຊ້ ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່',
        forgotTitle: 'ລືມລະຫັດຜ່ານ', forgotSent: 'ຖ້າມີບັນຊີນີ້ ພວກເຮົາໄດ້ສົ່ງຄຳແນະນຳໄປທາງອີເມວແລ້ວ',
        backToLogin: 'ກັບໄປໜ້າເຂົ້າສູ່ລະບົບ' },
validation: { usernameRequired: 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້', passwordRequired: 'ກະລຸນາປ້ອນລະຫັດຜ່ານ' },
errors: { invalidCredentials: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ', network: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ເຊີບເວີໄດ້',
          timeout: 'ເຊີບເວີຕອບສະໜອງຊ້າເກີນໄປ ກະລຸນາລອງໃໝ່', forbidden: 'ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້',
          notFound: 'ບໍ່ພົບຂໍ້ມູນ', server: 'ເກີດຂໍ້ຜິດພາດໃນລະບົບ ກະລຸນາລອງໃໝ່', unknown: 'ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່',
          pageNotFound: 'ບໍ່ພົບໜ້າທີ່ທ່ານຊອກຫາ' },
topbar: { themeToggle: 'ປ່ຽນໂໝດສີ', notifications: 'ການແຈ້ງເຕືອນ', userMenu: 'ເມນູຜູ້ໃຊ້' },
home: { title: 'ສູນກາງບໍລິຫານສັນຍາ', upcoming30: 'ກຳນົດການ 30 ມື້ຂ້າງໜ້າ', alertSummary: 'ສະຫຼຸບການແຈ້ງເຕືອນ',
        openModule: 'ເຂົ້າສູ່ໂມດູນ', noUpcoming: 'ບໍ່ມີກຳນົດການໃນ 30 ມື້ຂ້າງໜ້າ' },
forbidden: { title: 'ບໍ່ມີສິດເຂົ້າເຖິງ' },
nav: { dashboard: 'ພາບລວມ', contracts: 'ລາຍການສັນຍາ', create: 'ສ້າງສັນຍາໃໝ່', alerts: 'ແຈ້ງເຕືອນ',
       documents: 'ເອກະສານ', regulations: 'ນິຕິກຳ', procurement: 'ສັນຍາຈັດຊື້-ຈັດຈ້າງ',
       laws: 'ຫ້ອງສະໝຸດກົດໝາຍ', cases: 'ຄະດີ', hearings: 'ນັດໄຕ່ສວນ', modulesSection: 'ໂມດູນ' },
```

- [ ] **Step 1: Write failing tests**

```ts
// date.test.ts
expect(formatDate('2026-03-05')).toBe('05/03/2026');
expect(formatDate('2026-03-05T23:30:00+07:00')).toBe('05/03/2026'); // run with TZ=Asia/Vientiane, see Step 2
expect(formatDate(undefined)).toBe('—');
expect(formatMonthYear('2026-03-05')).toBe('03/2026');
expect(LAO_MONTHS_SHORT[0]).toBe('ມ.ກ.'); expect(LAO_MONTHS_SHORT[11]).toBe('ທ.ວ.');
expect(LAO_WEEKDAYS).toHaveLength(7); expect(LAO_WEEKDAYS[0]).toBe('ຈ');
const today = new Date(2026, 9, 20, 23, 30);           // 20 Oct 2026, late evening local
expect(daysLeft('2026-10-20', today)).toBe(0);
expect(daysLeft('2026-10-27', today)).toBe(7);
expect(daysLeft('2026-10-17', today)).toBe(-3);

// number.test.ts / money.test.ts
expect(formatNumber(1240)).toBe('1,240');
expect(formatNumber(1234.567)).toBe('1,234.57');
expect(formatMoney({ amount: 1200000, currency: 'USD' })).toBe('1,200,000 USD');
expect(formatMoney({ amount: 386000, currency: 'LAK' })).toBe('386,000 LAK');

// countdown.test.ts
expect([-3, 0, 7].map(getCountdownTone)).toEqual(['urgent', 'urgent', 'urgent']);
expect([8, 30].map(getCountdownTone)).toEqual(['warning', 'warning']);
expect([31, 90].map(getCountdownTone)).toEqual(['planning', 'planning']);
expect(getCountdownTone(91)).toBeNull();
expect(formatCountdown(5)).toBe('ອີກ 5 ມື້');
expect(formatCountdown(0)).toBe('ມື້ນີ້');
expect(formatCountdown(-3)).toBe('ກາຍກຳນົດ 3 ມື້');

// status.test.ts
expect(STATUS_META.active).toEqual({ label: 'ມີຜົນບັງຄັບໃຊ້', tone: 'emerald' });
expect(STATUS_META.pending_cod.tone).toBe('violet');
expect(STATUS_META.expiring.tone).toBe('amber');
expect(STATUS_META.expired.tone).toBe('rose');
expect(STATUS_META.terminated).toEqual({ label: 'ຍົກເລີກ', tone: 'slate' });
expect(Object.keys(STATUS_META)).toHaveLength(7);
```

- [ ] **Step 2: Run** `pnpm test --run src/lib` → FAIL. Add `process.env.TZ = 'Asia/Vientiane'` at the top of `vitest.setup.ts` so date tests are deterministic.

- [ ] **Step 3: Implement.** Dates: `parseISO` + `format(d, 'dd/MM/yyyy')`; `daysLeft` = `differenceInCalendarDays(parseISO(iso), today)`. Never `new Date(isoDateOnly)`.

- [ ] **Step 4: Run** `pnpm test --run src/lib && pnpm typecheck` → PASS.

- [ ] **Step 5: Commit** `feat: domain types, Lao dictionary and formatters`.

---

### Task 4: Env config and API layer (client, errors, interceptors, mock installer)

**Files:**
- Create: `src/config/env.ts`, `src/lib/api/{client,interceptors,endpoints,errors}.ts`, `src/lib/api/mock/index.ts`
- Test: `src/config/env.test.ts`, `src/lib/api/errors.test.ts`, `src/lib/api/interceptors.test.ts`

**Interfaces:**
- Consumes: `ApiError` (Task 3), `lo.errors` (Task 3).
- Produces:
  - `parseEnv(raw: Record<string, string | undefined>): Env` and `env: Env` where `Env = { NEXT_PUBLIC_APP_NAME: string; NEXT_PUBLIC_API_MODE: 'mock'|'live'; NEXT_PUBLIC_API_BASE_URL: string; NEXT_PUBLIC_MAX_UPLOAD_MB: number }`. Defaults: `'LCMS'`, `'mock'`, `'http://localhost:8080/api/v1'`, `50`. Invalid mode throws.
  - `endpoints` — `auth: { login, logout, refresh, me, forgotPassword }`, `home: { summary }`, `alerts: { list, read(id) }`, `lookups: { departments }` (paths from spec §5 table).
  - `normalizeError(e: unknown): ApiError`; `toUserMessage(err: ApiError): string`.
  - `installInterceptors(instance: AxiosInstance, opts: { onUnauthorized: () => void }): () => void` (returns eject).
  - `setUnauthorizedHandler(fn: () => void): void` — the auth store registers logout+redirect here; `client.ts` passes a wrapper that calls the registered fn.
  - `api: AxiosInstance` from `client.ts` (spec §5 config: `baseURL`, `timeout: 20000`, `withCredentials: true`, `Accept-Language: lo`); in mock mode `client.ts` calls `installMocks(api)`.
  - `installMocks(instance: AxiosInstance): MockAdapter` — `delayResponse: 300`; calls each handler module's `register(mock: MockAdapter): void` (handler list grows in Tasks 6 and 11).

Error code contract: `status 0, code 'NETWORK'` (no response); `status 0, code 'TIMEOUT'` (`ECONNABORTED`/`ETIMEDOUT`); otherwise `status = response.status`, `code = body.code ?? ('HTTP_' + status)`, `message = body.message ?? ''`, `fieldErrors = body.fieldErrors`. `toUserMessage`: NETWORK→`lo.errors.network`, TIMEOUT→`lo.errors.timeout`, `INVALID_CREDENTIALS`→`lo.errors.invalidCredentials`, 401→`lo.auth.sessionExpired`, 403→`lo.errors.forbidden`, 404→`lo.errors.notFound`, 400/422 with message→message, ≥500→`lo.errors.server`, else `lo.errors.unknown`.

- [ ] **Step 1: Write failing tests**

```ts
// env.test.ts
expect(parseEnv({}).NEXT_PUBLIC_API_MODE).toBe('mock');
expect(parseEnv({ NEXT_PUBLIC_MAX_UPLOAD_MB: '20' }).NEXT_PUBLIC_MAX_UPLOAD_MB).toBe(20);
expect(() => parseEnv({ NEXT_PUBLIC_API_MODE: 'bogus' })).toThrow();

// errors.test.ts — build AxiosError fixtures
expect(normalizeError(networkErr)).toMatchObject({ status: 0, code: 'NETWORK' });
expect(normalizeError(timeoutErr)).toMatchObject({ status: 0, code: 'TIMEOUT' });
expect(normalizeError(err422({ code: 'VALIDATION', message: 'x', fieldErrors: { name: 'y' } })))
  .toEqual({ status: 422, code: 'VALIDATION', message: 'x', fieldErrors: { name: 'y' } });
expect(normalizeError(err500NoBody)).toMatchObject({ status: 500, code: 'HTTP_500' });
expect(toUserMessage({ status: 401, code: 'INVALID_CREDENTIALS', message: '' })).toBe(lo.errors.invalidCredentials);
expect(toUserMessage({ status: 503, code: 'HTTP_503', message: '' })).toBe(lo.errors.server);

// interceptors.test.ts — fresh axios.create() + new MockAdapter(instance) per test
it('refreshes once and retries the original request on 401');           // GET /x: 401 then 200; refresh called 1×; resolves 200 data
it('shares one refresh across concurrent 401s');                         // 3 parallel GETs 401 → refresh count === 1, all resolve
it('calls onUnauthorized once and rejects ApiError 401 when refresh fails');
it('does not refresh on 401 from /auth/login or /auth/refresh');         // refresh count 0, onUnauthorized not called, rejects with code from body
it('rejects with normalized ApiError for non-401 errors');               // 500 → { status: 500 }
```

- [ ] **Step 2: Run** `pnpm test --run src/config src/lib/api` → FAIL.

- [ ] **Step 3: Implement.** Interceptor algorithm: a module-scoped `refreshPromise: Promise<void> | null`; on 401 for a request not flagged `_retry` and not to `auth.login`/`auth.refresh`, set `_retry`, await (or create) `refreshPromise = instance.post(endpoints.auth.refresh).finally(() => refreshPromise = null)`, then `instance(originalConfig)`. On refresh failure call `onUnauthorized()` once per refresh attempt. All rejections are `normalizeError(e)`. `env.ts` passes literal `process.env.NEXT_PUBLIC_*` references into `parseEnv`.

- [ ] **Step 4: Run** `pnpm test --run src/config src/lib/api && pnpm typecheck && pnpm lint` → PASS.

- [ ] **Step 5: Commit** `feat: api client, error normalization and refresh interceptor`.

---

### Task 5: Permissions, session cookie helpers, route decisions, `proxy.ts`

**Files:**
- Create: `src/lib/auth/{permissions,session,route-decision}.ts`, `src/proxy.ts`
- Test: `src/lib/auth/{permissions,route-decision,session}.test.ts`

**Interfaces:**
- Consumes: `User`, `ModuleKey`, `Permission` (Task 3); `ROUTES`, `PUBLIC_ROUTES` (Task 3).
- Produces:
  - `MODULE_HOME: Record<ModuleKey, string>` = `{ ppa: '/ppa', gc: '/contracts', legal: '/legal' }`.
  - `getLandingRoute(u: User): string` — admin or >1 module → `/`; exactly 1 → its home; 0 → `/forbidden`.
  - `canAccessModule(u: User, m: ModuleKey): boolean`; `getAccessibleModules(u: User): ModuleKey[]` (admin → all three in order ppa, gc, legal).
  - `hasPermission(u: User, m: ModuleKey, p: Permission): boolean` — admin true; no module access false; `permissions` undefined → only `'view'`; else `permissions[m]?.includes(p) ?? false`.
  - `SESSION_COOKIE = 'lcms_session'`; `setMockSession(username: string, remember: boolean): void` (value `mock:<username>`, `path=/`, `SameSite=Lax`, `max-age=2592000` only if remember); `readMockSession(): string | null` (returns username); `clearMockSession(): void`.
  - `getSafeNext(next: string | null | undefined): string | null` — accepts only paths starting with a single `/`, rejecting `//`, `/\`, and any scheme.
  - `decideRedirect(input: { pathname: string; search: string; hasSession: boolean }): string | null`.
  - `proxy(request: NextRequest): NextResponse` + `config.matcher = ['/((?!_next/static|_next/image|favicon.ico|brand/|.*\\..*).*)']`; cookie name `process.env.SESSION_COOKIE_NAME ?? SESSION_COOKIE`.

- [ ] **Step 1: Write failing tests**

```ts
// permissions.test.ts — fixtures: admin, ppaUser(['ppa']), gcUser(['gc']), multi(['ppa','legal']), none([])
expect(getLandingRoute(admin)).toBe('/');
expect(getLandingRoute(ppaUser)).toBe('/ppa');
expect(getLandingRoute(gcUser)).toBe('/contracts');
expect(getLandingRoute(multi)).toBe('/');
expect(getLandingRoute(none)).toBe('/forbidden');
expect(canAccessModule(ppaUser, 'legal')).toBe(false);
expect(canAccessModule(admin, 'legal')).toBe(true);
expect(getAccessibleModules(admin)).toEqual(['ppa', 'gc', 'legal']);
expect(hasPermission(ppaUser, 'ppa', 'view')).toBe(true);
expect(hasPermission(ppaUser, 'ppa', 'delete')).toBe(false);
expect(hasPermission({ ...ppaUser, permissions: { ppa: ['view', 'edit'] } }, 'ppa', 'edit')).toBe(true);

// route-decision.test.ts
expect(getSafeNext('/ppa?tab=1')).toBe('/ppa?tab=1');
expect(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', '', null].map(getSafeNext))
  .toEqual([null, null, null, null, null, null]);
expect(decideRedirect({ pathname: '/ppa', search: '?tab=1', hasSession: false })).toBe('/login?next=%2Fppa%3Ftab%3D1');
expect(decideRedirect({ pathname: '/', search: '', hasSession: false })).toBe('/login');
expect(decideRedirect({ pathname: '/login', search: '', hasSession: false })).toBeNull();
expect(decideRedirect({ pathname: '/login', search: '', hasSession: true })).toBe('/');
expect(decideRedirect({ pathname: '/login', search: '?reason=expired&next=%2Fppa', hasSession: true })).toBeNull();
expect(decideRedirect({ pathname: '/forgot-password', search: '', hasSession: false })).toBeNull();
expect(decideRedirect({ pathname: '/ppa', search: '', hasSession: true })).toBeNull();

// session.test.ts (jsdom document.cookie)
setMockSession('admin', false); expect(readMockSession()).toBe('admin');
clearMockSession(); expect(readMockSession()).toBeNull();
```

- [ ] **Step 2: Run** `pnpm test --run src/lib/auth` → FAIL.
- [ ] **Step 3: Implement** the four files; `proxy.ts` only reads the cookie, calls `decideRedirect`, and returns `NextResponse.redirect(new URL(target, request.url))` or `NextResponse.next()`.
- [ ] **Step 4: Run** `pnpm test --run src/lib/auth && pnpm typecheck && pnpm build` → PASS; build output lists the proxy.
- [ ] **Step 5: Commit** `feat: rbac helpers, session cookie and route proxy`.

---

### Task 6: Auth feature — service, mock users/handlers, schema, store

**Files:**
- Create: `src/features/auth/{api/auth.service.ts, schemas/login.schema.ts, store/auth.store.ts, mocks/auth.mock.ts, index.ts}`, `src/lib/api/mock/handlers/auth.ts`
- Modify: `src/lib/api/mock/index.ts` (register auth handler)
- Test: `src/features/auth/store/auth.store.test.ts`, `src/features/auth/schemas/login.schema.test.ts`

**Interfaces:**
- Consumes: `api`, `endpoints`, `setUnauthorizedHandler`, `normalizeError` (Task 4); session helpers, `getLandingRoute` (Task 5); `lo.validation` (Task 3).
- Produces:
  - `loginSchema` (zod): `username: string().trim().min(1, lo.validation.usernameRequired)`, `password: string().min(1, lo.validation.passwordRequired)`, `remember: boolean().default(false)`; `LoginInput = z.infer<typeof loginSchema>`.
  - `authService = { login(input: LoginInput): Promise<User>, logout(): Promise<void>, me(): Promise<User>, forgotPassword(body: { username: string }): Promise<void> }`.
  - `MOCK_PASSWORD = 'password'`; `MOCK_USERS: User[]` with usernames `admin` (role admin, all modules), `ppa.user` (['ppa']), `gc.user` (['gc']), `legal.user` (['legal']), `multi.user` (['ppa','gc']), `none.user` (role user, []). Names are realistic Lao names; department names Lao.
  - Mock handlers: `POST login` → 200 user + `setMockSession(username, remember)` / 401 `{ code: 'INVALID_CREDENTIALS' }`; `GET me` → user from `readMockSession()` or 401 `{ code: 'UNAUTHENTICATED' }` (unknown username = 401 too); `POST logout` → 204 + `clearMockSession()`; `POST refresh` → 200 if session cookie maps to a user, else 401; `POST forgot-password` → 204 always.
  - `useAuthStore` implementing spec §4 `AuthState` exactly (`user`, `status`, `login`, `logout`, `fetchMe`). `login` rethrows the normalized `ApiError` after setting `status: 'unauthenticated'`. `logout` always clears local state even if the request fails. On creation the store calls `setUnauthorizedHandler(() => useAuthStore.getState().expire())` where `expire(): void` sets `user: null, status: 'unauthenticated'` and calls `clearMockSession()` (no network call).
  - `features/auth/index.ts` exports `useAuthStore`, `authService`, `loginSchema`, `LoginInput`, `LoginForm`, `ForgotPasswordForm` (forms added in Task 7).

- [ ] **Step 1: Write failing tests** (use the real `api` instance with mocks installed; reset store + cookie in `beforeEach`)

```ts
it('login stores the user and session', async () => {
  await useAuthStore.getState().login({ username: 'ppa.user', password: 'password', remember: false });
  expect(useAuthStore.getState()).toMatchObject({ status: 'authenticated', user: { modules: ['ppa'] } });
  expect(readMockSession()).toBe('ppa.user');
});
it('wrong password rejects with INVALID_CREDENTIALS and stays unauthenticated', async () => {
  await expect(useAuthStore.getState().login({ username: 'admin', password: 'nope', remember: false }))
    .rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  expect(useAuthStore.getState().status).toBe('unauthenticated');
});
it('fetchMe without session → unauthenticated, no throw');
it('fetchMe with unknown username cookie → unauthenticated and cookie cleared');
it('logout clears user and cookie');
// login.schema.test.ts
expect(loginSchema.safeParse({ username: ' ', password: '' }).error?.issues.map(i => i.message))
  .toEqual([lo.validation.usernameRequired, lo.validation.passwordRequired]);
```
Mock `delayResponse` must be 0 in tests: `installMocks` reads `delayResponse` from an optional second arg `{ delay?: number }`; tests pass `{ delay: 0 }` on a fresh instance or set it via env `NODE_ENV === 'test'`.

- [ ] **Step 2: Run** `pnpm test --run src/features/auth` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `pnpm test --run && pnpm typecheck && pnpm lint` → PASS.
- [ ] **Step 5: Commit** `feat: auth store, service and mock users`.

---

### Task 7: Login and Forgot-password screens

**Files:**
- Create: `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/features/auth/components/{login-form,forgot-password-form}.tsx`
- Test: `src/features/auth/components/login-form.test.tsx`, `forgot-password-form.test.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `loginSchema` (Task 6); `getLandingRoute` (Task 5); `getSafeNext` (Task 5); `toUserMessage` (Task 4); `FadeIn`, `BackgroundGlows`, `ThemeToggle` (Task 2).
- Produces: `LoginForm({ next?: string | null; reason?: string | null })`; `ForgotPasswordForm()`. `login/page.tsx` is a Server Component that awaits `searchParams` and passes `next` and `reason` down.

Layout per Design.md §5 Login + artboard 00: split screen — brand panel (`flex 1 1 520px`, `fade-in-hero`) with LCMS logo text in `--gold-soft`, serif H1 46–52px, three module accent chips; form card max-w 500–520px (`fade-in-scale`, 150ms delay), fields `fade-in-up-sm` staggered; inputs h 50, login button h 52 radius 14, primary gradient. Theme toggle top-right. Mobile: brand panel stacks above form, no horizontal scroll at 360px.

- [ ] **Step 1: Write failing tests** (`vi.mock('next/navigation')` → `useRouter` returning `{ replace }`; spy store `login`)

```tsx
it('shows Lao validation errors on empty submit', async () => {
  await user.click(screen.getByRole('button', { name: lo.auth.submit }));
  expect(await screen.findByText(lo.validation.usernameRequired)).toBeVisible();
  expect(screen.getByText(lo.validation.passwordRequired)).toBeVisible();
});
it('redirects to safe next after login');                // next='/legal', admin → replace('/legal')
it('ignores unsafe next and uses landing route');        // next='//evil.com', ppa.user → replace('/ppa')
it('uses landing route when no next');                   // multi.user → replace('/')
it('shows invalid-credentials message in role=alert');   // login rejects INVALID_CREDENTIALS
it('shows session-expired banner when reason=expired');
it('toggles password visibility with labelled button');  // aria-label switches showPassword ↔ hidePassword, input type password ↔ text
// forgot-password-form.test.tsx
it('shows the neutral sent message after submit');      // text lo.auth.forgotSent, regardless of username
```
- [ ] **Step 2: Run** `pnpm test --run src/features/auth/components` → FAIL.
- [ ] **Step 3: Implement** with react-hook-form + `zodResolver(loginSchema)`; inputs use `<label htmlFor>`; submit button disabled + spinner while submitting; error region `role="alert"`.
- [ ] **Step 4: Run** unit tests + `pnpm typecheck && pnpm lint` → PASS. Then `pnpm dev`, open `/login` in dark and light, compare against Design.md §5/§6 login specs, fix visual gaps.
- [ ] **Step 5: Commit** `feat: login and forgot-password screens`.

---

### Task 8: Shared components and restyled shadcn primitives

**Files:**
- Create: `src/components/shared/{glass-card,status-badge,countdown-badge,kpi-card,empty-state,alert-banner,search-input}.tsx`, `src/components/layout/page-header.tsx`
- Modify: `src/components/ui/button.tsx`, `src/components/ui/input.tsx` (+ `textarea`, `select` trigger to match input)
- Test: `src/components/shared/{status-badge,countdown-badge,kpi-card,alert-banner}.test.tsx`

**Interfaces:**
- Consumes: `STATUS_META`, `StatusTone` (Task 3); `getCountdownTone`, `formatCountdown` (Task 3); `FadeIn` (Task 2).
- Produces:
  - `Button` variants: `primary` (default), `secondary`, `ghost`, `gold`, `destructive`; sizes `default` (h-11), `lg` (h-13, login), `icon` (44×44). Specs Design.md §6, hover brightness +12% + `-translate-y-px`, active `scale-[0.98]`.
  - `Input`: h-11, radius 12, `--surface-input`, gold focus ring (dark) / navy ring (light).
  - `GlassCard({ as?, accent?: 'ppa'|'gc'|'legal'|'litigation'; highlight?: boolean; interactive?: boolean; className?; children })` — `accent` draws the 2–3px top accent line; `highlight` uses the navy-gold card; `interactive` adds hover lift + gold border.
  - `StatusBadge({ tone: StatusTone; label: string })`, `ContractStatusBadge({ status: ContractStatus })`.
  - `CountdownBadge({ days: number })` → `null` when `getCountdownTone(days)` is null; root has `data-tone`.
  - `KpiCard({ label: string; value: ReactNode; delta?: { text: string; positive: boolean }; variant?: 'default'|'warning'|'danger'; index?: number })` — value 34/600 `tabular-nums`; wraps in `FadeIn variant="up" index`.
  - `EmptyState({ title: string; description?: string; action?: ReactNode })`.
  - `AlertBanner({ tone: 'amber'|'rose'; title: string; description?: string; action?: ReactNode })` — `role="alert"` for rose, `role="status"` for amber; `fade-in-down`.
  - `SearchInput({ value: string; onChange(v: string): void; placeholder?: string; 'aria-label': string; className? })`.
  - `PageHeader({ eyebrow?: string; title: string; meta?: ReactNode; actions?: ReactNode; accent?: ModuleKey })` — serif H1 32–34px; eyebrow uppercase tracking 0.12–0.18em in module color.

- [ ] **Step 1: Write failing tests**

```tsx
render(<ContractStatusBadge status="expiring" />);
expect(screen.getByText('ໃກ້ໝົດອາຍຸ')).toBeVisible();
expect(container.querySelector('[data-slot="dot"]')).toHaveAttribute('aria-hidden', 'true');

render(<CountdownBadge days={5} />);  expect(screen.getByText('ອີກ 5 ມື້').closest('[data-tone]')).toHaveAttribute('data-tone', 'urgent');
render(<CountdownBadge days={45} />); expect(screen.getByText('ອີກ 45 ມື້').closest('[data-tone]')).toHaveAttribute('data-tone', 'planning');
const { container: c } = render(<CountdownBadge days={120} />); expect(c).toBeEmptyDOMElement();

render(<KpiCard label="L" value="1,240" />); expect(screen.getByText('1,240')).toHaveClass('tabular-nums');

render(<AlertBanner tone="rose" title="T" />);  expect(screen.getByRole('alert')).toHaveTextContent('T');
render(<AlertBanner tone="amber" title="A" />); expect(screen.getByRole('status')).toHaveTextContent('A');
```
- [ ] **Step 2: Run** `pnpm test --run src/components/shared` → FAIL.
- [ ] **Step 3: Implement.** Tone → class maps live inside each component file and use Design.md §2.5 values for both themes.
- [ ] **Step 4: Run** tests + `pnpm typecheck && pnpm lint` → PASS.
- [ ] **Step 5: Commit** `feat: shared glass components and restyled primitives`.

---

### Task 9: App shell — navigation config, UI store, sidebar, top bar

**Files:**
- Create: `src/config/navigation.ts`, `src/stores/ui.store.ts`, `src/components/layout/{app-shell,app-sidebar,topbar,module-switcher,breadcrumbs,user-menu,notification-bell}.tsx`
- Test: `src/config/navigation.test.ts`, `src/stores/ui.store.test.ts`, `src/components/layout/app-sidebar.test.tsx`, `notification-bell.test.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 6); `getAccessibleModules` (Task 5); `MODULES`, `lo.nav` (Task 3); `ThemeToggle`, `BackgroundGlows` (Task 2); `SearchInput`, `Button` (Task 8).
- Produces:
  - `NavItem = { key: string; label: string; href: string; icon: LucideIcon; countKey?: string }`; `MODULE_NAV: Record<ModuleKey, NavItem[]>` — ppa: dashboard `/ppa`, contracts `/ppa/contracts`, create `/ppa/new`, alerts `/ppa/alerts`, documents `/ppa/documents`; gc: `/contracts`, `/contracts/list`, `/contracts/new`, `/contracts/alerts`; legal: `/legal`, `/legal/regulations`, `/legal/procurement`, `/legal/laws`, `/legal/cases`, `/legal/hearings`.
  - `getModuleFromPath(pathname: string): ModuleKey | null`; `isNavItemActive(pathname: string, href: string): boolean` (module roots match exactly; others match the path or any `href/…` child).
  - `useUiStore` — `{ sidebarCollapsed: boolean; lastModule: ModuleKey | null; tableDensity: 'comfortable'|'compact'; setSidebarCollapsed; setLastModule; setTableDensity }`, zustand `persist` with key `'lcms-ui'`.
  - `AppShell({ children; unreadCount?: number })` — if `getModuleFromPath(pathname)` is a module: flex-wrap row gap-24 p-24, sidebar `flex: 1 1 248px`, main `flex: 999 1 560px; min-width: 0`, module-tinted `BackgroundGlows`; else the Home layout: no sidebar, `max-w-[1280px] mx-auto`, navy top bar. Sets `lastModule` on module routes. Sidebar does not animate; top bar `fade-in-down`.
  - `AppSidebar({ module: ModuleKey })` — logo → `ModuleSwitcher` (rendered only when the user has ≥2 accessible modules) → Home link → section label → module items → user card. Active item: `aria-current="page"`, primary gradient 45%→10%, 3px gold left bar. Navy gradient in light theme.
  - `Topbar({ unreadCount: number; variant: 'module'|'home' })` — breadcrumbs left; search (w 260–300px, hidden < md), theme toggle, bell, user menu right.
  - `NotificationBell({ unreadCount: number })` — link to `/notifications`, `aria-label` = `lo.topbar.notifications`, rose dot only when `unreadCount > 0` (dot `aria-hidden`; the count is appended to the label for screen readers).
  - `UserMenu()` — avatar dropdown with name, department, logout (`useAuthStore.logout()` then `router.replace('/login')`).
  - `Breadcrumbs()` — `ໜ້າຫຼັກ` › module name › nav item label, derived from pathname + `MODULE_NAV`.

- [ ] **Step 1: Write failing tests**

```ts
expect(getModuleFromPath('/ppa/contracts/12')).toBe('ppa');
expect(getModuleFromPath('/contracts/list')).toBe('gc');
expect(getModuleFromPath('/legal')).toBe('legal');
expect(getModuleFromPath('/')).toBeNull();
expect(getModuleFromPath('/notifications')).toBeNull();
expect(isNavItemActive('/ppa/contracts/12', '/ppa/contracts')).toBe(true);
expect(isNavItemActive('/ppa/contracts', '/ppa')).toBe(false);
expect(isNavItemActive('/ppa', '/ppa')).toBe(true);
expect(isNavItemActive('/ppa/contracts-archive', '/ppa/contracts')).toBe(false);

// ui.store.test.ts
useUiStore.getState().setLastModule('gc');
expect(JSON.parse(localStorage.getItem('lcms-ui')!).state.lastModule).toBe('gc');
```
```tsx
// app-sidebar.test.tsx — mock usePathname('/ppa/contracts'), seed auth store
it('marks the active item with aria-current');                       // link ລາຍການສັນຍາ has aria-current="page"
it('hides the module switcher for a single-module user');            // ppa.user → no gc/legal names rendered
it('shows the module switcher for multi-module users');               // multi.user → switcher present, legal absent
// notification-bell.test.tsx
it('shows the rose dot only when unread > 0');
```
- [ ] **Step 2: Run** `pnpm test --run src/config src/stores src/components/layout` → FAIL.
- [ ] **Step 3: Implement.** Sidebar on mobile (< lg): stacks above content per Design.md §5 (no drawer in Phase 1).
- [ ] **Step 4: Run** tests + `pnpm typecheck && pnpm lint` → PASS.
- [ ] **Step 5: Commit** `feat: app shell, sidebar and top bar`.

---

### Task 10: Guards and route skeleton

**Files:**
- Create: `src/components/guards/{auth-gate,module-guard,role-gate}.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/{forbidden,notifications}/page.tsx`, `src/app/(app)/{ppa,contracts,legal}/{layout,page}.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`
- Test: `src/components/guards/{auth-gate,module-guard,role-gate}.test.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 6); `canAccessModule` (Task 5); `clearMockSession` (Task 5); `AppShell` (Task 9); `PageHeader`, `EmptyState`, `Button` (Task 8).
- Produces:
  - `AuthGate({ children })` — on mount calls `fetchMe()` when `status === 'idle'`; `idle|loading` → full-page skeleton (glass sidebar + header skeletons, `aria-busy="true"`); `unauthenticated` → `clearMockSession()` then `router.replace('/login?reason=expired&next=' + encodeURIComponent(pathname + search))`, render null; `authenticated` → children.
  - `ModuleGuard({ module: ModuleKey; children })` — no access → `router.replace('/forbidden')`, render null.
  - `RoleGate({ role: Role; children; fallback?: ReactNode })` — renders fallback (default null) when role differs (admin passes every gate).
  - `(app)/layout.tsx` = `<AuthGate><AppShell>{children}</AppShell></AuthGate>` (Task 11 adds `unreadCount`).
  - Module layouts wrap `<ModuleGuard module="ppa|gc|legal">`. Module dashboards (placeholder until their phase): `PageHeader eyebrow=MODULES[m].code title=MODULES[m].name accent=m` + `EmptyState title={lo.common.underConstruction}`.
  - `/forbidden`: `lo.forbidden.title`, `lo.errors.forbidden`, button back to `/`. `/notifications`: placeholder like dashboards. `not-found.tsx`: `lo.errors.pageNotFound` + back home. `error.tsx` (client): `lo.errors.unknown` + retry button calling `reset()`.

- [ ] **Step 1: Write failing tests** (mock `next/navigation`: `useRouter`, `usePathname('/ppa')`, `useSearchParams('')`)

```tsx
it('AuthGate fetches me when idle and shows skeleton', () => { /* status idle → fetchMe called, aria-busy present */ });
it('AuthGate redirects to login with reason=expired and next when unauthenticated', () => {
  // status unauthenticated → replace('/login?reason=expired&next=%2Fppa'); children not rendered
});
it('AuthGate renders children when authenticated');
it('ModuleGuard redirects ppa.user away from legal', () => { /* replace('/forbidden'); children absent */ });
it('ModuleGuard renders children for admin');
it('RoleGate hides admin-only content from users and shows fallback');
```
- [ ] **Step 2: Run** `pnpm test --run src/components/guards` → FAIL.
- [ ] **Step 3: Implement** guards and routes. Route files stay thin (no logic beyond composing components; module `page.tsx` files are Server Components).
- [ ] **Step 4: Run** tests + `pnpm typecheck && pnpm lint && pnpm build` → PASS. Manual check with `pnpm dev`: log in as `ppa.user`, open `/legal` → `/forbidden`.
- [ ] **Step 5: Commit** `feat: auth and module guards with route skeleton`.

---

### Task 11: Home module launcher + alerts data

**Files:**
- Create: `src/features/alerts/{api/alerts.service.ts, store/alerts.store.ts, mocks/alerts.mock.ts, index.ts}`, `src/features/home/{types.ts, api/home.service.ts, lib/filter-summary.ts, mocks/home.mock.ts, components/{home-view,module-card,upcoming-list,alert-summary}.tsx, index.ts}`, `src/lib/api/mock/handlers/{alerts,home}.ts`
- Modify: `src/app/(app)/page.tsx`, `src/app/(app)/layout.tsx` (pass `unreadCount` from alerts store via a small client wrapper or inside `AppShell`), `src/lib/api/mock/index.ts`
- Test: `src/features/home/lib/filter-summary.test.ts`, `src/features/home/components/{home-view,upcoming-list}.test.tsx`, `src/features/alerts/store/alerts.store.test.ts`

**Interfaces:**
- Consumes: `api`, `endpoints` (Task 4); `useAuthStore` (Task 6); `getLandingRoute`, `getAccessibleModules`, `readMockSession` (Task 5); `daysLeft`, `formatDate`, `formatNumber` (Task 3); `GlassCard`, `CountdownBadge`, `KpiCard`, `EmptyState` (Task 8); `FadeIn` (Task 2).
- Produces:
  - `HomeSummary = { modules: Array<{ module: ModuleKey; total: number; active: number; expiring: number }>; upcoming: Alert[]; alertBuckets: { within7: number; within30: number; within90: number } }`.
  - `homeService.summary(): Promise<HomeSummary>`; `alertsService.list(q?: { module?: ModuleKey; window?: 7|30|90 }): Promise<Alert[]>`; `alertsService.markRead(id: string): Promise<void>`.
  - `filterSummaryForUser(s: HomeSummary, u: User, today?: Date): HomeSummary` — keeps only accessible modules; `upcoming` = accessible modules, `0 ≤ daysLeft(dueDate) ≤ 30`, sorted ascending by `dueDate`; buckets recomputed from the filtered alerts (`within7` = 0..7, `within30` = 8..30, `within90` = 31..90).
  - `useAlertsStore` — `{ items: Alert[]; unreadCount: number; status: 'idle'|'loading'|'ready'|'error'; fetch(): Promise<void>; reset(): void }`.
  - Mock data: ~14 alerts spread across the 3 modules with `dueDate` computed relative to **today** at module load (offsets e.g. −2, 0, 3, 7, 12, 25, 30, 45, 80, 120 days), some `read: true`. Mock handlers filter by the session user's modules (`readMockSession` → `MOCK_USERS`).
  - `HomeView()` (client): if `getLandingRoute(user) !== '/'` → `router.replace(that)` and render null. Otherwise: serif H1 `lo.home.title` (`fade-in-hero`) → `ModuleCard` grid `repeat(auto-fit, minmax(300px,1fr))`, staggered 80ms (`style={{ animationDelay: i*80ms }}`) → two-column section (3:2) with `UpcomingList` and `AlertSummary`. Loading → skeleton cards; error → `AlertBanner tone="rose"` with retry.
  - `ModuleCard({ module: ModuleKey; stats?: { total; active; expiring } })` — `GlassCard accent interactive`, icon chip (tinted recipe §2.4), eyebrow code, serif name, 3 stats `tabular-nums`, link `MODULES[m].href` with text `lo.home.openModule`.
  - `UpcomingList({ alerts: Alert[] })` — rows: title, module chip, `formatDate(dueDate)`, `CountdownBadge days={daysLeft(dueDate)}`; empty → `EmptyState title={lo.home.noUpcoming}`; rows `fade-in-up-sm` staggered (first 10 only).
  - `AlertSummary({ buckets })` — 3 KPI tiles: ≤7 rose, 8–30 amber, 31–90 blue.

- [ ] **Step 1: Write failing tests**

```ts
// filter-summary.test.ts — today = new Date(2026, 9, 20); fixtures across ppa/gc/legal with offsets −2, 0, 5, 20, 30, 31, 60
const r = filterSummaryForUser(summary, multiUser /* ppa,gc */, today);
expect(r.modules.map(m => m.module)).toEqual(['ppa', 'gc']);
expect(r.upcoming.every(a => a.module !== 'legal')).toBe(true);
expect(r.upcoming.map(a => daysLeft(a.dueDate, today))).toEqual([0, 5, 20, 30]);   // no past, no >30, sorted
expect(r.alertBuckets).toEqual({ within7: 2, within30: 2, within90: 2 });          // per fixture design
expect(filterSummaryForUser(summary, noneUser, today).modules).toEqual([]);
```
```tsx
// home-view.test.tsx — mock router; seed auth store; mock homeService.summary
it('admin sees three module cards');
it('multi.user sees exactly two module cards (ppa, gc)');
it('redirects ppa.user to /ppa without rendering cards');
it('redirects none.user to /forbidden');
it('shows a retry banner when the summary request fails');
// upcoming-list.test.tsx
it('renders countdown badges and the empty state');
// alerts.store.test.ts
it('computes unreadCount from fetched items');
```
- [ ] **Step 2: Run** `pnpm test --run src/features` → FAIL.
- [ ] **Step 3: Implement.** `HomeView` applies `filterSummaryForUser` even though the mock filters server-side (defence in depth; spec §11 "filtered by the user's modules"). `AppShell` fetches alerts once when authenticated and passes `unreadCount` to `Topbar`; `logout` calls `useAlertsStore.getState().reset()`.
- [ ] **Step 4: Run** `pnpm test --run && pnpm typecheck && pnpm lint && pnpm build` → PASS.
- [ ] **Step 5: Commit** `feat: home module launcher and alerts store`.

---

### Task 12: End-to-end tests and Phase 1 Definition-of-Done check

**Files:**
- Create: `playwright.config.ts`, `e2e/helpers.ts`, `e2e/{auth,rbac,theme,responsive-a11y}.spec.ts`
- Modify: `.gitignore` (`/test-results`, `/playwright-report`)

**Interfaces:**
- Consumes: everything above; mock users from Task 6.
- Produces: `loginAs(page: Page, username: string): Promise<void>` in `e2e/helpers.ts`; Playwright projects `desktop` (Chromium 1280×800) and `mobile` (Chromium 360×780); `webServer: { command: 'pnpm dev', url: 'http://localhost:3000', reuseExistingServer: true }`.

- [ ] **Step 1: Install browser** `pnpm exec playwright install chromium`.

- [ ] **Step 2: Write specs**

```ts
// auth.spec.ts
test('unauthenticated /ppa goes to login with next', ...);           // expect URL /login?next=%2Fppa
test('login honours next and rejects off-site next', ...);           // /login?next=//evil.com as admin → URL is http://localhost:3000/
test('wrong password shows Lao error', ...);                         // getByRole('alert') has text 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ'
test('stale session cookie ends on login with expired banner, no loop', ...);
  // context.addCookies([{ name: 'lcms_session', value: 'mock:ghost', url }]); goto('/ppa')
  // → URL matches /login?reason=expired; banner text lo.auth.sessionExpired; record navigations < 5
test('logout returns to login and protects routes again', ...);
// rbac.spec.ts
test('admin lands on Home with three module cards', ...);
test('ppa.user lands on /ppa and /legal shows forbidden', ...);
test('multi.user sees two cards and the module switcher', ...);
test('none.user lands on /forbidden', ...);
// theme.spec.ts
test('defaults to dark, toggles to light, persists after reload', ...); // <html> class contains/omits 'dark'
// responsive-a11y.spec.ts — for /login, / (admin), /ppa (admin), in dark and light
test('no horizontal scroll at 360px', ...);                         // scrollWidth <= clientWidth (mobile project)
test('no serious or critical axe violations', ...);                 // AxeBuilder().analyze(); filter impact serious|critical → []
```

- [ ] **Step 3: Run** `pnpm e2e` → fix failures (failures here are bugs in Tasks 1–11; fix in place, re-run unit tests for the touched area).

- [ ] **Step 4: Full verification**

Run: `pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm e2e`
Expected: all exit 0; e2e report shows every spec passing in both projects.

- [ ] **Step 5: Visual DoD pass** — capture screenshots of `/login`, `/`, `/ppa`, `/forbidden` in dark and light at 360px and 1280px (`page.screenshot` into `test-results/dod/`) and attach the paths to the task report for the Opus reviewer to compare against Design.md.

- [ ] **Step 6: Commit** `test: e2e coverage for auth, rbac, theme, responsive and a11y`.

---

## Phase 1 Exit Criteria

- All 12 tasks reviewed and approved by the Opus controller.
- `pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm e2e` green on `phase-1-foundation`.
- Switching `.env.local` to `NEXT_PUBLIC_API_MODE=live` builds without code changes (requests then fail with the Lao network error, which is the expected behaviour until Phase 5).
- Whole-branch review (`superpowers:requesting-code-review`), then `superpowers:finishing-a-development-branch`; then Opus writes the Phase 2 plan against the merged code.
