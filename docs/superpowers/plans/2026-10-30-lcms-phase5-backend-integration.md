# Phase 5 — Backend Integration Plan

Branch: `phase-5-backend-integration` (from `phase-4a-legal`).
Planner/reviewer: Opus (main session). Implementers: Sonnet, one subagent per task.

## 0. Sources of truth

| Source | Path |
|---|---|
| Frontend API guide (Thai) | `D:\LCMS\backend-guide-line\FRONTEND_API_SUMMARY.md` |
| System flow, modules, RBAC | `D:\LCMS\backend-guide-line\SYSTEM_FLOW_AND_MODULES.md` |
| Postman collection | `D:\LCMS\backend-guide-line\legal-contract-management.postman_collection.json` |
| OpenAPI (request DTOs + query enums, fetched from UAT) | `docs/backend/openapi.json` |

Backend: NestJS, base URL `http://localhost:3001/api` (local) or the UAT tunnel in `FRONTEND_API_SUMMARY.md`.
The OpenAPI file documents **request** DTOs and query params exactly. It does **not** document response
bodies. Known response facts:

- Errors (Nest default): `{ "statusCode": 401, "message": "…" | ["…", "…"], "error": "Unauthorized" }`.
- Create endpoints return `{ data: { id, … } }` (Postman tests read `jsonData.data.id`; legal cases read `data.internalId`).
- Login returns `{ accessToken, user | userProfile }` with `user.accessibleModules`.
- Everything else (list envelope, dashboard shapes, attachment shape, numeric fields as strings from Prisma Decimal/BigInt) is **unverified**. Every response therefore goes through a tolerant mapper (§2.2). A live smoke script (Task 1) dumps real shapes so the mappers can be tightened later.

## 1. Rulings

`Ruling: <decision> — <why> — <cost if wrong>`

1. **Backend field names and enum values are the frontend model.** Types use the DTO names verbatim (`contractNumber`, `expirationDate`, `docType: 'REGULATION'`, `disputeStatus: 'FIRST_INSTANCE'`…). Lao labels come from `lo` maps keyed by enum value. — Removes a translation layer that drifts. — Renaming churn in tests.
2. **Raw server shape ≠ model.** Each feature has `types.ts` (model) and `lib/<x>-mapper.ts` (`toX(raw: unknown): X`) that coerces numbers (`"5000000000"` → number), dates, nested objects and nulls. Services always return mapped models. — AGENT_GUIDE §7 pitfall; Prisma Decimal/BigInt arrive as strings. — None.
3. **Mock mode stays** and returns the *same envelope as live* (`{ data: T }` single, `{ data: T[], meta: { total, page, limit, totalPages } }` list, `{ accessToken, user }` login). Unit + e2e tests keep running offline. — Keeps 113 unit tests + e2e meaningful. — Mocks must be rewritten per feature.
4. **Auth = Bearer JWT.** Token stored in the non-httpOnly cookie `lcms_session` (live: raw token; mock: `mock:<username>`), `SameSite=Lax`, `Secure` on https, 30-day max-age only when "remember me". A request interceptor adds `Authorization: Bearer <token>` in both modes. `withCredentials: false`. No refresh/logout/forgot-password endpoints exist: 401 → `onUnauthorized()` immediately (except on `/auth/login`); logout is client-only; the forgot-password page becomes a static "contact IT / HRM" notice with the support contacts. — Matches backend. — Token readable by JS (XSS exposure is inherent to the backend's Bearer design; note in docs).
5. **User model = backend profile.** `User.role: 'ADMIN' | 'MAIN_USER' | 'EDITOR' | 'VIEWER'`, flags `canView/canUpload/canEdit/canDelete/canDownload`, `accessibleModules: SystemModule[]`, `division`, `department`. UI module keys stay `'ppa' | 'gc' | 'legal'` and are derived: `gc ⇐ contracts`, `legal ⇐ legal-documents | legal-cases`, `ppa ⇐ power-contracts`. Admin section ⇐ `role === 'ADMIN'`. Permissions: ADMIN or MAIN_USER → all; else `view→canView, create→canUpload, edit→canEdit, delete→canDelete, download→canDownload`. `ModuleRole`, `ROLE_PERMISSIONS`, `approve` permission are removed. — Backend RBAC is per-user flags, not per-module roles. — Wide test churn (Task 2).
6. **URLs stay** (`/contracts…`, `/ppa…`, `/legal/regulations…`, `/legal/cases…`). Labels follow backend naming (PPA module = "ສັນຍາຊື້-ຂາຍໄຟຟ້າ", regulations = "ນິຕິກຳ"). — Avoids route churn and e2e rewrites. — None.
7. **Features follow the backend.** Remove what the backend lacks: `/ppa/documents` library, topbar global search, home `/home/summary`, alert windows 90/30/7 computed client-side, list sorting (no backend sort params), forgot-password API. Add what the backend has: notifications (contracts + power), support (contact channels + tickets), admin users (+ HRM lookup), audit logs, contract types, departments (+ HRM sync), per-record history (`/:id/history`). — Requested by the user. — More pages.
8. **List query mapping** in services only: store `q → search`, `pageSize → limit`, `page → page`, feature filters → backend names. No `sort`/`order` sent. DataTable columns become non-sortable. — Backend ignores sort. — None.
9. **Attachments** use the per-module routes (`/<module>/:id/attachments`, `/<module>/attachments/:attId/{preview,download}`, `DELETE /<module>/attachments/:attId`). Preview and download both fetch a **blob through `api`** (Bearer header) and use `URL.createObjectURL`; never put the token in a URL. Accept PDF + png/jpg/jpeg/gif/webp, max 25 MB (`NEXT_PUBLIC_MAX_UPLOAD_MB=25`). — Works identically in mock and live, no token leakage into logs/history. — None.
10. **Execution:** Wave A (Tasks 1–5) sequential in the main checkout. Wave B (Tasks 6–9) in parallel, each in its own git worktree/branch, merged by the controller. Wave C (Tasks 10–13) in parallel the same way. Task 14 last.

## 2. Shared contracts (owned by Wave A; later tasks must not change them)

### 2.1 Domain types — `src/types/domain.ts`

```ts
export type SystemModule =
  | 'contracts' | 'contract-types' | 'legal-documents' | 'legal-cases'
  | 'power-contracts' | 'power-notifications' | 'departments' | 'support'
  | 'users' | 'audit-logs';
export type UserRole = 'ADMIN' | 'MAIN_USER' | 'EDITOR' | 'VIEWER';
export type ModuleKey = 'ppa' | 'gc' | 'legal';
export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'download';
export type Currency = 'LAK' | 'USD' | 'CNY';
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TERMINATED';

export interface User {
  id: string;
  employeeCode: string | null;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  division: string | null;
  position: string | null;
  role: UserRole;
  canView: boolean; canUpload: boolean; canEdit: boolean; canDelete: boolean; canDownload: boolean;
  accessibleModules: SystemModule[];
}
export interface Department { id: string; name: string; code: string | null }
export interface ContractTypeOption { id: number; nameLo: string; nameEn: string | null }
export interface Attachment {
  id: string; fileName: string; mimeType: string; fileSize: number;
  createdAt: string; uploadedBy: string | null;
}
export type AttachmentModule = 'contracts' | 'legal-documents' | 'legal-cases' | 'power-contracts';
export interface HistoryEntry {
  id: string; action: string; createdAt: string; userName: string | null;
  changes: { field: string; label: string; oldValue: string | null; newValue: string | null }[];
}
```

Old `ContractStatus` (lowercase) is renamed `LegacyContractStatus` in Task 3 and deleted by Tasks 6/9.

### 2.2 API helpers — `src/lib/api/envelope.ts`

```ts
/** `{ data: T }` → T; raw T passes through. */
export function unwrap<T>(body: unknown): T;
/** Accepts T[] | {data:T[], meta|pagination} | {data:{items|data, total|meta}} | {items,total}. */
export function unwrapPage<T>(body: unknown, req: { page: number; pageSize: number }, map: (raw: unknown) => T): Paginated<T>;
export function toNum(v: unknown): number | null;   // "1,500" / "1500.00" / 1500 → 1500; ''/null/NaN → null
export function toStr(v: unknown): string | null;   // trims; '' → null
export function toIsoDate(v: unknown): string | null; // '2026-01-15T00:00:00.000Z' → '2026-01-15'
```

### 2.3 Endpoints — `src/lib/api/endpoints.ts`

Full backend map (Task 1 adds; feature tasks delete their old keys):

```ts
auth: { login: '/auth/login', me: '/auth/me' },
contracts: { list: '/contracts', detail: id, dashboard: '/contracts/dashboard', history: id },
contractTypes: { list: '/contract-types', dropdown: '/contract-types/dropdown', detail: id },
legalDocuments: { list, detail, dashboard },
legalCases: { list, detail, dashboard },
powerContracts: { list, detail, dashboard, history, projectTypes: '/power-contracts/project-types' },
attachments: { list: (m, id), upload: (m, id), preview: (m, attId), download: (m, attId), remove: (m, attId) },
notifications: { list: '/notifications', read: id, readAll: '/notifications/read-all' },
powerNotifications: { list: '/power-notifications', read: id, readAll: '/power-notifications/read-all' },
departments: { list, dropdown: '/departments/dropdown', detail: id, sync: '/departments/sync' },
support: { contacts: '/support/contacts', contact: id, tickets: '/support/tickets', ticket: id, ticketAttachment: id },
users: { list: '/users', detail: id, hrm: (empCode) },
auditLogs: { list: '/audit-logs' },
```
All ids pass through `encodeURIComponent`.

### 2.4 Permissions — `src/lib/auth/permissions.ts`

```ts
export function isAdmin(u: User): boolean;
export function hasSystemModule(u: User, m: SystemModule): boolean;      // ADMIN → true
export function getAccessibleModules(u: User): ModuleKey[];              // canonical order ppa, gc, legal
export function canAccessModule(u: User, m: ModuleKey): boolean;
export function hasPermission(u: User, m: ModuleKey, p: Permission): boolean;
export function getLandingRoute(u: User): string;                        // admin or >1 module → '/', 1 → MODULE_HOME, 0 → '/support'
```
`useCan`, `<Can>`, `<PermissionGuard>`, `<RoleGate role="admin">` keep their signatures (RoleGate checks `isAdmin`).

### 2.5 Navigation — `src/config/navigation.ts`

`NavItem` gains `systemModule?: SystemModule` (item hidden unless `hasSystemModule`) and keeps `permission?`. Adds `COMMON_NAV` (notifications, support) and `ADMIN_NAV` (users, audit logs, contract types, departments).

## 3. Tasks

Every task: TDD (failing test first), then `pnpm typecheck; echo EXIT=$?`, `pnpm lint; echo EXIT=$?`, `pnpm test --run; echo EXIT=$?` (+ `pnpm build` for route/config changes). All UI strings in `lo.ts` (Lao; enum labels from the backend docs). Commit with a conventional message. Report: files changed, RED/GREEN evidence, exit codes, plan errors found.

### Wave A — sequential

**Task 1 — Env + API core.**
`.env.example` + `.env.local` (`NEXT_PUBLIC_API_MODE=mock`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api`, UAT URL commented, `NEXT_PUBLIC_MAX_UPLOAD_MB=25`); `env.ts` default base URL; `client.ts` `withCredentials: false`; request interceptor adding Bearer from the session cookie; remove the refresh flow (401 → `onUnauthorized` unless the URL is `/auth/login`); `normalizeError` understands Nest bodies (`message` array → joined with `\n`; 401 on login → `INVALID_CREDENTIALS`); `envelope.ts` (§2.2) with tests; endpoints §2.3 added alongside old keys; `session.ts`: `setSessionToken(token, remember)`, `readSessionToken()`, `clearSession()`, `hasSessionHint()` (cookie present, both modes), mock helpers keep working; `scripts/live-smoke.mjs` (reads `LCMS_API`, `LCMS_USER`, `LCMS_PASS` from env, logs in, GETs one page of every list/dashboard/dropdown endpoint, writes shapes — keys and value types, never values of tokens — to `docs/backend/live-shapes.json`). Do not run the smoke script.

**Task 2 — Auth, user model, permissions.**
§2.1 user types, §2.4 permissions, `isAdmin` everywhere `role === 'admin'` was used. `auth.service` login → `{ accessToken, user }` (tolerant: `user ?? userProfile ?? data.user`), stores the token, `me()` via `/auth/me` + `toUser` mapper. Auth store logout = clear session + resets (no API). Mock users rewritten in backend shape (one division each: `admin` ADMIN; `gc.user` MAIN_USER contracts; `gc.editor` EDITOR flags view/upload/edit/delete; `gc.viewer` VIEWER view only; `legal.user`/`legal.editor`/`legal.viewer`; `ppa.user` MAIN_USER power; `none.user` with only `departments`,`support`). Drop `multi.user` (impossible under divisions) and fix e2e references. Mock auth handler returns the live envelope; the mock token is `mock:<username>`. Forgot-password page → static notice (no API). `lo.roles` → 4 backend roles. Update every consumer and test.

**Task 3 — Shared domain pieces.**
New `ContractStatus` + `STATUS_META` for the 5 backend statuses (DRAFT slate, ACTIVE emerald, EXPIRING_SOON amber, EXPIRED rose, TERMINATED slate) — rename the old type to `LegacyContractStatus` and keep its meta as `LEGACY_STATUS_META` so GC/PPA still compile. `features/lookups` (service + small cached store/hooks): departments dropdown, contract-types dropdown, power project-types; mappers; mock handlers + fixtures (≥8 departments, the 14 contract types from the backend doc, 5 project types). `features/documents` rewritten to §2.1 `Attachment` and Ruling 9: `documentsService.{list, upload, remove, preview, download}(module, …)`, `DocumentManager` props `{ module: AttachmentModule; entityId; canUpload; canDownload; canDelete }`, preview opens blob in a dialog (`<iframe>` for PDF, `<img>` for images), 25 MB + type validation, mock handler for all four modules. Update current callers to pass `module`. `HistoryEntry` mapper + `HistoryTimeline` component (reuse `Timeline`).

**Task 4 — Notifications.**
`features/notifications`: services for `/notifications` and `/power-notifications` (list `unreadOnly?`, `markRead`, `markAllRead`); mapper to `{ id, source: 'contracts' | 'power', title, message, contractId, contractLabel, daysLeft, read, createdAt }` (tolerant); store merging both sources according to `hasSystemModule`, `unreadCount`, generation counter, logout reset. Replace `features/alerts` usages (AppShell unread count) and delete `features/alerts` + its mock. `/notifications` page: list with source filter, mark one/all read, link to the contract detail. Mock handlers + fixtures.

**Task 5 — Sidebar + Topbar.**
§2.5 navigation. Sidebar: brand; Home; per accessible module group (admin: collapsible groups like today; non-admin: their module flat); items gated by `systemModule` + `permission`; common section (notifications with unread badge, support); admin section (users, audit logs, contract types, departments) for ADMIN; user card bottom (fullName, Lao role label, division). Remove `ModuleSwitcher` for non-admin (single division). Mobile (< md): sidebar collapses into a `Sheet` opened by a topbar menu button. Topbar: menu button (mobile), breadcrumbs, theme toggle, notification dropdown (popover: latest 5, unread badge count, mark all read, "see all" → `/notifications`), user menu (fullName, employeeCode, role label, division, support link, logout). Remove the global search input. Admin/support routes may not exist yet: nav items point at `/admin/users`, `/admin/audit-logs`, `/admin/contract-types`, `/admin/departments`, `/support`; create placeholder pages (PageHeader + EmptyState underConstruction; admin ones wrapped in `RoleGate`/forbidden redirect) so links never 404. Update sidebar/topbar/app-shell tests and `rbac.spec`/`responsive-a11y.spec` selectors.

### Wave B — parallel worktrees

Shared rules: touch only your feature folder, your route folder, your mock handler file, your `lo.<section>`, your e2e spec, and delete your old `endpoints` keys. Do not edit `lo` sections or files owned by other tasks. Keep the GC reference structure (list store + URL sync, one zod schema shared by dialog and wizard, detail with `DocumentManager` + `HistoryTimeline`). ≥25 mock records covering every enum value, dates relative to today.

**Task 6 — General contracts (`/api/contracts`).**
Model `Contract { id, title, contractTypeId, contractType: ContractTypeOption | null, contractNumber, durationText, durationMonths, signedDate, effectiveDate, expirationDate, contractValue, currency, equityOrCapitalContribution, sharePercentage, implementer, additionalDetails, notifyDaysBefore, status, createdAt, updatedAt }`. Form = `CreateContractDto` (required: title, contractTypeId from dropdown, contractNumber; dates sent as `YYYY-MM-DD`; currency LAK/USD/CNY; notifyDaysBefore default 60). Update sends only changed fields (PATCH). List filters: search, status, contractTypeId; columns: number+title, type, signed/expiration dates, value+currency, status, actions. Dashboard from `/contracts/dashboard` (`total, expiringSoonCount, expiredCount, byStatus, byCurrency, valueByCurrency, byContractType` — tolerant mapper accepting object maps or arrays). Alerts page = `status=EXPIRING_SOON` list + contract notifications. Detail: fields, attachments (`module="contracts"`), history (`/contracts/:id/history`). Remove derive-status/term/alert-window logic the server now owns.

**Task 7 — Legal documents (`/api/legal-documents`, routes `/legal/regulations…`).**
Model `LegalDocument { id, docTitle, docType, issueYear, docNumberDate, status: 'ACTIVE'|'INACTIVE', responsiblePerson, departmentId, department: Department|null, purpose, externalUrl, createdAt, updatedAt }`. Form = `CreateLegalDocumentDto` (required docTitle, docType, issueYear, docNumberDate, departmentId via departments dropdown). Filters: search, docType, status, issueYear, departmentId. docType labels (Lao) from the backend doc. Dashboard section: totals, active/inactive, donut `byType`, bar `byDepartment`. Attachments `module="legal-documents"`. Owns `lo.legal.regulations*` and the legal dashboard regulations section.

**Task 8 — Legal cases (`/api/legal-cases`).**
Model `LegalCase { id /* = internalId */, caseCode, defendant, allegation, departmentId, department, departmentAction, caseType, damageLak, damageUsd, fineLak, fineUsd, totalDueLak, totalDueUsd, disputeStatus, recoveredLak, recoveredUsd, date, disputeProgress, externalUrl, createdAt, updatedAt }`. Form = `CreateLegalCaseDto` (required caseCode, defendant, caseType, date; totals shown read-only = damage + fine, not sent). Filters: search, caseType, disputeStatus, departmentId, startDate, endDate. Stage stepper uses `FIRST_INSTANCE → APPEAL → SUPREME → CLOSED/RESOLVED`. Dashboard section: counts by disputeStatus, LAK and USD totals (damage, fine, totalDue, recovered). Attachments `module="legal-cases"`. Owns `lo.legal.cases*` and the cases dashboard section. The legal dashboard page renders each section only if the user has its `SystemModule`; Task 7 and Task 8 each own their section component, the page composes them (Task 8 edits the page).

**Task 9 — Power contracts (`/api/power-contracts`, routes `/ppa…`).**
Model `PowerContract { id, contractType: 'PURCHASE'|'SALE', contractNumber, projectName, projectTypeOrCustomer, durationText, durationMonths, signedDate, effectiveDate, expirationDate, installedCapacity, capacityValue, capacityUnit: 'MW'|'kW', projectLocation, tariff, tariffValue, tariffCurrency, additionalDetails, notifyDaysBefore, status, createdAt, updatedAt }`. Form = `CreatePowerContractDto`; conditional field (FRONTEND_API_SUMMARY §4.1): PURCHASE → `projectTypeOrCustomer` select from `/power-contracts/project-types`; SALE → free text. Auto-compose `installedCapacity` from value+unit and `tariff` from value+currency. Filters: search, contractType, status, projectTypeOrCustomer. Dashboard: totals, by status, purchase vs sale, total MW, by project type, expiring list. Alerts = power notifications + EXPIRING_SOON. Detail with attachments (`module="power-contracts"`) + history. Delete `/ppa/documents` route + nav item + `features/ppa` documents view. Delete `LegacyContractStatus` if Task 6 already merged; otherwise leave it for the controller.

### Wave C — parallel worktrees (after Wave B merges)

**Task 10 — Home.** Build from the dashboards of accessible modules (reuse the services exported by Tasks 6–9 via their `index.ts`) + notifications: module cards with total / active / expiring, upcoming expirations list, unread notifications summary. Delete `/home/summary` endpoint + mock.

**Task 11 — Support.** `/support` page: contact channels (`GET /support/contacts`), my tickets list (`GET /support/tickets`, status filter), create ticket dialog (`multipart/form-data`: subject, description, priority LOW/MEDIUM/HIGH/URGENT, optional image `file`). ADMIN extra: update ticket status + adminNote, add/delete contact channels. `SupportDialog` reads contacts from the API (fallback to `SUPPORT_CONTACTS`). Forgot-password notice links here.

**Task 12 — Admin users.** `/admin/users` (RoleGate admin): list (`page, limit, search, role, isActive`), create dialog (employeeCode → "lookup" button calls `/users/hrm/:empCode` to auto-fill fullName/department/division/email/phone; division select of the 3 Lao division names; role; 5 permission checkboxes), edit (role, division, flags), delete with confirm.

**Task 13 — Admin audit logs, contract types, departments.** `/admin/audit-logs` (filters action enum, userId; columns time, user, action label, target, changes summary). `/admin/contract-types` (list search/isActive, create/edit `{nameLo, nameEn, isActive}`, delete). `/admin/departments` (list search/isActive, create/edit `{name, code, isActive}`, delete, "Sync from HRM" button → `POST /departments/sync` with result toast).

### Task 14 — Integration (controller + one Sonnet)

Full `pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm e2e`; fix leftovers; update `docs/AGENT_GUIDE.md` (phase status, reuse inventory, live-mode notes, smoke script) and `README.md` env section.

## 4. Known risks

- Response envelopes and dashboard shapes are guesses until `scripts/live-smoke.mjs` runs against a live backend with real credentials. Mappers are tolerant; tighten after the smoke run.
- CORS on the backend must allow the frontend origin and the `Authorization` header.
- Token in a JS-readable cookie (Ruling 4).
