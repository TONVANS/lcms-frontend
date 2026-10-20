# LCMS Frontend — Project Setup & Structure

Legal Contract Management System (LCMS) frontend. Built **backend-ready**: all data goes through an API layer that runs on mocks today and switches to the real backend via env config, with no feature-code changes.

- UI language: **Lao only** (`lang="lo"`). Code, comments, docs: English.
- Design spec: see `Design.md` (tokens, components, layout, role rules).

## 1. Modules

| Key | Name (Lao UI) | Scope |
|---|---|---|
| `ppa` | ສັນຍາຊື້-ຂາຍພະລັງງານ | Power Purchase Agreements: IPP, capacity MW, tariff US¢/kWh, COD, term, price reviews |
| `gc` | ສັນຍາທົ່ວໄປ | General contracts: service, lease, MOU, cooperation, finance |
| `legal` | ນິຕິກຳ, ຈັດຊື້-ຈັດຈ້າງ ແລະ ຄະດີ | Sub-areas: Regulations, Procurement contracts, Law library, Litigation (cases + hearings) |

Each module has its own dashboard, list, detail, create (modal + wizard) and alerts.

## 2. Tech Stack

| Area | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, React 19.2, Turbopack) | Node ≥ 20.9. Route protection in `src/proxy.ts` (Next 16 replaces `middleware.ts`). `params`/`searchParams` are async. |
| Language | TypeScript (strict) | |
| Styling | **Tailwind CSS v4** | CSS-first config in `globals.css` (`@theme`), tokens from `Design.md §13` |
| UI kit | **shadcn/ui** (Radix) | Components copied into `src/components/ui`, restyled to glass tokens |
| HTTP | **axios** | Single instance + interceptors (auth, errors, refresh) |
| State | **zustand** | Auth/session, UI prefs, per-feature list state (filters, pagination) |
| Forms | react-hook-form + zod + @hookform/resolvers | zod schemas shared by modal form and wizard |
| Tables | @tanstack/react-table | Wrapped in shared `DataTable` |
| Charts | shadcn Charts (recharts) | |
| Dates | date-fns | Lao formatting helpers in `lib/utils/date.ts` |
| Theme | next-themes | `attribute="class"`, default `dark` |
| Icons | lucide-react | stroke icons, 18–20px |
| Toasts | sonner | |
| Fonts | next/font/google | Inter, Noto Sans Lao, Noto Serif Lao, Noto Serif Display |
| Mocks | axios-mock-adapter (dev) | Enabled when `NEXT_PUBLIC_API_MODE=mock` |
| Quality | ESLint (flat config), Prettier, Vitest + Testing Library, Playwright (e2e) | `next lint` is removed in Next 16 — run `eslint` directly |

Package manager: **pnpm**.

### Bootstrap

```bash
pnpm create next-app@latest lcms-frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd lcms-frontend
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input textarea select checkbox radio-group label form \
  dialog sheet tabs table badge avatar dropdown-menu popover tooltip calendar separator \
  skeleton scroll-area breadcrumb pagination sidebar chart sonner
pnpm add axios zustand react-hook-form zod @hookform/resolvers @tanstack/react-table \
  date-fns next-themes lucide-react recharts
pnpm add -D axios-mock-adapter prettier prettier-plugin-tailwindcss vitest @testing-library/react \
  @testing-library/jest-dom jsdom @playwright/test
```

### AI Agent Skill: ui-ux-pro-max

[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) gives Claude Code a searchable UI/UX knowledge base (styles, palettes, typography, UX rules). Install it once per repo so every AI agent working on LCMS uses it.

**Prerequisite:** Python 3.x (the skill's search engine runs on Python).

```bash
python3 --version
# macOS:   brew install python3
# Ubuntu:  sudo apt update && sudo apt install python3
# Windows: winget install Python.Python.3.12
```

**Option A — Claude Code plugin marketplace** (run inside Claude Code):

```text
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

**Option B — CLI, project-local (recommended for this repo):**

```bash
cd lcms-frontend
npm install -g uipro-cli          # or skip and use: npx uipro-cli init --ai claude
uipro init --ai claude            # installs to .claude/skills/ui-ux-pro-max/
```

Other CLI commands: `uipro update` (latest version), `uipro versions`, `uipro init --offline` (air-gapped), `uipro init --ai claude --output-dir ./custom-path`.

**Verify:**

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
```

**Usage:** activates automatically on UI requests (build / design / implement / review / fix / improve). Force it with `/ui-ux-pro-max <request>`.

**Project rules for agents:**

- `Design.md` is the source of truth. Use ui-ux-pro-max for UX checks, accessibility review and patterns for screens not yet designed — **never** to replace LCMS tokens, fonts, colors or the glassmorphism navy style.
- Commit `.claude/skills/ui-ux-pro-max/` so all team members and agents get the same version; update deliberately with `uipro update` in a separate PR.
- Add to `CLAUDE.md`: "Read `Design.md` and `Frontend_LCMS_Project.md` before UI work; use the ui-ux-pro-max skill for UX review; UI copy in Lao, code in English."

## 3. Folder Structure

```
lcms-frontend/
├─ .claude/
│  └─ skills/ui-ux-pro-max/         # AI agent UI/UX skill (committed)
├─ CLAUDE.md                        # agent rules → points to Design.md + this file
├─ Design.md
├─ Frontend_LCMS_Project.md
├─ .env.example
├─ next.config.ts
├─ components.json                  # shadcn config
├─ public/
│  └─ brand/                        # logo, favicon
└─ src/
   ├─ proxy.ts                      # auth redirect + module access check (reads session cookie)
   ├─ app/
   │  ├─ layout.tsx                 # <html lang="lo">, fonts, ThemeProvider, Toaster
   │  ├─ globals.css                # Tailwind v4 + design tokens
   │  ├─ not-found.tsx
   │  ├─ error.tsx
   │  ├─ (auth)/
   │  │  ├─ layout.tsx              # background glows, no shell
   │  │  ├─ login/page.tsx
   │  │  └─ forgot-password/page.tsx
   │  └─ (app)/
   │     ├─ layout.tsx              # AuthGate + AppShell (sidebar, topbar)
   │     ├─ page.tsx                # Home (module launcher; redirects single-module users)
   │     ├─ notifications/page.tsx
   │     ├─ forbidden/page.tsx
   │     ├─ ppa/
   │     │  ├─ layout.tsx           # <ModuleGuard module="ppa">
   │     │  ├─ page.tsx             # Dashboard
   │     │  ├─ contracts/page.tsx   # List + create modal
   │     │  ├─ contracts/[id]/page.tsx
   │     │  ├─ new/page.tsx         # Wizard
   │     │  ├─ alerts/page.tsx
   │     │  └─ documents/page.tsx
   │     ├─ contracts/              # General Contract module (gc)
   │     │  ├─ layout.tsx           # <ModuleGuard module="gc">
   │     │  ├─ page.tsx
   │     │  ├─ list/page.tsx
   │     │  ├─ [id]/page.tsx
   │     │  ├─ new/page.tsx
   │     │  └─ alerts/page.tsx
   │     ├─ legal/
   │     │  ├─ layout.tsx           # <ModuleGuard module="legal">
   │     │  ├─ page.tsx             # Dashboard
   │     │  ├─ regulations/{page.tsx,[id]/page.tsx}
   │     │  ├─ procurement/{page.tsx,[id]/page.tsx}
   │     │  ├─ laws/page.tsx
   │     │  ├─ cases/{page.tsx,[id]/page.tsx}
   │     │  ├─ hearings/page.tsx    # Calendar
   │     │  └─ new/page.tsx
   │     └─ admin/                  # later: users, roles, departments (admin only)
   ├─ components/
   │  ├─ ui/                        # shadcn primitives (restyled)
   │  ├─ layout/                    # AppShell, AppSidebar, Topbar, ModuleSwitcher, Breadcrumbs,
   │  │                             # ThemeToggle, UserMenu, NotificationBell, PageHeader
   │  ├─ shared/                    # GlassCard, KpiCard, StatusBadge, CountdownBadge, DataTable,
   │  │                             # FilterChips, SearchInput, EmptyState, FileDropzone, FileList,
   │  │                             # Timeline, Stepper, ConfirmDialog, AlertBanner, MiniCalendar,
   │  │                             # FadeIn (entrance animation wrapper, see Design.md §8)
   │  ├─ charts/                    # BarList, StackedStatusBar, MonthlyBars
   │  └─ guards/                    # AuthGate, ModuleGuard, RoleGate
   ├─ features/                     # one folder per domain; no cross-imports except via index.ts
   │  ├─ auth/        { api/, components/LoginForm.tsx, schemas/, store/auth.store.ts, index.ts }
   │  ├─ home/        { components/ModuleCard.tsx, UpcomingList.tsx, AlertSummary.tsx }
   │  ├─ ppa/         { api/ppa.service.ts, components/, hooks/, schemas/ppa.schema.ts,
   │  │                 store/ppa-list.store.ts, types.ts, mocks/ppa.mock.ts, index.ts }
   │  ├─ general-contract/  { same shape }
   │  ├─ legal/
   │  │  ├─ regulation/     { same shape }
   │  │  ├─ procurement/    { same shape }
   │  │  ├─ law-library/    { same shape }
   │  │  └─ litigation/     { same shape + hearings }
   │  ├─ documents/   { api/, components/ (upload, preview, versions) }
   │  └─ alerts/      { api/, components/, store/ }
   ├─ lib/
   │  ├─ api/
   │  │  ├─ client.ts               # axios instance (baseURL, timeout, withCredentials)
   │  │  ├─ interceptors.ts         # attach token, 401 → refresh/logout, normalize errors
   │  │  ├─ endpoints.ts            # all URL builders in one place
   │  │  ├─ errors.ts               # ApiError type + toUserMessage() (Lao)
   │  │  └─ mock/
   │  │     ├─ index.ts             # installs axios-mock-adapter when API_MODE=mock
   │  │     └─ handlers/*.ts        # per-feature mock routes using features/*/mocks
   │  ├─ auth/
   │  │  ├─ permissions.ts          # canAccessModule(), getLandingRoute(), hasPermission()
   │  │  └─ session.ts              # cookie names, token helpers
   │  ├─ i18n/lo.ts                 # all Lao UI strings (single dictionary)
   │  ├─ constants/                 # modules.ts, status.ts, routes.ts, alert-windows.ts
   │  └─ utils/                     # cn.ts, date.ts (Lao months, dd/mm/yyyy), number.ts, money.ts
   ├─ config/
   │  ├─ env.ts                     # zod-validated env
   │  └─ navigation.ts              # sidebar menu per module (labels, icons, routes, count keys)
   ├─ stores/
   │  └─ ui.store.ts                # sidebar collapsed, last module, table density (persisted)
   ├─ hooks/                        # useDebounce, useMediaQuery, useCountdown
   └─ types/
      ├─ api.ts                     # Paginated<T>, ApiResponse<T>, ListQuery, ID, ISODate
      └─ domain.ts                  # shared entities (User, Department, Document, Alert)
```

### Rules

- `app/` files stay thin: compose feature components, no business logic.
- Server Components by default; add `"use client"` only for interactive parts (forms, tables, stores).
- Features never import another feature's internals — only from its `index.ts`.
- All HTTP calls go through `features/*/api/*.service.ts` → `lib/api/client.ts`. No `axios` imports in components.
- All Lao strings live in `lib/i18n/lo.ts`; components reference keys.
- File names: kebab-case; components: PascalCase; stores: `*.store.ts`; schemas: `*.schema.ts`.

## 4. Auth & Access Control

```ts
// types/domain.ts
export type ModuleKey = 'ppa' | 'gc' | 'legal';
export type Role = 'admin' | 'user';
export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: Role;
  departmentId: string;
  departmentName: string;
  modules: ModuleKey[];                          // admin = all
  permissions?: Partial<Record<ModuleKey, Permission[]>>;
}
```

```ts
// lib/auth/permissions.ts
export const MODULE_HOME: Record<ModuleKey, string> = { ppa: '/ppa', gc: '/contracts', legal: '/legal' };

export function getLandingRoute(u: User): string {
  if (u.role === 'admin' || u.modules.length > 1) return '/';
  return MODULE_HOME[u.modules[0]];
}
export const canAccessModule = (u: User, m: ModuleKey) => u.role === 'admin' || u.modules.includes(m);
```

- **Login →** `getLandingRoute(user)`.
- **Home (`/`)**: single-module users are redirected to their module dashboard.
- **ModuleGuard** (module `layout.tsx`): no access → `/forbidden`.
- **proxy.ts**: no session cookie → `/login?next=…`; signed-in user on `/login` → landing route.
- Navigation, module switcher, search and notifications are filtered by `user.modules` (hidden, not disabled).

### Auth store (zustand)

```ts
interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  login(input: { username: string; password: string; remember: boolean }): Promise<void>;
  logout(): Promise<void>;
  fetchMe(): Promise<void>;
}
```

Token strategy: **pending backend decision**. Default plan: backend sets httpOnly cookies (access + refresh); axios uses `withCredentials: true`; interceptor retries once after `POST /auth/refresh` on 401. If the backend returns bearer tokens instead, only `interceptors.ts` and `session.ts` change.

## 5. API Layer

```ts
// lib/api/client.ts
export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,   // e.g. https://api.example.com/api/v1
  timeout: 20000,
  withCredentials: true,
  headers: { 'Accept-Language': 'lo' },
});
```

### Common contracts (to confirm with backend)

```ts
export interface Paginated<T> { items: T[]; page: number; pageSize: number; total: number; }
export interface ListQuery { page?: number; pageSize?: number; q?: string; status?: string; sort?: string; order?: 'asc' | 'desc'; }
export interface ApiError { status: number; code: string; message: string; fieldErrors?: Record<string, string>; }
```

- Dates as ISO 8601 strings (`YYYY-MM-DD` / UTC timestamps); format to `dd/mm/yyyy` only in UI.
- Money as `{ amount: number; currency: 'LAK' | 'USD' | 'THB' }`.

### Service pattern

```ts
// features/ppa/api/ppa.service.ts
export const ppaService = {
  list: (q: ListQuery) => api.get<Paginated<PpaContract>>(endpoints.ppa.list, { params: q }).then(r => r.data),
  get: (id: string) => api.get<PpaContract>(endpoints.ppa.detail(id)).then(r => r.data),
  create: (body: PpaContractInput) => api.post<PpaContract>(endpoints.ppa.list, body).then(r => r.data),
  update: (id: string, body: Partial<PpaContractInput>) => api.patch<PpaContract>(endpoints.ppa.detail(id), body).then(r => r.data),
  remove: (id: string) => api.delete<void>(endpoints.ppa.detail(id)),
  dashboard: () => api.get<PpaDashboard>(endpoints.ppa.dashboard).then(r => r.data),
};
```

### Draft endpoints (placeholder — replace with backend spec)

| Feature | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/forgot-password` |
| Home | `GET /home/summary` (per-module counts, upcoming 30 days, alert buckets) |
| PPA | `GET/POST /ppa/contracts`, `GET/PATCH/DELETE /ppa/contracts/:id`, `GET /ppa/dashboard`, `GET /ppa/contracts/:id/history` |
| General Contract | `GET/POST /contracts`, `GET/PATCH/DELETE /contracts/:id`, `GET /contracts/dashboard` |
| Regulation | `GET/POST /legal/regulations`, `GET/PATCH/DELETE /legal/regulations/:id` |
| Procurement | `GET/POST /legal/procurements`, `GET/PATCH/DELETE /legal/procurements/:id` |
| Law library | `GET /legal/laws`, `GET /legal/laws/:id` |
| Litigation | `GET/POST /legal/cases`, `GET/PATCH /legal/cases/:id`, `GET/POST /legal/cases/:id/hearings`, `GET /legal/hearings?from=&to=` |
| Legal dashboard | `GET /legal/dashboard` |
| Documents | `POST /documents` (multipart, `entityType`, `entityId`), `GET /documents/:id/download`, `GET /:entity/:id/documents` |
| Alerts | `GET /alerts?module=&window=`, `PATCH /alerts/:id/read`, `PUT /:entity/:id/alert-settings` |
| Lookups | `GET /lookups/departments`, `/lookups/developers`, `/lookups/courts`, `/lookups/users` |

## 6. Domain Types (initial — align with backend DTOs)

```ts
export type ContractStatus = 'draft' | 'negotiating' | 'pending_cod' | 'active' | 'expiring' | 'expired' | 'terminated';
export type EnergyType = 'hydro' | 'solar' | 'wind' | 'coal' | 'biomass';

export interface PpaContract {
  id: string; contractNo: string; projectName: string;
  developer: { id: string; name: string };
  energyType: EnergyType; capacityMw: number; tariffUsCentPerKwh: number;
  annualEnergyGwh?: number; market: 'domestic' | 'export';
  signedDate?: string; codDate?: string; endDate?: string; termYears?: number;
  status: ContractStatus; ownerUserId: string; nextEvent?: KeyEvent;
  alertDays: number[];                      // e.g. [90, 30, 7]
}

export interface GeneralContract {
  id: string; contractNo: string; title: string;
  category: 'service' | 'lease' | 'mou' | 'cooperation' | 'finance' | 'other';
  counterparty: string; value?: Money; departmentId: string;
  startDate: string; endDate: string; autoRenew: boolean; status: ContractStatus; alertDays: number[];
}

export interface Regulation {
  id: string; number: string; type: 'law' | 'decree' | 'decision' | 'instruction' | 'notice' | 'internal_rule';
  title: string; issuedBy: string; issuedDate: string; effectiveDate: string; status: 'in_force' | 'amended' | 'repealed';
}

export interface ProcurementContract {
  id: string; contractNo: string; title: string;
  method: 'open_bidding' | 'limited_bidding' | 'price_quotation' | 'direct';
  supplier: string; value: Money; deliveryDate?: string; status: ContractStatus;
}

export type CaseStage = 'filed' | 'mediation' | 'first_instance' | 'appeal' | 'supreme' | 'closed';
export interface LegalCase {
  id: string; caseNo: string; title: string; counterparty: string;
  ourRole: 'plaintiff' | 'defendant'; court: string; stage: CaseStage;
  claimAmount?: Money; lawyer?: string; nextHearing?: Hearing;
}
export interface Hearing { id: string; caseId: string; dateTime: string; place: string; agenda?: string; lawyer?: string; }

export interface KeyEvent { type: string; label: string; date: string; }
export interface DocumentFile { id: string; name: string; mime: string; size: number; version: string; uploadedAt: string; uploadedBy: string; }
export interface Alert { id: string; module: ModuleKey; entityType: string; entityId: string; title: string; dueDate: string; daysLeft: number; read: boolean; }
export interface Money { amount: number; currency: 'LAK' | 'USD' | 'THB'; }
```

## 7. State Management (zustand)

| Store | Location | Holds | Persist |
|---|---|---|---|
| `auth.store` | `features/auth/store` | user, status, actions | no (rehydrate via `/auth/me`) |
| `ui.store` | `stores/` | theme-independent prefs: sidebar collapsed, last module, table density | localStorage |
| `*-list.store` | `features/<x>/store` | filters, search, page, pageSize, sort, items, total, loading, error, `fetch()` | URL sync for filters |
| `alerts.store` | `features/alerts/store` | unread count, latest alerts | no |

- Keep server data per feature store; reset on logout.
- Sync list filters with URL `searchParams` so links are shareable.

## 8. Environment

```bash
# .env.example
NEXT_PUBLIC_APP_NAME=LCMS
NEXT_PUBLIC_API_MODE=mock            # mock | live
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_MAX_UPLOAD_MB=50
SESSION_COOKIE_NAME=lcms_session     # read by proxy.ts
```

## 9. Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "e2e": "playwright test"
}
```

## 10. Implementation Phases

| Phase | Scope | Status |
|---|---|---|
| 0 | Prototype in Claude Design (12 screens) + `Design.md` | Done |
| 1 | Bootstrap, tokens, fonts, theme toggle, AppShell, shared components, auth (mock), RBAC, Home | Next |
| 2 | PPA module: dashboard, list + modal form, detail, wizard, alerts (mock data) | |
| 3 | General Contract module | |
| 4 | Legal module: regulations, procurement, law library, litigation + hearing calendar | |
| 5 | **Backend integration** (checklist below) | Waiting for backend |
| 6 | Admin (users/roles/departments), notifications center, hardening, e2e | |

## 11. Backend Integration Checklist

When the backend is ready:

1. Get the OpenAPI/Swagger spec; regenerate or update `types/` and feature `types.ts` to match DTOs.
2. Update `lib/api/endpoints.ts` paths and `Paginated`/`ApiError` shapes.
3. Confirm auth flow (cookie vs bearer, refresh endpoint, session cookie name) → adjust `interceptors.ts`, `session.ts`, `proxy.ts`.
4. Confirm role/module claims in `/auth/me` → map to `User.modules` / `permissions`.
5. Confirm upload contract (multipart field names, size limit, virus scan status).
6. Confirm alert computation (server-side `daysLeft` vs client) and timezone (Asia/Vientiane, UTC+7).
7. Set `NEXT_PUBLIC_API_MODE=live`, `NEXT_PUBLIC_API_BASE_URL`; run e2e against staging.
8. Remove unused mock handlers per feature once verified (keep mocks for tests).

## 12. Definition of Done (per screen)

- Matches `Design.md` in dark and light themes; responsive down to 360px.
- Loading (skeleton), empty, error and forbidden states implemented.
- Forms validated with zod; Lao error messages; server `fieldErrors` mapped to fields.
- Keyboard accessible, focus visible, ARIA on dialogs/tabs/toggles.
- Works with mock and live API modes without code changes.
- Type-check, lint and unit tests pass.
