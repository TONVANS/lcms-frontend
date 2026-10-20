# LCMS Frontend — Agent Guide for Phase 2 and Later

This guide is for AI agents (planners, implementers, reviewers) continuing LCMS after Phase 1. Read it once at the start of every session, after `CLAUDE.md`.

The specs are still binding, and this guide does not replace them. Where it conflicts with them, they win:

- `Design.md` covers tokens, components, layout, motion and role rules.
- `Frontend_LCMS_Project.md` covers the stack, folder structure, API contracts and the Definition of Done.

---

## 1. Read order

1. `CLAUDE.md`: global constraints and verification commands.
2. This guide.
3. The `Design.md` and `Frontend_LCMS_Project.md` sections that your task cites.
4. `docs/superpowers/plans/2026-10-20-lcms-roadmap.md`: phase scope.
5. The current phase plan in `docs/superpowers/plans/`, if one exists.

Don't skim the whole codebase. Use §4 to find what already exists.

---

## 2. Where the project stands

**Phase 1 (Foundation) is complete** on branch `phase-1-foundation`. Status: 142 unit tests, 46 e2e tests and axe all pass.

What exists:

- Scaffold. Design tokens for the dark and light themes, fonts, the theme toggle and motion utilities.
- Lao dictionary, date, number and money formatters.
- API layer: one axios instance, a refresh interceptor, a mock adapter, and error normalization.
- Auth: login, forgot-password, the auth store, session-cookie helpers, `proxy.ts`, and the guards `AuthGate`, `ModuleGuard` and `RoleGate`.
- App shell: sidebar, top bar, module switcher, breadcrumbs, user menu and notification bell.
- Shared components (§4.3).
- Home module launcher, plus an alerts store.
- Playwright e2e covering auth, RBAC, theme, responsive layout and axe.

**Not built yet:** module dashboards are placeholders ("ໜ້ານີ້ກຳລັງພັດທະນາ"). There are no list, detail or wizard pages, and no charts. The notifications centre, search and admin pages are also missing.

**Next:** Phase 2, the PPA module. See §6.

---

## 3. How work is done here

### 3.1 Roles

| Role | Model | Does | Never does |
|---|---|---|---|
| Planner, controller, reviewer | Opus | Writes the phase plan from the specs **and the existing code**. Dispatches one task at a time, reviews each task (spec compliance plus quality), rules on conflicts, and runs the whole-branch review. | Writes feature code |
| Implementer and tester | Sonnet (subagent per task) | Implements one task with TDD, runs the verification, commits, and writes a report | Changes interfaces owned by other tasks; spawns subagents or reviewers |

Skills to use:

- `superpowers:writing-plans`: one plan per phase.
- `superpowers:subagent-driven-development`: execution.
- `superpowers:finishing-a-development-branch`: end of a phase.

### 3.2 Per-task loop

1. The plan task names the exact files, signatures, tests and spec values.
2. The implementer writes a failing test and runs it, keeping the RED output. Then it implements and runs the test again for GREEN.
3. Run `pnpm typecheck; pnpm lint; pnpm test --run`, plus `pnpm build` when a task touches routes or config. **Capture each real exit code** (`cmd; echo EXIT=$?`). A pipe through `tail` hides failures.
4. Commit with a conventional-commit message.
5. The report must include TDD evidence, exit codes and files changed.
6. Review. Findings go back to the **same** implementer for fixes, followed by a scoped re-review.

### 3.3 Rulings

When the plan and the code disagree, the controller decides. It records the decision as `Ruling: <decision> — <why> — <cost if wrong>` and moves on. Stop and ask the human only for:

- destructive or irreversible actions
- security-sensitive actions
- pushes, merges or publishing
- a plan so broken that every path forward is a guess

---

## 4. Reuse inventory (use these; don't rebuild them)

### 4.1 Foundations

| Need | Use | Location |
|---|---|---|
| Class merging | `cn()` (always this import path) | `@/lib/utils/cn` |
| Lao strings | `lo.<section>.<key>` | `src/lib/i18n/lo.ts` |
| Dates | `formatDate(iso)` → `dd/mm/yyyy`; `formatMonthYear`; `daysLeft(iso, today?)`; `LAO_MONTHS_SHORT`; `LAO_WEEKDAYS` (Mon-first) | `@/lib/utils/date` |
| Numbers and money | `formatNumber(n, maxFrac=2)` (en-US grouping); `formatMoney({amount,currency})` → `1,200,000 USD` | `@/lib/utils/number`, `@/lib/utils/money` |
| Countdown | `getCountdownTone(days)` returns `urgent`, `warning`, `planning` or `null`; `formatCountdown(days)` | `@/lib/utils/countdown` |
| Status | `STATUS_META[status]` → `{label, tone}`; `StatusTone` | `@/lib/constants/status` |
| Modules | `MODULES[m]` → `{key, code, name, href, icon}`; `MODULE_HOME` | `@/lib/constants/modules`, `@/lib/auth/permissions` |
| Routes | `ROUTES`, `PUBLIC_ROUTES` | `@/lib/constants/routes` |
| Alert windows | `ALERT_WINDOWS = [90, 30, 7]` | `@/lib/constants/alert-windows` |
| Types | `Paginated<T>`, `ListQuery`, `ApiError`, `ID`, `ISODate`; `User`, `ModuleKey`, `Role`, `Permission`, `ContractStatus`, `Money`, `KeyEvent`, `DocumentFile`, `Alert`, `Department` | `@/types/api`, `@/types/domain` |
| Env | `env.NEXT_PUBLIC_API_MODE` (`mock` or `live`), etc. | `@/config/env` |

### 4.2 API and auth

| Need | Use |
|---|---|
| HTTP | `api` from `@/lib/api/client`. Call it only from `src/features/*/api/*.service.ts`. |
| URLs | Add every path to `endpoints` in `@/lib/api/endpoints`. Never inline a URL. |
| Errors | Interceptors already reject with a normalized `ApiError`. Use `toUserMessage(err)` for Lao text and `normalizeError(e)` for unknown throws. |
| Mocks | Add `src/lib/api/mock/handlers/<feature>.ts` exporting `register(mock)`, then append it to the `handlers` array in `src/lib/api/mock/index.ts`. Keep mock data in `src/features/<x>/mocks/`. |
| Current user | `useAuthStore(s => s.user)`. Status values: `idle`, `loading`, `authenticated`, `unauthenticated`, `error`. |
| Access checks | `canAccessModule(u, m)`, `hasPermission(u, m, p)`, `getAccessibleModules(u)`, `getLandingRoute(u)` |
| Guards | `ModuleGuard` already wraps every module `layout.tsx`. Use `RoleGate role="admin"` for admin-only UI. |

### 4.3 Components

| Component | Key props | Notes |
|---|---|---|
| `GlassCard` (`shared/glass-card`) | `as?`, `accent?: 'ppa'\|'gc'\|'legal'\|'litigation'`, `highlight?`, `interactive?`, plus rest props | Glass is theme-aware. To tint it, override `--glass-bg` and `--glass-border`. **Don't** use `bg-*` or `border-*` classes; the `glass` shorthand overrides them. |
| `KpiCard` | `label`, `value`, `delta?`, `variant?: 'default'\|'warning'\|'danger'\|'info'`, `index?` | `info` is blue (31–90 days) |
| `StatusBadge`, `ContractStatusBadge` | `{tone,label}`, `{status}` | Shows a dot plus a label, never colour alone |
| `CountdownBadge` | `days` | Renders nothing when days > 90 |
| `AlertBanner` | `tone: 'amber'\|'rose'`, `title`, `description?`, `action?` | Rose has role=alert; amber has role=status |
| `EmptyState` | `title`, `description?`, `action?` | |
| `SearchInput` | `value`, `onChange`, `aria-label`, `placeholder?` | |
| `FadeIn` | `variant: 'in'\|'up'\|'up-sm'\|'scale'\|'down'\|'hero'`, `index?` | `index` adds a 60ms stagger, capped at 8 items |
| `PageHeader` (`layout/page-header`) | `eyebrow?`, `title`, `meta?`, `actions?`, `accent?` | Use it on every page |
| `Button` (`ui/button`) | variant `primary` (default), `secondary`, `ghost`, `gold`; size `default`, `lg`, `icon` | `gold` is for the Legal module primary action only |
| Layout | `AppShell`, `AppSidebar`, `Topbar`, `ModuleSwitcher`, `Breadcrumbs`, `BackgroundGlows`, `ThemeToggle` | Sidebar nav comes from `MODULE_NAV` in `src/config/navigation.ts` |

shadcn primitives are in `src/components/ui/`. After `pnpm dlx shadcn@latest add <x>`:

- Rewrite `from "cn"` to `from '@/lib/utils/cn'`.
- Replace any `focus-visible:ring-*` or `outline-none` focus styling with `focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)`.

---

## 5. Recipes

### 5.1 New feature module (for example `features/ppa`)

```
src/features/ppa/
  types.ts                 # PpaContract etc. — copy from Frontend_LCMS_Project.md §6
  schemas/ppa.schema.ts    # ONE zod schema shared by modal form and wizard; Lao messages from lo
  api/ppa.service.ts       # list/get/create/update/remove/dashboard via api + endpoints
  mocks/ppa.mock.ts        # ≥25 records covering every status / energy type; dates relative to today
  store/ppa-list.store.ts  # filters, page, pageSize, sort, items, total, status, error, fetch(), reset()
  components/…             # feature UI
  index.ts                 # the ONLY import surface for other code
```

Then:

1. Add the endpoints, write the mock handler, and register the handler (§4.2).
2. Keep the route files thin, for example `src/app/(app)/ppa/contracts/page.tsx`. They should be Server Components that render the feature's client component.
3. Check the nav entries in `MODULE_NAV`.
4. Put every new string in `lo.ts`, and list new keys in your report for native-speaker review.

### 5.2 List stores (required pattern)

- **Generation counter.** `reset()` increments a module-level `generation`, and `fetch()` drops its result, whether success or error, if the generation changed. Copy the pattern from `src/features/alerts/store/alerts.store.ts`.
- **Cancellation.** Ignore `code === 'ERR_CANCELED'`. Today the normalizer maps it to NETWORK, so fix that first (§6.1).
- **URL sync.** Keep filters, page and sort in sync with `searchParams` so links can be shared. `useSearchParams` needs a `<Suspense>` boundary (§7).
- **Reset on logout.** Feature stores must clear on logout. Build the logout-reset registry (§6.1) and don't import feature stores into `features/auth`.

### 5.3 Pages

- Every screen needs a loading state (skeleton), an empty state (`EmptyState`), an error state (`AlertBanner` rose plus a retry) and a forbidden state (handled by `ModuleGuard`).
- Tables use the shared `DataTable`, which Phase 2 creates (`@tanstack/react-table`). Wrap it in `overflow-x-auto`. The footer reads `lo.common.showing(x, y)` and sits next to the pagination.
- Charts must follow `dataviz` and Design.md §7. Use module-accent gradients; status colours are only for status charts.

---

## 6. Phase 2 entry gates and roadmap

### 6.1 Do these first in Phase 2 (deferred from Phase 1 reviews)

| # | Gate | Where |
|---|---|---|
| 1 | Replace the `--chart-*` tokens: they currently reuse reserved status colours. Use the module-accent series from Design.md §7. | `src/app/globals.css` |
| 2 | Make `formatDate` and `daysLeft` survive malformed strings: add an `isValid` guard so they return `'—'` or null and never throw or produce NaN. | `src/lib/utils/date.ts` |
| 3 | Add a hydration guard to `ui.store` before its first consumer (`skipHydration` plus `rehydrate()` in an effect, or a mounted guard). | `src/stores/ui.store.ts` |
| 4 | Treat `CanceledError` as cancellation, not NETWORK. Stores must ignore it. | `src/lib/api/errors.ts` |
| 5 | Logout-reset registry. Feature stores register their `reset`, and it runs on logout. | `src/lib/auth/` or `src/stores/` |
| 6 | Let `MODULE_NAV` items match by prefix, so `/contracts/[id]` highlights the GC list item. | `src/config/navigation.ts` |
| 7 | Keep module data client-fetched. Server-rendered children under the client `ModuleGuard` end up in the RSC payload for forbidden users. | All module pages |

### 6.2 Roadmap

| Phase | Scope | Notes |
|---|---|---|
| 2 PPA | `/ppa` dashboard, `/ppa/contracts` list with modal form, `/ppa/contracts/[id]`, `/ppa/new` wizard, `/ppa/alerts`, `/ppa/documents` | Build the shared pieces first: `DataTable`, `FilterChips`, `ConfirmDialog`, `Stepper`, `Timeline`, `FileDropzone` with `FileList`, and the charts `BarList`, `StackedStatusBar` and `MonthlyBars`. Also add `features/documents`. |
| 3 GC | `/contracts`, `/contracts/list`, `/contracts/[id]`, `/contracts/new`, `/contracts/alerts` | Reuse the PPA patterns. |
| 4 Legal | Dashboard, regulations, procurement, law library, cases, hearings calendar, `/legal/new` | Use `MiniCalendar` (Mon-first, Lao weekdays) and the gold CTA. Litigation uses the violet accent. |
| 5 Backend | Follow the `Frontend_LCMS_Project.md` §11 checklist | Also add an e2e project in `live` mode. |
| 6 Admin and hardening | Users, roles, departments, notifications centre, search, e2e for every route | |

Write each phase plan after the previous phase merges, against the real code.

---

## 7. Pitfalls already paid for (don't repeat them)

| Pitfall | What to do instead |
|---|---|
| Shell heredocs strip backslashes. One cost us a broken proxy matcher (`.*\..*`) that left every route unprotected. | Write files with the Write/Edit tools. |
| `cacheComponents: true` is on. `searchParams`, `cookies()` and `useSearchParams` outside `<Suspense>` fail `pnpm build`. | Wrap the dynamic part in `<Suspense>`. |
| Hydration mismatch: theme and `localStorage` values differ between server and client. | Mounted guard: `useSyncExternalStore(() => () => {}, () => true, () => false)`. |
| `dark:bg-[linear-gradient…]` sets *background-image*, so the light `bg-[#…]` colour shows through. | Add `dark:bg-transparent`, or set the colour in dark mode too. |
| `glass` shorthand resets `bg-*`/`border-*` classes. | Override `--glass-bg` and `--glass-border`. |
| Navy surfaces (sidebar, Home top bar, highlight card) stay navy in light mode, so light-mode text and focus tokens fail there. | Use light text on navy, and override `--focus-ring` to gold `#d4b37a` on navy containers. |
| Live mode: the session cookie is httpOnly, so JS can't read it. | Never gate on reading the cookie. Use `hasSessionHint()` (mode-aware). |
| Redirect loops between `proxy.ts` and `AuthGate`. | `/login?reason=expired` and `/login?reason=logout` are exempt from the proxy bounce. Any new auth redirect must go through `decideRedirect` and have a test. |
| Running a view-model transform twice (the Home 31–90 bucket was always 0). | Give the server shape and the client view model **different types**, so a double application fails to type-check. |
| `expire()` racing `fetchMe` or `logout`. | `expire()` only acts while status is `authenticated`; `fetchMe` owns its own transition. |
| Exit codes hidden by `| tail`. | `cmd; echo EXIT=$?` |
| `DOD_SHOTS=1 pnpm e2e` is POSIX syntax. | In PowerShell: `$env:DOD_SHOTS=1; pnpm e2e` |

---

## 8. Definition of Done (per screen)

From `Frontend_LCMS_Project.md` §12:

- Matches Design.md in both dark and light themes, and is responsive down to 360px with no horizontal scroll.
- Has skeleton, empty, error and forbidden states.
- Forms are validated with zod, show Lao messages, and map server `fieldErrors` to their fields.
- Keyboard accessible: focus is visible on every surface, with ARIA for dialogs, tabs and toggles. Axe reports no serious or critical violations.
- Works in mock and live modes without code changes.
- `pnpm typecheck`, `pnpm lint`, `pnpm test --run`, `pnpm build` and `pnpm e2e` all exit 0.
- For each new route, extend `e2e/` (RBAC, responsive and axe) and `e2e/dod-screenshots.spec.ts`.

---

## 9. Test data (mock mode)

The password for every account is `password`.

| Username | Modules | Lands on |
|---|---|---|
| `admin` | all | `/` |
| `multi.user` | ppa, gc | `/` |
| `ppa.user` | ppa | `/ppa` |
| `gc.user` | gc | `/contracts` |
| `legal.user` | legal | `/legal` |
| `none.user` | none | `/forbidden` |

Run `pnpm dev` and open http://localhost:3000. E2E tests use a production build on port 3100.

---

## 10. Don't decide these alone (ask the human or the controller)

- Token strategy (httpOnly cookie or bearer), the refresh endpoint and the cookie names, which depend on the backend (Phase 5).
- Whether `daysLeft` comes from the server or the client, and the time zone (Asia/Vientiane is assumed).
- The label for the `terminated` status (currently `ຍົກເລີກ`).
- Lao copy quality. All strings are in `lo.ts`, so one native-speaker review covers them. Phase 1 keys pending review: `auth.brandHeading`, `auth.brandIntro`, `auth.forgotIntro`, `auth.forgotSubmit`, `topbar.searchLabel`, `topbar.unread`, `topbar.breadcrumb`, `nav.mainMenu`, `nav.moduleSwitcher`, `common.retry`, `home.stats.*`, `home.buckets.*`, `home.loadError`.
- Anything that changes Design.md tokens, fonts or the glassmorphism style.
