# Phase 4a — Legal Module (Regulations + Cases) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Replace the empty Legal module with the two Legal team systems:
  - the regulations register (ນິຕິກຳ ຟຟລ);
  - case tracking (ຄະດີ).
- It runs on mock data at GC quality: dashboard, lists, detail pages, modal and wizard forms, delete, attachments, CSV export, RBAC, e2e.

**Architecture:**
- One feature, `src/features/legal/`, with subfolders `regulations/`, `cases/` and `dashboard/`, plus a shared `lib/` (generic list store, URL query codec, URL sync hook) and `constants.ts`.
- Mock handlers live in `src/lib/api/mock/handlers/legal.ts`. Filtering, sorting and pagination run on the mock server, as in GC.
- Route files under `src/app/(app)/legal/` stay thin.
- GC (`src/features/gc/`) is the behavioural template. Read the matching GC file before writing each Legal file; do not modify GC.

**Tech Stack:** Next.js 16 (App Router, `cacheComponents`), React 19, TypeScript, Tailwind v4, shadcn/ui, zustand, zod v4, react-hook-form, axios + axios-mock-adapter, Vitest + Testing Library, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-24-phase4a-legal-design.md` (cited below as "spec §n"). Read it before your task. Also read `CLAUDE.md` and `docs/AGENT_GUIDE.md` §4–§7.

**Branch:** `phase-4a-legal`. Commit after every task.

## Global Constraints

- Every UI string comes from `src/lib/i18n/lo.ts`, under `lo.legal.*` (plus `lo.nav` / `lo.common`). There are no Lao literals in components, tests import `lo`, and code, comments and docs are English.
- Numbers use `Intl.NumberFormat('en-US')` grouping via `formatNumber`. Dates display as `dd/mm/yyyy` via `formatDate`.
- Status is never shown by colour alone: use `StatusBadge` (dot plus label). Icon-only buttons have a Lao `aria-label`.
- Use the existing pieces and don't rebuild them: `DataTable`, `PageHeader`, `KpiCard`, `BarList`, `StackedStatusBar`, `Stepper`, `ConfirmDialog`, `FilterChips`, `SearchInput`, `DatePicker`, `MoneyInput`, `FileDropzone`, `DocumentManager`, `Can`, `useCan`, `PermissionGuard`, `EmptyState`, `AlertBanner`, `Button variant="gold"`, `GlassCard accent="legal" | "litigation"`.
- Primary Legal actions use `Button variant="gold"`. Case screens use the `litigation` accent; regulation screens use `legal`.
- Every screen has skeleton, empty, error (rose `AlertBanner` plus retry) and forbidden states, and no horizontal scroll at 360px.
- Only `features/*/api/*.service.ts` and `src/lib/api/**` import axios. Other code imports the Legal feature only from `@/features/legal`.
- Mock handlers enforce permissions the way the server will:
  - 401 with no session;
  - 403 without the permission (module `'legal'`);
  - 404 for an unknown id;
  - 409 for a duplicate regulation number.
- Route files follow the current convention: thin Server Components, `export const instant = false;`, and a `<Suspense>` wrapper when the view uses `useSearchParams`.
- Verification before every commit, each with its real exit code:
  - `pnpm test --run <touched test files>; echo EXIT=$?`
  - `pnpm typecheck; echo EXIT=$?`
  - `pnpm lint; echo EXIT=$?`
  - `pnpm test --run; echo EXIT=$?`
  - Add `pnpm build; echo EXIT=$?` when a task adds or changes routes.
- The report back lists:
  - files changed;
  - RED and GREEN test output;
  - exit codes;
  - new `lo.legal.*` keys (for native-speaker review);
  - anything this plan got wrong.

## Rulings (controller decisions that refine the spec)

- **R1.** Documents for regulations use `entityType: 'legal-regulation'`, not `'regulation'`. The documents mock handler maps an entity type to the Legal module only when it starts with `legal`. *Cost if wrong:* a string rename in Phase 5.
- **R2.** The regulations list "ເອກະສານ" column shows the **external-link** count chip only. Files are on the detail page, because the list record carries no document count. *Cost if wrong:* adding `documentCount` to the API in Phase 5.
- **R3.** `MoneyInput` gets a single-currency mode: when `currencies.length === 1` it renders a static currency suffix instead of the `Select`. Cases use it for LAK and USD amounts.
- **R4.** The list store, URL query codec and URL sync hook are written once, generically, in `features/legal/lib/`, and used by both Legal lists. GC keeps its own copies and is not refactored in 4a.

## Review Focus

The five failure modes most likely to reach a user, each pinned by a test in the owning task:

1. **Editing a regulation without changing its number** must save, not 409. The record excludes itself from the duplicate check. *Task 6.*
2. **Export with filters active** must contain every matching row across all pages, not just the visible page, and no non-matching rows. *Tasks 6 and 11 (`pageSize=all`), Tasks 8 and 13 (view).*
3. **A Drive link that is not `https://`** (`http:`, `javascript:`, plain text) is rejected by the form, so a stored link can never run script when clicked. *Task 4.*
4. **Money left blank vs entered as 0.** Blank stays `null` and shows `—`; `0` shows `0`. The total is `—` only when both inputs on that currency side are null. *Tasks 3 and 12.*
5. **Hand-edited or stale URLs** (`?stage=bogus`, `?pageSize=7`, `?page=-1`, `?q=%20%20`) fall back to defaults without errors, and a search with surrounding spaces still matches. *Tasks 6, 7 and 11.*

---

## Part 1 — Foundation

### Task 1: Legal sidebar, mock users, stale Legal alerts

**Files:**
- Modify:
  - `src/config/navigation.ts` (`MODULE_NAV.legal`)
  - `src/config/navigation.test.ts`
  - `src/features/auth/mocks/auth.mock.ts`
  - `src/features/alerts/mocks/alerts.mock.ts` (delete the 4 `module: 'legal'` seeds)
  - `src/lib/api/mock/handlers/home.test.ts` (bucket counts)
  - any other test that counted those alerts (grep `legal` in `src/**/*.test.ts*`)
  - `src/lib/i18n/lo.ts` (`nav.createLegal`)
  - `docs/AGENT_GUIDE.md` §9

**Interfaces:**
- Produces: `MODULE_NAV.legal` has exactly 4 items, in this order:

  | key | label | href | icon | permission |
  |---|---|---|---|---|
  | `dashboard` | — | `/legal` | — | — |
  | `regulations` | — | `/legal/regulations` | `ScrollText` | — |
  | `cases` | — | `/legal/cases` | `Gavel` | — |
  | `create` | `lo.nav.createLegal` = `'ສ້າງໃໝ່'` | `/legal/new` | `FilePlus2` | `'create'` |

  The PPA and GC "create" items keep `lo.nav.create`.
- Produces: mock users `u-9` `legal.editor` (modules `['legal']`, `moduleRoles: { legal: 'editor' }`) and `u-10` `legal.viewer` (`legal: 'viewer'`), with Lao names and `@lcms.la` emails in the existing style.

- [ ] **Step 1: Write failing tests** in `navigation.test.ts`:
  - `legal nav lists dashboard, regulations, cases, create`: `MODULE_NAV.legal.map(i => i.key)` equals `['dashboard','regulations','cases','create']`, and `create.permission === 'create'`.
  - `legal detail routes highlight their list item`:
    - `isNavItemActive('/legal/regulations/reg-1', '/legal/regulations')` is true;
    - `isNavItemActive('/legal/cases/case-3', '/legal/cases')` is true;
    - `isNavItemActive('/legal/cases', '/legal')` is false.
- [ ] **Step 2: Run** `pnpm test --run src/config/navigation.test.ts; echo EXIT=$?`. Expected: FAIL (6 keys).
- [ ] **Step 3: Implement.** Edit `MODULE_NAV.legal` and drop the now-unused icon imports (`ShoppingCart`, `Library` if unused, `Scale` if unused). Keep `lo.nav.procurement`, `lo.nav.laws` and `lo.nav.hearings` in `lo.ts` for 4b. Add the users. Delete the 4 Legal alert seeds and update `home.test.ts` bucket expectations and its offset comment to the new counts.
- [ ] **Step 4: Run** the touched tests, then the full verification set. Expected: all EXIT=0.
- [ ] **Step 5: Update `docs/AGENT_GUIDE.md` §9** test-data table with `legal.editor` and `legal.viewer`. Then commit `feat(legal): 4-item legal sidebar, legal editor/viewer mock users, drop stale legal alerts`.

### Task 2: CSV export util

**Files:**
- Create: `src/lib/utils/export-csv.ts`, `src/lib/utils/export-csv.test.ts`

**Interfaces:**
- Produces:
  - `toCsv(headers: readonly string[], rows: readonly (readonly (string | number | null)[])[]): string`
  - `downloadCsv(filename: string, csv: string): void`
  - `csvStamp(today?: Date): string`, which returns the local date as `yyyy-MM-dd`, for filenames.

- [ ] **Step 1: Write failing tests:**
  - `starts with a UTF-8 BOM and uses CRLF`: `toCsv(['a'],[['x']])` equals `'﻿"a"\r\n"x"\r\n'`.
  - `quotes every cell and doubles quotes`: a cell `say "hi"` becomes `"say ""hi"""`.
  - `null is an empty quoted cell; numbers are plain`: `[null, 1500000.5]` becomes `"","1500000.5"`.
  - `string cells starting with = + - @ get a leading apostrophe`: `'=SUM(A1)'` becomes `"'=SUM(A1)"` and `'-5'` (a string) becomes `"'-5"`, but the number `-5` stays `"-5"`.
  - `keeps Lao text and newlines inside a quoted cell`.
  - `downloadCsv creates a text/csv blob link, clicks it and revokes the URL`: spy on `URL.createObjectURL` and `URL.revokeObjectURL` and on `HTMLAnchorElement.prototype.click`.
- [ ] **Step 2: Run** `pnpm test --run src/lib/utils/export-csv.test.ts; echo EXIT=$?`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement.** The blob type is `text/csv;charset=utf-8`. `csvStamp` uses `date-fns` `format(today, 'yyyy-MM-dd')`.
- [ ] **Step 4: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(utils): csv export with BOM and formula guard`.

### Task 3: Legal types, constants, money helpers, base copy, endpoints

**Files:**
- Create:
  - `src/features/legal/constants.ts`
  - `src/features/legal/regulations/types.ts`
  - `src/features/legal/cases/types.ts`
  - `src/features/legal/cases/lib/case-money.ts`, `case-money.test.ts`
  - `src/features/legal/index.ts`
- Modify: `src/lib/i18n/lo.ts` (new `legal` section), `src/lib/api/endpoints.ts`

**Interfaces:**
- Produces, from `constants.ts`:
  - `LEGAL_UNITS` (the 12 keys of spec §2.4, in that order) and `type LegalUnit`
  - `LEGAL_PAGE_SIZES = [10, 25, 50, 100] as const`
- Produces, from `regulations/types.ts`:
  - `REGULATION_TYPES = ['decision','provision','notice','rule','instruction','other'] as const` and `RegulationType`
  - `REGULATION_STATUSES = ['in_force','repealed'] as const` and `RegulationStatus`
  - `REGULATION_SORT_KEYS = ['issuedDate','title','number'] as const` and `RegulationSortKey`
  - `interface Regulation`, fields exactly as spec §2.1 except `documents`:
    `{ id; title; type; typeOther: string|null; number; issuedDate: ISODate; year: number|null; purpose: string|null; responsible: string|null; unit: LegalUnit; status: RegulationStatus; externalLinks: string[]; createdAt; updatedAt; createdBy }`
- Produces, from `cases/types.ts`:
  - `CASE_TYPES = ['civil','criminal','commercial','other'] as const` and `CaseType`
  - `CASE_STAGES = ['first_instance','appeal','cassation','completed','closed'] as const` and `CaseStage`
  - `CASE_SORT_KEYS = ['disputeDate','caseNo','defendant'] as const` and `CaseSortKey`
  - `CASE_PROGRESS_FILTERS = ['in_progress','finished'] as const` and `CaseProgressFilter`
  - `interface DualAmount { lak: number|null; usd: number|null }`
  - `interface DualTotals { lak: number; usd: number }`
  - `interface LegalCase`, as spec §2.2
- Produces, from `cases/lib/case-money.ts`:
  - `isCaseFinished(stage: CaseStage): boolean`
  - `caseTotal(c: Pick<LegalCase,'damage'|'fine'>): DualAmount`
  - `sumDual(values: readonly DualAmount[]): DualTotals`
  - `CASE_STAGE_TONE: Record<CaseStage, StatusTone>`: the first three stages are `'amber'`, `completed` is `'emerald'` and `closed` is `'slate'`
- Produces `REGULATION_STATUS_TONE`: `in_force: 'emerald'`, `repealed: 'slate'` (in `regulations/types.ts`).
- Produces `endpoints.legal`:
  - `regulations: '/legal/regulations'`
  - `regulation: (id) => '/legal/regulations/' + encodeURIComponent(id)`
  - `cases: '/legal/cases'`
  - `case: (id) => …`
  - `dashboard: '/legal/dashboard'`
- Produces `lo.legal`:
  - `regulationTypes`, `regulationStatus`, `caseTypes`, `caseStages`, `units`, with the Lao labels from spec §2.3 / §2.4
  - `fields`: every Lao field label in spec §2.1 and §2.2, plus `total: 'ລວມທັງໝົດ'`, `lak: 'ກີບ (LAK)'`, `usd: 'ໂດລາ (USD)'`
  - `progress: { inProgress: 'ກຳລັງດຳເນີນ', finished: 'ສຳເລັດ/ຈົບຄະດີ' }`
  - `validation`: `required`, `invalid`, `titleMax`, `textMax`, `purposeMax`, `typeOtherRequired`, `numberDuplicate`, `urlInvalid`, `linksMax`, `yearRange`, `amountNonNegative`, `dateInvalid`, `disputeDateFuture`
- `index.ts` re-exports everything above.

- [ ] **Step 1: Write failing tests** in `case-money.test.ts`:
  - `isCaseFinished`: true only for `completed` and `closed`.
  - `caseTotal sums per currency, null as 0`: damage `{lak:100,usd:null}` and fine `{lak:50,usd:20}` give `{lak:150,usd:20}`.
  - `caseTotal keeps a side null only when both inputs are null`: damage `{lak:null,usd:null}` and fine `{lak:0,usd:null}` give `{lak:0,usd:null}`.
  - `sumDual treats null as 0`: `[{lak:1,usd:null},{lak:null,usd:2}]` gives `{lak:1,usd:2}`; `[]` gives `{lak:0,usd:0}`.
  - `every stage has a tone`.
- [ ] **Step 2: Run** `pnpm test --run src/features/legal/cases/lib/case-money.test.ts; echo EXIT=$?`. Expected: FAIL.
- [ ] **Step 3: Implement** the types, constants, helpers, `lo.legal` base copy and endpoints, as listed above.
- [ ] **Step 4: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(legal): domain types, constants, money helpers, base copy`.

---

## Part 2 — Regulations

### Task 4: Regulation form schema

**Files:**
- Create: `src/features/legal/regulations/schemas/regulation.schema.ts`, `regulation.schema.test.ts`
- Modify: `src/features/legal/index.ts`

**Interfaces:**
- Consumes: Task 3 types and `lo.legal.validation`.
- Produces:
  - `regulationFormSchema` (zod object)
  - `type RegulationFormValues = { title: string; type: RegulationType; typeOther: string; number: string; issuedDate: string; year: string; purpose: string; responsible: string; unit: LegalUnit; status: RegulationStatus; externalLinks: string[] }`
  - `type RegulationInput = Omit<Regulation,'id'|'createdAt'|'updatedAt'|'createdBy'>`
  - `emptyRegulationForm(): RegulationFormValues` (`type: 'decision'`, `unit: 'edl_office'`, `status: 'in_force'`, `externalLinks: []`, other strings `''`)
  - `toRegulationPayload(f): RegulationInput`: trims; `''` becomes null; `year` becomes a number or null; `typeOther` becomes null unless `type === 'other'`; blank links are dropped
  - `fromRegulation(r): RegulationFormValues`
  - `yearOf(isoDate: string): string`: the `yyyy` part, or `''`

- [ ] **Step 1: Write failing tests**, modelled on `src/features/gc/schemas/gc.schema.test.ts`:
  - `requires title, number, issuedDate`: each one empty gives `lo.legal.validation.required` on that path.
  - `title over 300 chars is rejected`.
  - `typeOther is required only when type is other`: `type:'other', typeOther:''` gives `typeOtherRequired` on `typeOther`; `type:'notice', typeOther:''` is valid.
  - `year accepts '' or 1975..2100`: `'1974'`, `'2101'` and `'20x6'` give `yearRange`.
  - `externalLinks accept only https URLs` *(Review Focus 3)*: `'http://a.la'`, `'javascript:alert(1)'` and `'drive file'` each give `urlInvalid` at `externalLinks.<i>`; `'https://drive.google.com/x'` is valid.
  - `at most 10 links`: 11 gives `linksMax`.
  - `purpose over 2000 chars is rejected`.
  - `toRegulationPayload trims, nulls blanks, converts year, clears typeOther for non-other types`.
  - `fromRegulation(toRegulationPayload(f)) round-trips a full form`.
- [ ] **Step 2: Run** `pnpm test --run src/features/legal/regulations/schemas; echo EXIT=$?`. Expected: FAIL.
- [ ] **Step 3: Implement.** Use `z.url({ protocol: /^https$/ })`. Run conditional rules with `when: () => true`, as GC does, so they are not hidden behind other issues.
- [ ] **Step 4: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(legal): regulation form schema`.

### Task 5: Regulations mock seed and in-memory DB

**Files:**
- Create: `src/features/legal/regulations/mocks/regulations.mock.ts`, `regulations.mock.test.ts`
- Modify: `src/features/documents/mocks/documents.mock.ts` (add 3 docs)

**Interfaces:**
- Consumes: Tasks 3 and 4.
- Produces:
  - `createRegulationSeed(today?: Date): Regulation[]`, with exactly 30 records and ids `reg-1`…`reg-30`
  - `regulationsMockDb` with `all()`, `get(id)`, `insert(input: RegulationInput, by: string)`, `update(id, input: Partial<RegulationInput>)`, `remove(id)` and `reset(today?)`. Same copy-on-read semantics as `gcMockDb`; new ids are `reg-<seq>` with `seq` starting at 1000.
- Produces: `MOCK_DOCUMENTS` gains 3 PDF entries with `entityType: 'legal-regulation'` (R1), `entityId` `reg-1`, `reg-1` and `reg-2`.

- [ ] **Step 1: Write failing tests:**
  - `seed has 30 records covering every type, both statuses and all 12 units`.
  - `exactly one other-type record, with typeOther set`.
  - `reg-1 is the team sample`:
    - title contains `KPIs`
    - number `351/ຟຟລ.ຝບຊ`
    - unit `accounting`
    - status `in_force`
    - `issuedDate` is the 23 June of `today`'s year
    - `year` is `today`'s year
  - `link coverage`: at least 3 records with ≥ 2 links, and at least 10 with none.
  - `numbers are unique case-insensitively`.
  - `issuedDate values are valid ISO dates and none is after today`.
  - `insert assigns reg-1001 and timestamps; update keeps id; remove deletes; reset restores 30`.
- [ ] **Step 2: Run** `pnpm test --run src/features/legal/regulations/mocks; echo EXIT=$?`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Deterministic data, with dates relative to `today` via `date-fns`, as `gc.mock.ts` does.
  - Titles are realistic Lao regulation titles with fictional people's names (ນ / ທ້າວ prefixes).
  - Numbers follow `NNN/ຟຟລ.<unit abbr>`.
- [ ] **Step 4: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(legal): regulations mock seed and db`.

### Task 6: Regulations mock handler and service

**Files:**
- Create:
  - `src/lib/api/mock/handlers/legal.ts`, `legal.test.ts`
  - `src/features/legal/regulations/api/regulations.service.ts`, `regulations.service.test.ts`
- Modify: `src/lib/api/mock/index.ts` (register), `src/features/legal/index.ts`

**Interfaces:**
- Consumes: Tasks 3–5, `hasPermission`, `getMockSessionUser`.
- Produces `RegulationListQuery`:
  ```ts
  interface RegulationListQuery {
    page?: number; pageSize?: number | 'all'; q?: string;
    type?: RegulationType; unit?: LegalUnit; status?: RegulationStatus;
    sort?: RegulationSortKey; order?: 'asc' | 'desc';
  }
  ```
- Produces `regulationsService`:
  - `list(q?: RegulationListQuery): Promise<Paginated<Regulation>>`
  - `get(id: string): Promise<Regulation>`
  - `create(body: RegulationInput): Promise<Regulation>`
  - `update(id: string, body: RegulationInput): Promise<Regulation>`
  - `remove(id: string): Promise<void>`
- Produces: `legal.ts` exports `register(mock)` and the shared private helpers `authorize`, `parseBody`, `pageOf` and `compareNullsLast`. Later tasks add the cases and dashboard routes to this same file.
- Handler contract:
  - Detail regex `^/legal/regulations/([^/]+)$`.
  - Defaults: `sort=issuedDate`, `order=desc`, `pageSize=10`.
  - An invalid `type`, `unit`, `status`, `sort`, `order`, `page` or `pageSize` falls back to its default.
  - `pageSize=all` returns every filtered row, with `pageSize` echoed as `total`.
  - `q` is trimmed and lower-cased, and matched against title, number and responsible.
  - The title sort uses `localeCompare(…, 'lo')`.
  - POST/PATCH return 409 `{ code: 'DUPLICATE_REGULATION_NO', fieldErrors: { number: 'DUPLICATE_REGULATION_NO' } }`. The duplicate check excludes the record being edited.

- [ ] **Step 1: Write failing tests** in `legal.test.ts`, modelled on `handlers/gc.test.ts`:
  - `401 without session; 403 for create/edit/delete as legal.viewer; legal.editor can create`.
  - `default list is 10 rows sorted by issuedDate desc, total 30`.
  - `filters by type, unit and status, and combines them`.
  - `search trims spaces and matches number` *(Review Focus 5)*: `q='  351/ '` finds `reg-1`.
  - `invalid params fall back to defaults` *(Review Focus 5)*: `type=bogus`, `pageSize=7`, `page=-1`, `sort=x` give the default page 1 of 10 by issuedDate desc.
  - `pageSize=all returns every filtered row` *(Review Focus 2)*: `status=repealed&pageSize=all` gives `items.length === total`, and every item is repealed.
  - `POST with an existing number (different case) returns 409 on number`.
  - `PATCH keeping its own number succeeds` *(Review Focus 1)*.
  - `GET/PATCH/DELETE unknown id return 404`.
  - `DELETE removes the record`.
- [ ] **Step 2: Write failing test** in `regulations.service.test.ts`: `list passes query params and returns Paginated`, using the mock adapter as in `gc.service.test.ts`.
- [ ] **Step 3: Run** both test files. Expected: FAIL.
- [ ] **Step 4: Implement** the handler and service, register `registerLegal` in `src/lib/api/mock/index.ts`, and reset `regulationsMockDb` in test `beforeEach`.
- [ ] **Step 5: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 6: Commit** `feat(legal): regulations mock api and service`.

### Task 7: Generic list store, URL query codec and URL sync (regulations instance)

**Files:**
- Create:
  - `src/features/legal/lib/list-query-codec.ts`, `list-query-codec.test.ts`
  - `src/features/legal/lib/create-list-store.ts`, `create-list-store.test.ts`
  - `src/features/legal/lib/use-list-url-sync.ts`, `use-list-url-sync.test.tsx`
  - `src/features/legal/regulations/store/regulations-list.store.ts`
- Modify: `src/features/legal/index.ts`

**Interfaces:**
- Consumes: `regulationsService.list` (Task 6), `registerLogoutReset`, `isCanceledError`, `normalizeError`.
- Produces the codec:
  ```ts
  interface ListQueryBase { page?: number; pageSize?: number | 'all'; q?: string; sort?: string; order?: 'asc'|'desc' }
  interface QueryCodecSpec<Q extends ListQueryBase> {
    defaults: Q & { page: number; pageSize: number; sort: string; order: 'asc'|'desc' };
    enums: { [K in keyof Q]?: readonly string[] };   // enum-valued filter params
    sortKeys: readonly string[];
    pageSizes: readonly number[];
  }
  createQueryCodec<Q>(spec): { defaults: …; parse(sp: URLSearchParams): Q; serialize(q: Q): string }
  ```
  Behaviour matches `parseGcListQuery` / `serializeGcListQuery`, generalised over `enums`. `serialize` omits defaults and never writes `pageSize=all`.
- Produces the store factory: `createListStore<T, Q extends ListQueryBase>(fetchPage: (q: Q) => Promise<Paginated<T>>, defaults: Q)`. It returns a zustand hook with the state and actions of `GcListState` (`query`, `items`, `total`, `status`, `error`, `setQuery`, `replaceQuery`, `fetch`, `afterDelete`, `reset`), keeps its own generation counter, and calls `registerLogoutReset`.
- Produces the sync hook: `useListUrlSync<Q>(useStore, codec): void`, with the same algorithm as `use-gc-list-url-sync.ts`.
- Produces:
  - `regulationsQueryCodec`: defaults `{ page:1, pageSize:10, sort:'issuedDate', order:'desc' }`; enums `type`, `unit`, `status`
  - `useRegulationsListStore`
  - `useRegulationsListUrlSync()`, which wraps `useListUrlSync`

- [ ] **Step 1: Port the GC tests.** Copy the cases of `gc-list-query.test.ts`, `gc-list.store.test.ts` and `use-gc-list-url-sync.test.tsx` into the three new test files, targeting the generic functions with the regulations codec and store. Add:
  - `parse ignores unknown enum values and non-listed page sizes` *(Review Focus 5)*.
  - `serialize omits defaults and blank q`.
  - `two stores created by the factory do not share generation or state`.
- [ ] **Step 2: Run** `pnpm test --run src/features/legal/lib; echo EXIT=$?`. Expected: FAIL.
- [ ] **Step 3: Implement** the codec, store factory and sync hook, then the regulations instances.
- [ ] **Step 4: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(legal): generic url-synced list store`.

### Task 8: Regulations list page and CSV export

**Files:**
- Create:
  - `src/features/legal/regulations/lib/regulations-csv.ts`, `regulations-csv.test.ts`
  - `src/features/legal/regulations/components/regulations-view.tsx`, `regulations-view.test.tsx`
  - `src/app/(app)/legal/regulations/page.tsx`
- Modify: `src/lib/i18n/lo.ts` (`lo.legal.regulations.list.*`, `lo.legal.regulations.csv.*`), `src/features/legal/index.ts`

**Interfaces:**
- Consumes: Tasks 2, 3, 6 and 7, `DataTable`, `useCan('legal', …)`.
- Produces:
  - `buildRegulationsCsv(items: readonly Regulation[]): string`. Columns follow spec §6.6, in order; labels for type, unit and status; `issuedDate` via `formatDate`; links joined with `'; '`.
  - `RegulationsView` (no props), the list page. In this task it has **no add button and no row edit button**; Task 9 adds both. Row actions here are delete only.

- [ ] **Step 1: Write failing tests** in `regulations-csv.test.ts`: `header row is the 10 spec columns`; `a row with two links joins them with '; '`; `dates are dd/mm/yyyy`; `labels are Lao, not keys`.
- [ ] **Step 2: Write failing tests** in `regulations-view.test.tsx`, modelled on `gc-contracts-view.test.tsx`:
  - `renders rows with number link to /legal/regulations/<id>, status badge label, link-count chip`.
  - `type, unit and status filters update the store query`.
  - `legal.viewer sees no delete or export controls`.
  - `legal.editor sees delete but not export`.
  - `legal.user sees export`.
  - `export fetches pageSize 'all' with the current filters and downloads EDL_Legal_Regulations_<stamp>.csv` *(Review Focus 2)*: spy on `regulationsService.list` and `downloadCsv`.
  - `delete asks for confirmation, calls remove, then afterDelete, and shows a toast`.
  - `error state shows a retry that refetches`.
- [ ] **Step 3: Run** both test files. Expected: FAIL.
- [ ] **Step 4: Implement** the CSV builder, the view and the page.
  - Columns follow spec §6.2. Below 2xl, the year, file-count and unit columns move into sublines, as in GC.
  - Page-size select over `LEGAL_PAGE_SIZES`.
  - Header actions: gold add, and export inside `Can permission="download"`.
  - The page is a thin route, `<Suspense>` plus `RegulationsView`.
- [ ] **Step 5: Run** the verification set plus `pnpm build; echo EXIT=$?`. Expected: EXIT=0.
- [ ] **Step 6: Commit** `feat(legal): regulations list with filters and csv export`.

### Task 9: Regulation form dialog (create/edit, links, staged files)

**Files:**
- Create:
  - `src/features/legal/regulations/components/regulation-form-fields.tsx`
  - `src/features/legal/regulations/components/regulation-form-dialog.tsx`, `regulation-form-dialog.test.tsx`
  - `src/features/legal/lib/upload-staged.ts`, `upload-staged.test.ts`
- Modify: `regulations-view.tsx`, `lo.ts` (`lo.legal.regulations.form.*`), `index.ts`

**Interfaces:**
- Consumes: Task 4 schema, Task 6 service, `documentsService.upload`, `FileDropzone`, `DatePicker`, `useReturnFocus`.
- Produces:
  - `RegulationFormFields({ form })`, shared with the wizard (Task 18). Fields in spec order:
    - `year` auto-fills from `issuedDate` until the user types in `year`
    - `typeOther` appears only when type is `other`
    - links are a repeatable https input with add/remove buttons that have Lao `aria-label`s
  - `RegulationFormDialog({ open, onOpenChange, regulation?: Regulation, onSaved(r: Regulation): void })`
  - `uploadStaged(files: File[], entityType: string, entityId: string): Promise<{ failed: File[] }>`, extracted from the GC wizard's upload logic (`Promise.allSettled`)

- [ ] **Step 1: Write failing tests** in `upload-staged.test.ts`: `returns failed files only`; `uploads each file with the given entityType and id`.
- [ ] **Step 2: Write failing tests** in `regulation-form-dialog.test.tsx`, plus 2 added to `regulations-view.test.tsx`:
  - (view) `legal.viewer sees no add button and no row edit button`.
  - (view) `legal.editor's gold add opens the dialog; a row edit opens it prefilled; onSaved refetches the list`.
  - `create submits toRegulationPayload and calls onSaved`.
  - `edit prefills from the regulation and PATCHes`.
  - `409 maps lo.legal.validation.numberDuplicate onto the number field`.
  - `choosing type other reveals typeOther; switching back hides it and clears the error`.
  - `picking issuedDate fills year; editing year stops the auto-fill`.
  - `create with staged files uploads them as legal-regulation after create; a failed upload shows the partial-failure toast and still calls onSaved`.
  - `the dropzone is hidden in edit mode`.
  - `closing returns focus to the trigger`.
- [ ] **Step 3: Run** both test files. Expected: FAIL.
- [ ] **Step 4: Implement**, modelled on `gc-contract-form-dialog.tsx` and `gc-contract-form-fields.tsx`. Wire it into `RegulationsView` for add and row edit. Upload staged files only when `useCan('legal','create')`.
- [ ] **Step 5: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 6: Commit** `feat(legal): regulation create/edit dialog with links and files`.

### Task 10: Regulation detail page

**Files:**
- Create:
  - `src/features/legal/regulations/components/regulation-detail-view.tsx`, `regulation-detail-view.test.tsx`
  - `src/app/(app)/legal/regulations/[id]/page.tsx`
- Modify: `lo.ts` (`lo.legal.regulations.detail.*`), `index.ts`

**Interfaces:**
- Consumes: Tasks 6 and 9, `DocumentManager`.
- Produces: `RegulationDetailView({ id }: { id: string })`.

- [ ] **Step 1: Write failing tests**, modelled on `gc-contract-detail-view.test.tsx`:
  - `shows number, title, status badge and every field label from lo.legal.fields`.
  - `external links render as anchors with target _blank and rel noopener noreferrer`.
  - `DocumentManager gets entityType legal-regulation and permissions from useCan('legal', create/download/delete)`.
  - `edit opens the dialog prefilled; delete confirms, removes and routes to /legal/regulations`.
  - `404 shows EmptyState with a link back to the list`.
  - `viewer sees no edit or delete`.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** the view and the thin page (async `params`, as in `contracts/[id]/page.tsx`).
- [ ] **Step 4: Run** the verification set plus `pnpm build`. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(legal): regulation detail page`.

---

## Part 3 — Cases

### Task 11: Cases mock seed, DB, handler routes, service and store

**Files:**
- Create:
  - `src/features/legal/cases/mocks/cases.mock.ts`, `cases.mock.test.ts`
  - `src/features/legal/cases/api/cases.service.ts`, `cases.service.test.ts`
  - `src/features/legal/cases/store/cases-list.store.ts`
- Modify: `src/lib/api/mock/handlers/legal.ts`, `legal.test.ts`, `index.ts`

**Interfaces:**
- Consumes: Tasks 3, 6 and 7.
- Produces:
  - `type CaseInput = Omit<LegalCase,'id'|'caseNo'|'createdAt'|'updatedAt'|'createdBy'>`, defined in `cases/types.ts`
  - `createCaseSeed(today?: Date): LegalCase[]`: 24 records, ids `case-1`…`case-24`
  - `casesMockDb`: same API as `regulationsMockDb`. `insert` assigns `caseNo = 'LC-<yyyy>-<nnn>'`, where `yyyy` is the current year and `nnn` is 1 + the highest `nnn` already used for that year, zero-padded to 3.
  - `CaseListQuery`:
    `{ page?; pageSize?: number|'all'; q?; caseType?: CaseType; stage?: CaseStage; progress?: CaseProgressFilter; sort?: CaseSortKey; order? }`
  - `casesService`: `list`, `get`, `create(body: CaseInput)`, `update(id, body: CaseInput)`, `remove`, with the same signatures as `regulationsService`
  - `casesQueryCodec`: defaults `{ page:1, pageSize:10, sort:'disputeDate', order:'desc' }`; enums `caseType`, `stage`, `progress`
  - `useCasesListStore`, `useCasesListUrlSync()`
- Handler contract:
  - Detail regex `^/legal/cases/([^/]+)$`.
  - `q` matches caseNo, defendant, allegation, handlingUnit and progress.
  - `progress=in_progress` or `finished` filters via `isCaseFinished`.
  - Null `disputeDate` sorts last in both directions.
  - `pageSize=all`.
  - No 409.
  - Permissions as in Task 6.

- [ ] **Step 1: Write failing tests** in `cases.mock.test.ts`:
  - `24 records covering every stage and every case type`.
  - `amount coverage`: at least one record each that is LAK-only, USD-only, mixed, all-null, recovered 0, recovered partial, and recovered equal to its total.
  - `exactly one record has a null disputeDate; none is in the future`.
  - `caseNo values are unique and match ^LC-\d{4}-\d{3}$`.
  - `insert numbers the next case of the year`: with today in 2026 and the highest existing number `LC-2026-012`, the new number is `LC-2026-013`.
- [ ] **Step 2: Write failing tests** in `legal.test.ts` (cases block):
  - `401/403 matrix as for regulations`.
  - `default sort disputeDate desc with the null date last`.
  - `progress=finished returns only completed and closed`.
  - `stage=bogus falls back to no stage filter` *(Review Focus 5)*.
  - `q matches progress text`.
  - `pageSize=all with caseType filter returns all matching rows` *(Review Focus 2)*.
  - `POST ignores a client-sent caseNo and assigns one`.
  - `PATCH and DELETE 404 for an unknown id`.
- [ ] **Step 3: Write failing tests** for the service list params, and a smoke test `useCasesListStore` as `createListStore` instance, with independent state from the regulations store.
- [ ] **Step 4: Run** the touched tests. Expected: FAIL.
- [ ] **Step 5: Implement.** Mock names and allegations are fictional; handling units are realistic Lao units (ສານປະຊາຊົນ… / ອົງການໄອຍະການ… / ຝ່າຍກົດໝາຍ-ສັນຍາ). Dates are relative to `today`.
- [ ] **Step 6: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 7: Commit** `feat(legal): cases mock api, service and list store`.

### Task 12: Case form schema, `MoneyInput` single-currency mode, case form dialog

**Files:**
- Create:
  - `src/features/legal/cases/schemas/case.schema.ts`, `case.schema.test.ts`
  - `src/features/legal/cases/components/dual-amount-field.tsx`
  - `src/features/legal/cases/components/case-form-fields.tsx`
  - `src/features/legal/cases/components/case-form-dialog.tsx`, `case-form-dialog.test.tsx`
- Modify: `src/components/shared/money-input.tsx` and its test (R3), `lo.ts` (`lo.legal.cases.form.*`), `index.ts`

**Interfaces:**
- Consumes: Tasks 3 and 11.
- Produces:
  - `caseFormSchema`
  - `type CaseFormValues = { defendant: string; allegation: string; handlingUnit: string; caseType: CaseType; stage: CaseStage; damage: DualAmount; fine: DualAmount; recovered: DualAmount; disputeDate: string | null; progress: string }`
  - `emptyCaseForm()` (`caseType: 'civil'`, `stage: 'first_instance'`, every amount `{lak:null,usd:null}`, `disputeDate: null`)
  - `toCasePayload(f): CaseInput`
  - `fromCase(c): CaseFormValues`
- Produces: `DualAmountField({ id, label, value: DualAmount, onChange })`. It renders two `MoneyInput`s with `currencies={['LAK']}` and `currencies={['USD']}`, converting between `DualAmount` sides and `Money | null`.
- Produces: `CaseFormFields({ form })` (shared with Task 19), and `CaseFormDialog({ open, onOpenChange, legalCase?: LegalCase, onSaved(c: LegalCase): void })`.

- [ ] **Step 1: Write failing tests** in `money-input.test.tsx`: `with one currency it renders a static currency label and no combobox`; `with several currencies it still renders the select` (regression).
- [ ] **Step 2: Write failing tests** in `case.schema.test.ts`:
  - `requires defendant, allegation, handlingUnit`.
  - `length limits 200/300/200 and progress 2000`.
  - `amounts must be >= 0 or null`: `-1` gives `amountNonNegative`, and `0` is valid.
  - `disputeDate may be null; must be a real date; must not be after today`: use `vi.setSystemTime(new Date('2026-10-24T10:00:00'))`; `'2026-10-25'` gives `disputeDateFuture` and `'2026-10-24'` is valid.
  - `round-trip toCasePayload/fromCase`.
- [ ] **Step 3: Write failing tests** in `case-form-dialog.test.tsx`:
  - `create submits payload and calls onSaved`.
  - `edit prefills and PATCHes`.
  - `typing 1,500,000 in damage LAK stores 1500000`.
  - `live total row shows caseTotal per currency, '—' when a side is null and '0' when entered as 0` *(Review Focus 4)*.
  - `caseNo is shown read-only in edit mode`.
- [ ] **Step 4: Run** the touched tests. Expected: FAIL.
- [ ] **Step 5: Implement.** The `MoneyInput` single-currency branch renders a `<span>` with `lo.currency[c]` in place of the `Select`. The form groups the three `DualAmountField`s in a bordered section, followed by the live total.
- [ ] **Step 6: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 7: Commit** `feat(legal): case form with dual-currency amounts`.

### Task 13: Cases list page, CSV export, print

**Files:**
- Create:
  - `src/features/legal/cases/lib/cases-csv.ts`, `cases-csv.test.ts`
  - `src/features/legal/cases/components/cases-view.tsx`, `cases-view.test.tsx`
  - `src/app/(app)/legal/cases/page.tsx`
- Modify: `src/components/layout/app-shell.tsx` (`print:hidden` on the sidebar and topbar wrappers), `lo.ts` (`lo.legal.cases.list.*`, `lo.legal.cases.csv.*`), `index.ts`

**Interfaces:**
- Consumes: Tasks 2, 11 and 12.
- Produces:
  - `buildCasesCsv(items: readonly LegalCase[]): string`. Columns in this order:
    1. caseNo, defendant, allegation, handlingUnit, caseType label, stage label
    2. damage LAK, damage USD, fine LAK, fine USD
    3. total LAK, total USD (from `caseTotal`)
    4. recovered LAK, recovered USD
    5. disputeDate (`formatDate`, `''` when null), progress

    Amounts are plain numbers, and null becomes an empty cell.
  - `CasesView` (no props).

- [ ] **Step 1: Write failing tests** in `cases-csv.test.ts`: `16 header columns in order`; `total columns equal caseTotal`; `null amounts are empty cells, 0 is "0"`; `null disputeDate is empty`.
- [ ] **Step 2: Write failing tests** in `cases-view.test.tsx`:
  - `rows link caseNo to /legal/cases/<id>, show stage badge label, total and recovered with LAK and USD lines`.
  - `stage chips and the in-progress/finished quick filter set stage/progress (mutually exclusive)`.
  - `permission matrix as for regulations`.
  - `export calls list with pageSize 'all' and current filters, then downloads EDL_Legal_Cases_<stamp>.csv` *(Review Focus 2)*.
  - `print button calls window.print`.
  - `filters, actions and pagination carry print:hidden`.
  - `delete flow with ConfirmDialog and toast`.
- [ ] **Step 3: Run** the touched tests. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - Columns follow spec §6.3; below 2xl, handling unit, type and date move into sublines.
  - Litigation accent.
  - Wire `CaseFormDialog` for add and edit.
  - The table wrapper gets `print:bg-white print:text-black`.
- [ ] **Step 5: Run** the verification set plus `pnpm build`. Expected: EXIT=0.
- [ ] **Step 6: Commit** `feat(legal): cases list with filters, csv export and print`.

### Task 14: Case detail page

**Files:**
- Create:
  - `src/features/legal/cases/components/case-detail-view.tsx`, `case-detail-view.test.tsx`
  - `src/app/(app)/legal/cases/[id]/page.tsx`
- Modify: `lo.ts` (`lo.legal.cases.detail.*`), `index.ts`

**Interfaces:**
- Consumes: Tasks 11 and 12, `Stepper`.
- Produces: `CaseDetailView({ id }: { id: string })`.

- [ ] **Step 1: Write failing tests:**
  - `header shows caseNo, defendant, stage badge`.
  - `stepper has 4 steps; the last is labelled by the actual finished stage`: `completed` gives the label ສໍາເລັດ, `closed` gives ຈົບຄະດີ, and an in-progress case gives `lo.legal.progress.finished`. The current step is the case's stage (`cassation` is step 3, both finished stages are step 4). The stepper is read-only, with no `onStepClick`.
  - `money table has rows damage/fine/total/recovered and columns LAK/USD, with '—' for null`.
  - `progress note shown; '—' when null`.
  - `edit and delete gated by permission; delete routes to /legal/cases`.
  - `404 EmptyState`.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** the view and the thin page.
- [ ] **Step 4: Run** the verification set plus `pnpm build`. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(legal): case detail with stage stepper and money table`.

---

## Part 4 — Dashboard and Home

### Task 15: Legal dashboard

**Files:**
- Create:
  - `src/features/legal/dashboard/types.ts`
  - `src/features/legal/dashboard/api/legal-dashboard.service.ts`
  - `src/features/legal/dashboard/components/legal-dashboard-view.tsx`, `legal-dashboard-view.test.tsx`
- Modify: `src/app/(app)/legal/page.tsx` (replace the EmptyState), `handlers/legal.ts`, `legal.test.ts`, `lo.ts` (`lo.legal.dashboard.*`), `index.ts`

**Interfaces:**
- Consumes: Tasks 3, 5 and 11 (`sumDual`, `isCaseFinished`).
- Produces: `interface LegalDashboard`, exactly as spec §5; `legalDashboardService.get(): Promise<LegalDashboard>`; `LegalDashboardView` (no props).
- Handler: `GET /legal/dashboard`, registered **before** the detail routes, `view` permission.

- [ ] **Step 1: Write failing handler tests:**
  - `aggregates the seed`:
    - `regulations.total` 30; `byStatus` sums to 30
    - `byType` lists all 6 types, zero counts included
    - `byUnit` has only units with count > 0, sorted descending
    - `unitCount` equals `byUnit.length`
  - Cases:
    - `total` 24; `inProgress + finished === total`
    - `byStage` lists all 5 stages in `CASE_STAGES` order
    - money totals equal `sumDual` over the seed
  - `401 without session`.
- [ ] **Step 2: Write failing view tests** with a fixture `LegalDashboard`:
  - `regulations KPIs: total, in force, repealed, units`.
  - `cases KPIs: total, in progress, finished, damage+fine LAK, damage+fine USD, recovered LAK / USD`, with numbers formatted `1,500,000`.
  - `by-type and by-unit BarLists use Lao labels`.
  - `stage StackedStatusBar uses stage labels and CASE_STAGE_TONE`.
  - `section headers link to /legal/regulations and /legal/cases`.
  - `skeleton while loading; error banner with retry`.
- [ ] **Step 3: Run** the touched tests. Expected: FAIL.
- [ ] **Step 4: Implement** per spec §6.1:
  - The regulations section uses `accent="legal"` and the cases section uses `accent="litigation"`.
  - Money comparison: two horizontal `BarList`s (LAK, USD), each with rows damage, fine and recovered.
  - The page header has a gold "ສ້າງໃໝ່" link to `/legal/new` inside `Can permission="create"`.
- [ ] **Step 5: Run** the verification set plus `pnpm build`. Expected: EXIT=0.
- [ ] **Step 6: Commit** `feat(legal): legal dashboard`.

### Task 16: Home Legal card from Legal mocks

**Files:**
- Modify:
  - `src/lib/api/mock/handlers/home.ts`, `home.test.ts`
  - `src/features/home/mocks/home.mock.ts` (the Legal row becomes a placeholder, like GC's)

**Interfaces:**
- Consumes: `regulationsMockDb`, `casesMockDb`, `isCaseFinished`, all imported from `@/features/legal`.
- Produces: `legalStats()` in `home.ts`:
  - `total` = regulations + cases
  - `active` = in-force regulations + in-progress cases
  - `expiring` = 0

- [ ] **Step 1: Write failing test:** `home summary legal stats come from the legal mock dbs`. Expect total 54 and `active` equal to the seed-derived count (computed in the test from the DBs, not hard-coded); `expiring` is 0. A `legal.user` session sees only the legal card.
- [ ] **Step 2: Run** `pnpm test --run src/lib/api/mock/handlers/home.test.ts; echo EXIT=$?`. Expected: FAIL (318).
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the verification set. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(home): legal card stats from legal mocks`.

---

## Part 5 — Wizard

### Task 17: `/legal/new` chooser and regulation wizard

**Files:**
- Create:
  - `src/features/legal/components/legal-new-view.tsx`, `legal-new-view.test.tsx`
  - `src/features/legal/regulations/components/regulation-wizard.tsx`, `regulation-wizard.test.tsx`
  - `src/app/(app)/legal/new/page.tsx`
- Modify: `lo.ts` (`lo.legal.wizard.*`), `index.ts`

**Interfaces:**
- Consumes: Tasks 4, 6 and 9 (`RegulationFormFields`, `uploadStaged`), `Stepper`, `PermissionGuard`.
- Produces:
  - `LegalNewView` (no props). It reads `?kind=regulation|case` with `useSearchParams`.
    - `kind=regulation` renders `RegulationWizard`.
    - Any other value, including a missing one and (until Task 18) `case`, renders a two-card chooser whose cards are links to `?kind=regulation` and `?kind=case`.
  - `RegulationWizard`: three steps, as in spec §6.4, with a live summary aside. It submits through `regulationsService.create`, uploads staged files, then `router.push('/legal/regulations/<id>')`.
- Page: `PermissionGuard module="legal" permission="create"` wrapping `<Suspense><LegalNewView/></Suspense>`.

- [ ] **Step 1: Write failing tests:**
  - `no kind shows two cards linking to ?kind=regulation and ?kind=case`.
  - `kind=bogus shows the chooser`.
  - `regulation wizard blocks Next until step-1 fields are valid; step 3 shows a review of entered values`.
  - `submit creates, uploads staged files as legal-regulation, and routes to the detail`.
  - `double-click on submit creates once`: copy the GC wizard lock test.
- [ ] **Step 2: Run** the touched tests. Expected: FAIL.
- [ ] **Step 3: Implement**, modelled on `gc-wizard-view.tsx`; reuse its lock pattern.
- [ ] **Step 4: Run** the verification set plus `pnpm build`. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(legal): new-record chooser and regulation wizard`.

### Task 18: Case wizard

**Files:**
- Create: `src/features/legal/cases/components/case-wizard.tsx`, `case-wizard.test.tsx`
- Modify: `legal-new-view.tsx` and its test, `lo.ts`, `index.ts`

**Interfaces:**
- Consumes: Task 12 (`CaseFormFields`, `caseFormSchema`), Task 11 (`casesService`), Task 17 (`LegalNewView`).
- Produces: `CaseWizard`, three steps as in spec §6.4. Step 2 shows the live `caseTotal`. On success it routes to `/legal/cases/<id>`.

- [ ] **Step 1: Write failing tests:**
  - `kind=case renders the case wizard`.
  - `step 1 requires defendant, allegation, handlingUnit`.
  - `step 2 shows the live total`.
  - `submit creates once and routes to the detail`.
- [ ] **Step 2: Run** the touched tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the verification set plus `pnpm build`. Expected: EXIT=0.
- [ ] **Step 5: Commit** `feat(legal): case wizard`.

---

## Part 6 — End-to-end, screenshots, docs

### Task 19: E2E, accessibility, DoD screenshots

**Files:**
- Create: `e2e/legal.spec.ts`
- Modify:
  - `e2e/responsive-a11y.spec.ts` (add the 6 Legal routes)
  - `e2e/dod-screenshots.spec.ts` (add `legal-dashboard`, `legal-regulations`, `legal-regulation-detail`, `legal-cases`, `legal-case-detail`, `legal-new`)

**Interfaces:**
- Consumes: everything above, plus `loginAs` and `setTheme` from `e2e/helpers.ts`.

- [ ] **Step 1: Write the e2e tests**, modelled on `e2e/gc.spec.ts`:
  - `legal.viewer: read-only everywhere`:
    - no add, edit, delete, upload, download or export on either list or detail page;
    - `/legal/new` goes to `/forbidden`;
    - the sidebar shows exactly 3 Legal items (ພາບລວມ / ນິຕິກຳ / ຄະດີ), because the create item needs `create`.
  - `legal.editor sees 4 Legal sidebar items, including ສ້າງໃໝ່`.
  - `legal.editor: regulation via modal`: create, find by search, edit, then delete. No export button.
  - `legal.editor: case via wizard`:
    - `/legal/new` chooser, then case;
    - fill 3 steps, landing on the detail page with an `LC-<year>-` number;
    - edit the stage to ສໍາເລັດ, then delete from the detail page.
  - `legal.user: exports regulations CSV with the status filter applied`:
    - `page.waitForEvent('download')`;
    - the filename matches `EDL_Legal_Regulations_\d{4}-\d{2}-\d{2}\.csv`;
    - the file starts with the BOM, and the data rows count equals the filtered total.
  - `legal.user: downloads a file on reg-1`.
  - `list filters survive reload via URL` (cases, `?stage=appeal`).
  - `print media hides the shell on /legal/cases`: `page.emulateMedia({ media: 'print' })`, then the sidebar is not visible and the table is visible.
  - `unknown regulation and case ids show the not-found state with a way back`.
- [ ] **Step 2: Run** `pnpm e2e e2e/legal.spec.ts; echo EXIT=$?`. Fix only test-side issues here. A product bug goes back to its owning task's code, with a note in the report.
- [ ] **Step 3: Extend** the responsive-a11y and DoD lists.
  - Run `pnpm e2e; echo EXIT=$?`.
  - Run `DOD_SHOTS=1 pnpm e2e e2e/dod-screenshots.spec.ts; echo EXIT=$?` (in PowerShell: `$env:DOD_SHOTS=1; pnpm e2e e2e/dod-screenshots.spec.ts`).
  - Expected: EXIT=0, and screenshots in `test-results/dod/`.
- [ ] **Step 4: Commit** `test(legal): e2e for rbac, crud, export, print, a11y and dod shots`.

### Task 20: Docs

**Files:**
- Modify:
  - `docs/AGENT_GUIDE.md` (§2 status, §4.3 add `toCsv`/`downloadCsv` and the `MoneyInput` single-currency mode, §4.5 note `features/legal/lib` generic list helpers, §10 pending-review keys `lo.legal.*`)
  - `Frontend_LCMS_Project.md` §6 (replace `Regulation`, `LegalCase`, `CaseStage`, `Hearing` per spec §10.1) and the §5 draft-endpoint table (mark procurement, laws and hearings as 4b; add `/legal/dashboard`)
  - `Design.md` §12 (artboard 07 maps to `/legal/cases` in 4a)
  - `docs/superpowers/plans/2026-10-20-lcms-roadmap.md` §2 (4a status)

- [ ] **Step 1: Make the edits.** Keep each doc's existing style. Copy the exact field tables from the spec; don't paraphrase them.
- [ ] **Step 2: Run** `pnpm lint; echo EXIT=$?` (markdown is not linted; this guards accidental code edits). Expected: EXIT=0.
- [ ] **Step 3: Commit** `docs(legal): phase 4a docs and spec updates`.

---

## After Task 20 (controller only)

The whole-branch review (`superpowers:requesting-code-review`) runs against spec §1–§9 and the Review Focus list. Then:
- full `pnpm typecheck`, `lint`, `test --run`, `build` and `e2e`;
- `superpowers:finishing-a-development-branch`.

Merging and pushing need the human's go-ahead.
