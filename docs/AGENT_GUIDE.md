# LCMS Frontend — Agent Guide (post-Phase 5)

This guide is for AI agents (planners, implementers, reviewers) continuing LCMS after Phase 5 (backend integration). Read it once at the start of every session, after `CLAUDE.md`.

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

| Phase | Status |
|---|---|
| 1 Foundation | Done (`phase-1-foundation`) |
| 3a GC (General Contracts) | Done on `phase-3a-gc`; rebuilt on the real backend in Phase 5. |
| 4a Legal (Regulations + Cases) | Done on `phase-4a-legal`; rebuilt on the real backend in Phase 5. |
| 5 Backend integration | Done on `phase-5-backend-integration` (details below). |

**Phase 5 summary.** The whole app now speaks the real NestJS backend contract (`docs/backend/openapi.json`, base `/api`). Auth is a Bearer JWT, and the user model is the backend profile (`role`, five `can*` flags, `accessibleModules`, `division`). Every response goes through the envelope helpers and a tolerant mapper, because live response shapes are not verified yet. Delivered: env and API core, Bearer login and flag-based permissions, shared status, lookups, attachments and history, a notifications store and page (replacing the old alerts), a role-aware sidebar with a mobile sheet, and the migrated PPA (power contracts), GC (contracts), Legal (documents and cases), Home (built from module dashboards and notifications), Support (contacts and tickets), Admin users (with HRM lookup), and Admin audit logs, contract types and departments. Mock mode serves the same envelope and Nest-style errors, so mock and live need no code change. The old Phase 2 PPA WIP, the 4b Legal scope, and `/ppa/documents` are gone.

**Still open after Phase 5:**

- Live verification: run `pnpm smoke:live` against the real backend (see `README.md`), which writes `docs/backend/live-shapes.json`.
- Tighten the tolerant mappers once `live-shapes.json` exists (§6).
- Native-speaker review of the new Lao keys (§10).
- 4b Legal (procurement, laws, hearings) stays deferred pending stakeholder confirmation.

Earlier delivery (Phase 1): scaffold and design tokens, Lao dictionary and formatters, API layer, auth, app shell, shared components (§4.3), Playwright e2e.

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
| Types | `Paginated<T>`, `ListQuery`, `ApiError`, `ID`, `ISODate`; `User`, `UserRole` (`ADMIN\|MAIN_USER\|EDITOR\|VIEWER`), `SystemModule`, `ModuleKey` (`ppa\|gc\|legal`), `AttachmentModule`, `Permission`, `ContractStatus`, `Currency`, `Money`, `Attachment`, `HistoryEntry`, `Department`, `ContractTypeOption` | `@/types/api`, `@/types/domain` |
| Envelope helpers | `unwrap<T>(body)` (`{data}` or raw), `unwrapPage(body, {page,pageSize}, map)` (tolerates array, `{data,meta}`, `{data:{items,total}}`, `{items,total}`), and the coercers `toNum`, `toStr`, `toIsoDate` (Prisma Decimal/BigInt strings, `''` → null) | `@/lib/api/envelope` |
| Env | `env.NEXT_PUBLIC_API_MODE` (`mock` or `live`), etc. | `@/config/env` |

### 4.2 API and auth

| Need | Use |
|---|---|
| HTTP | `api` from `@/lib/api/client`. Call it only from `src/features/*/api/*.service.ts`. |
| URLs | Add every path to `endpoints` in `@/lib/api/endpoints`. Never inline a URL. |
| Errors | Interceptors already reject with a normalized `ApiError`. Use `toUserMessage(err)` for Lao text and `normalizeError(e)` for unknown throws. |
| Mocks | Add `src/lib/api/mock/handlers/<feature>.ts` exporting `register(mock)`, then append it to the `handlers` array in `src/lib/api/mock/index.ts`. Keep mock data in `src/features/<x>/mocks/`. |
| Session | Bearer token in the JS-readable `lcms_session` cookie: `setSessionToken(token, remember)`, `readSessionToken()`, `clearSession()`, `hasSessionHint()` (`@/lib/auth/session`). The request interceptor adds `Authorization: Bearer`. In mock mode the token is `mock:<username>`. |
| Current user | `useAuthStore(s => s.user)`. Status values: `idle`, `loading`, `authenticated`, `unauthenticated`, `error`. |
| Access checks | `isAdmin(u)`, `hasSystemModule(u, sm)`, `canAccessModule(u, m)`, `hasPermission(u, m, p)`, `getAccessibleModules(u)`, `getLandingRoute(u)` (`@/lib/auth/permissions`). `isAdmin` is `role === 'ADMIN'`; `hasSystemModule` checks `accessibleModules`; `canAccessModule` maps the UI module to backend system modules (`gc` ⇐ `contracts`, `legal` ⇐ `legal-documents` or `legal-cases`, `ppa` ⇐ `power-contracts`). `hasPermission` maps `view→canView`, `create→canUpload`, `edit→canEdit`, `delete→canDelete`, `download→canDownload`; ADMIN and MAIN_USER hold all. |
| Guards | `ModuleGuard` already wraps every module `layout.tsx`. Use `RoleGate role="admin"` for admin-only UI. For module permissions use `useCan(module, permission)` (hook), `<Can module permission fallback>` (inline UI) and `<PermissionGuard module permission>` (whole routes; redirects to `/forbidden`), all from `@/components/guards`. Gate UI by permission, never by role name. |
| Mock enforcement | Mock handlers enforce permissions the way the server will: 401 with no session, 403 without the permission, 409 on conflicts. Read the user with `getMockSessionUser()` (`@/lib/api/mock/session`). Gate the UI **and** make the handler refuse. |
| Nav items | `NavItem.permission?` hides an item unless the user holds it (for example the `create` items). `NavItem.systemModule?` hides it unless the user's `accessibleModules` contains that system module. `MODULE_NAV[module]` is the per-module list, `COMMON_NAV` (notifications, support) shows for everyone, `ADMIN_NAV` (users, audit logs, contract types, departments) shows for admins (`src/config/navigation.ts`). |
| Lookups | `useDepartments()`, `useContractTypes()`, `useProjectTypes()` return `{items,status,...}` from a cached store (`features/lookups`; `lookupsService`, `useLookupsStore`). Use them for every dropdown. |
| Logout reset | `registerLogoutReset(fn)` (`@/lib/auth/logout-registry`); list stores and the notifications store register their `reset`. |
| Feature services | `gcService`, `legalDocumentsService`, `legalCasesService`, `ppaService`, `supportService`, `usersService`, `adminService`, `homeService`, `notificationsService`, `historyService`, `documentsService`, `authService`. Import them through each feature's `index.ts`. |

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
| `DataTable` (`shared/data-table`) | `columns: DataTableColumn<T>[]`, `data`, `getRowId`, `total`, `page`, `pageSize`, `onPageChange`, `sort?`, `onSortChange?`, `isLoading?`, `emptyTitle`, `emptyDescription?`, `emptyAction?`, `caption` | Owned API over TanStack v9, manual (server-side) sorting and pagination. `DataTableColumn` is `{id, header, cell(row), sortable?, align?, className?}`. `className` lands on the header, body **and skeleton** cells, so it drives responsive hiding (`hidden 2xl:table-cell`); move hidden data into sublines of a visible column. |
| `DocumentManager` (`features/documents`) | `module: AttachmentModule`, `entityId`, `canUpload`, `canDownload`, `canDelete` | Pass `useCan(module, 'create' / 'download' / 'delete')`. Never hard-code `true`: the mock server enforces them. |
| `HistoryTimeline` (`features/history`) | `kind: HistoryKind`, `id`, `pageSize?`, `action?` | Backend change history for a record; use it on detail pages next to `DocumentManager`. |
| Notifications (`features/notifications`) | `useNotificationsStore`, `NotificationsView`, `contractHref`, `notificationKey`, `sourcesFor` | Replaces the old alerts store. Merges contract and power notifications; the topbar bell and the `/notifications` page read it. |
| `DatePicker`, `MoneyInput` (`shared/`) | form-field controls | Use them in forms instead of raw inputs. |
| `useReturnFocus` (`@/hooks/use-return-focus`) | `(open) => onCloseAutoFocus` | Returns focus to the trigger when a dialog closes. |
| Support page, `SUPPORT_CONTACTS` | `/support`, `@/config/support`, `SupportCard` | The `/support` page (channels + tickets) and static fallback contacts. |
| Layout | `AppShell`, `AppSidebar` (role-aware, mobile sheet), `Topbar`, `ModuleSwitcher`, `Breadcrumbs`, `BackgroundGlows`, `ThemeToggle` | Sidebar nav comes from `MODULE_NAV`, `COMMON_NAV` and `ADMIN_NAV` in `src/config/navigation.ts` |

### 4.4 Tokens added in Phase 3a

| Token | Use |
|---|---|
| `--row-hover` | Table row hover background (`hover:bg-(--row-hover)`) |
| `--text-error` | AA-contrast error text in both themes (`text-(--text-error)`) |
| `--destructive-soft` | Soft destructive fill; the `destructive` Button variant is `bg-(--destructive-soft) text-(--text-error)` |

### 4.5 The GC feature is the reference template

`src/features/gc/` is the pattern for every later module: a tolerant mapper (`lib/contract-mapper.ts`: `toContract`, `toContractPayload`, `diffPayload`), a service on `/contracts`, a list store plus URL sync, a form dialog, a wizard, a detail view with `DocumentManager` and `HistoryTimeline`, a dashboard and an alerts page. `features/ppa` and `features/legal/*` follow the same shape.

### 4.6 Generic list helpers in src/lib/list and src/lib/api

Extracted for reuse across all modules (GC, Legal, PPA, Admin, Users, Support):
- `createListStore<T, Q>` (`@/lib/list`): unified Zustand store factory for paginated search/filter with generation-counter race protection and `afterDelete`.
- `createQueryCodec<Q>` (`@/lib/list`): generic bidirectional URL query parameter codec.
- `useListUrlSync` (`@/lib/list`): hook keeping store query state synchronized with URL search params under `<Suspense>`.
- `isRecord`, `pickEnum`, `toCountEntries` (`@/lib/api/mapper-utils`): tolerant mapper utilities.
- `createMockDb` (`@/lib/api/mock/mock-db`): in-memory CRUD table for mock handlers.
- `LegalSearch` (`src/features/legal/lib/legal-search.tsx`): accessible debounced search input component.
- `uploadStaged` (`src/features/legal/lib/upload-staged.ts`): helper uploading staged files sequentially with partial failure isolation.

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

### 5.1b Adding a backend-backed feature (Phase 5 pattern)

Use this for any new screen that talks to the real API. Read the endpoint in `docs/backend/openapi.json` first.

1. **Types.** Define the domain model in `types.ts` with the backend's field names. Define a `Payload` (create body) and a `Patch` (update body) separately from the model.
2. **Tolerant mapper.** Write `toX(raw: unknown): X` in `lib/x-mapper.ts` using `toNum`, `toStr` and `toIsoDate` from `@/lib/api/envelope`. Prisma Decimal and BigInt arrive as strings, dates arrive as ISO timestamps, and any field may be missing, so never assume a type. Add `toXPayload(form)` and a diff helper for PATCH. Test the mapper with odd inputs.
3. **Endpoints.** Add the paths to `endpoints` in `@/lib/api/endpoints`.
4. **Service.** In `api/x.service.ts` call `api`, then `unwrap<T>(res.data)` for a single record or `unwrapPage(res.data, {page, pageSize}, toX)` for a list. Map the query: `q` → `search`, `pageSize` → `limit`, and send **no sort params** (the backend list endpoints have none; sorting is not offered).
5. **PATCH null-vs-omit.** GC omits cleared fields from the PATCH body, while Legal sends `null` for them. Don't invent a third behaviour; follow the nearest feature until the open decision in §6 is settled.
6. **Mock handler.** Add `src/lib/api/mock/handlers/x.ts` returning the **live envelope** (`{ data: ... }`, with pagination meta for lists). Return Nest-style errors, `{ statusCode, message, error }` (`message` may be a string array for validation), and enforce 401, 403 and 409 with `getMockSessionUser()`. Register it in `src/lib/api/mock/index.ts`; the adapter lets a later registration win, so a handler that replaces another must come after it (admin comes after lookups).
7. **UI.** Gate with `useCan` or `<Can>`, use `useDepartments`/`useContractTypes` for dropdowns, `DocumentManager` with the right `AttachmentModule`, and `HistoryTimeline` on detail pages. Add Lao keys to `lo.ts` and list them for review.

### 5.2 List stores (required pattern)

- **Generation counter.** `reset()` increments a module-level `generation`, and `fetch()` drops its result, whether success or error, if the generation changed. Copy the pattern from `src/features/gc/store/gc-list.store.ts` (or the generic `createListStore` in §4.6).
- **Cancellation.** Ignore cancelled requests with `isCanceledError(e)` (`@/lib/api/errors`).
- **URL sync.** Keep filters, page and sort in sync with `searchParams` so links can be shared. `useSearchParams` needs a `<Suspense>` boundary (§7).
- **Reset on logout.** Feature stores must clear on logout. Register with `registerLogoutReset` (§4.2) and don't import feature stores into `features/auth`.

### 5.3 Pages

- Every screen needs a loading state (skeleton), an empty state (`EmptyState`), an error state (`AlertBanner` rose plus a retry) and a forbidden state (handled by `ModuleGuard`).
- Tables use the shared `DataTable` (`src/components/shared/data-table.tsx`), which already exists: a thin wrapper over `@tanstack/react-table` v9 with the owned `DataTableColumn` API (§4.3). It scrolls inside its own `overflow-x-auto` container. Keep every spec column visible at 2xl (1536px) and below that move secondary data into sublines using `className`. The footer reads `lo.common.showing(x, y)` and sits next to the pagination.
- Charts must follow `dataviz` and Design.md §7. Use module-accent gradients; status colours are only for status charts.

---

## 6. Next steps

| # | Step | Notes |
|---|---|---|
| 1 | Run `pnpm smoke:live` against the real backend (local or UAT; see `README.md`). | Needs credentials from the backend team. Produces `docs/backend/live-shapes.json`. Commit it after checking that no secrets slipped in. |
| 2 | Tighten the tolerant mappers. | Compare each mapper and mock with `live-shapes.json`: fix field names, list envelope, Decimal/BigInt handling, dashboard shapes and the attachment and history shapes. Then make `unwrapPage` and the mocks match the real envelope exactly. |
| 3 | Decide PATCH null-vs-omit. | GC omits cleared fields; Legal sends `null`. Test against the live API (can a field be cleared?) and make all features follow one rule. |
| 4 | Native-speaker review of the new Lao keys (§10). | Includes `lo.admin.*`, `lo.notifications.*`, `lo.support.*`, `lo.users.*` and the `lo.home.*` / `lo.ppa.*` / `lo.legal.*` changes of Phase 5. |
| 5 | Add an e2e project in `live` mode. | `Frontend_LCMS_Project.md` §11. |
| 6 | 4b Legal (procurement, laws, hearings). | Deferred pending stakeholder confirmation. Write a plan against the real code first. |

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
| The session cookie holds the Bearer token and is readable by JS (live and mock). | Gate on `hasSessionHint()`, and still treat the server as the authority (401 triggers expiry). |
| Redirect loops between `proxy.ts` and `AuthGate`. | `/login?reason=expired` and `/login?reason=logout` are exempt from the proxy bounce. Any new auth redirect must go through `decideRedirect` and have a test. |
| Running a view-model transform twice (the Home 31–90 bucket was always 0). | Give the server shape and the client view model **different types**, so a double application fails to type-check. |
| `expire()` racing `fetchMe` or `logout`. | `expire()` only acts while status is `authenticated`; `fetchMe` owns its own transition. |
| Exit codes hidden by `| tail`. | `cmd; echo EXIT=$?` |
| Playwright uses the fixed port 3100 (`pnpm build && pnpm start -p 3100`), shared by every worktree. Two runs at once collide. | Run one e2e at a time; stop stale `next start` processes first. |
| After deleting a route (for example `/ppa/documents`), the stale `.next/dev/types` still references it and `pnpm typecheck` fails. | Delete `.next/dev/types` and re-run. |
| Long `userEvent` tests (dialogs, wizards) time out at the default 5s. | `testTimeout` is 15000 in `vitest.config.*`; keep tests focused instead of raising it again. |
| `src/lib/i18n/lo.ts` has CRLF line endings. Edits that assume LF (`sed`, exact-match edits, scripts) fail or mix endings. | Preserve CRLF; check with `git diff --stat` that only intended lines changed. |
| Axe rule `scrollable-region-focusable` fires on overflow containers (tables, timelines) with no focusable child. | Make the scroll container keyboard reachable (for example `tabIndex={0}` with a role and a Lao `aria-label`) or ensure it contains a focusable element. |
| `axios-mock-adapter`: when two handlers match the same URL, the **later registration wins**. | Order matters in `src/lib/api/mock/index.ts`: admin handlers go after lookups. |
| The JWT lives in a JS-readable cookie by design (Bearer backend, no httpOnly cookie). | Treat XSS hygiene as important: no `dangerouslySetInnerHTML` with API data. Never log the token or put it in a URL. |
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

| Username | Role | Division / modules | Lands on |
|---|---|---|---|
| `admin` | ADMIN | all system modules (incl. users, audit-logs) | `/` |
| `gc.user` | MAIN_USER | ພະແນກສັນຍາທົ່ວໄປ: contracts, contract-types, departments, support | `/contracts` |
| `gc.editor` | EDITOR (view, upload, edit, delete) | same as `gc.user` | `/contracts` |
| `gc.viewer` | VIEWER (view only) | same as `gc.user` | `/contracts` |
| `legal.user` / `legal.editor` / `legal.viewer` | MAIN_USER / EDITOR / VIEWER | ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ: legal-documents, legal-cases, departments, support | `/legal` |
| `ppa.user` | MAIN_USER | ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ: power-contracts, power-notifications, departments, support | `/ppa` |
| `none.user` | VIEWER | departments, support only | `/support` |

Permissions: ADMIN and MAIN_USER hold every permission in the modules they can access; EDITOR/VIEWER follow the per-user flags (`canView`→view, `canUpload`→create, `canEdit`→edit, `canDelete`→delete, `canDownload`→download), see `src/lib/auth/permissions.ts`.

Run `pnpm dev` and open http://localhost:3000. E2E tests use a production build on port 3100.

---

## 10. Don't decide these alone (ask the human or the controller)

- Token strategy changes (the backend is Bearer-only; there is no refresh endpoint).
- Whether `daysLeft` comes from the server or the client, and the time zone (Asia/Vientiane is assumed).
- The label for the `terminated` status (currently `ຍົກເລີກ`).
- Lao copy quality. All strings are in `lo.ts`, so one native-speaker review covers them. Phase 1 keys pending review: `auth.brandHeading`, `auth.brandIntro`, `auth.forgotIntro`, `auth.forgotSubmit`, `topbar.searchLabel`, `topbar.unread`, `topbar.breadcrumb`, `nav.mainMenu`, `nav.moduleSwitcher`, `common.retry`, `home.stats.*`, `home.buckets.*`, `home.loadError`. Phase 5 added many keys (`lo.admin.*`, `lo.users.*`, `lo.notifications.*`, `lo.support.*`, plus changes under `lo.nav`, `lo.home`, `lo.ppa`, `lo.legal`, `lo.gc`); all are pending review. Phase 3a keys pending review: `roles.main` ('User ຫຼັກ', a mixed Latin/Lao label) and `datePicker.open`, which is identical to `datePicker.placeholder` ('ເລືອກວັນທີ'); the trigger's accessible name may need a distinct "open calendar" wording. All `lo.gc.*` strings are also unreviewed. All new `lo.legal.*` keys added in Phase 4a (regulations, cases, dashboard, wizard, case stages, case types) are also pending native-speaker review.
- Anything that changes Design.md tokens, fonts or the glassmorphism style.
