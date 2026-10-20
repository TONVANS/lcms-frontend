# LCMS Phase 3a — General Contract (GC) Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Model split (user requirement):** Opus = controller/reviewer, Sonnet = implementer + tester (`model: "sonnet"`).

**Goal:** Harden the shared components inherited from the PPA WIP, then deliver the GC module: a contract register with list/detail/create/edit/delete, attached files, role-based permissions, 60/30/7/0-day alerts, a dashboard and a support-contact channel. All of it runs on mock data.

**Architecture:**
- **Part 0 (Tasks 1–6)** fixes the 17 code findings in the PPA-WIP review. Item 18, the WIP plan doc, is folded into Task 1. GC then builds on correct primitives.
- **Part 1 (Tasks 7–19)** adds:
  - the role-based permission model;
  - two new shared inputs;
  - the GC feature (`src/features/gc`), following AGENT_GUIDE §5;
  - mock handlers that enforce permissions as a server would;
  - four routes under `/contracts`.

**Tech Stack:** Next.js 16.4 (App Router, `cacheComponents`), React 19.3, TypeScript strict, Tailwind v4, shadcn/ui (radix-nova), axios + axios-mock-adapter, zustand, react-hook-form + zod, @tanstack/react-table v9, date-fns, Vitest + Testing Library, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-20-phase3a-gc-design.md` (binding). It argues from `docs/superpowers/specs/2026-10-20-ppa-wip-review.md`. Implementers also follow `CLAUDE.md`, `docs/AGENT_GUIDE.md`, `Design.md` and `Frontend_LCMS_Project.md`.

**Base:** branch `phase-3a-gc`, HEAD includes 6beeff9 (PPA WIP) + fbea25c (spec).

## Global Constraints

- All of `CLAUDE.md` → Global Constraints applies.
  - Lao copy only in `src/lib/i18n/lo.ts`.
  - No `axios` outside `src/lib/api/**` and `src/features/*/api/**`.
  - Features import each other only via `index.ts`.
  - `cn` from `@/lib/utils/cn`.
  - CSS-only motion, opacity/transform only.
  - Numbers formatted with `Intl.NumberFormat('en-US')`; dates `dd/mm/yyyy`.
  - Icon-only buttons get a Lao `aria-label`.
  - Status is never shown by colour alone.
- Focus style on every interactive element: `focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)`.
- Design tokens over hex. A literal hex is allowed only where Design.md gives a value that has no token. Every surface must pass contrast (Design.md §9: text ≥ 4.5:1) in **both** themes.
- Never animate `width`/`height`/`box-shadow`/`backdrop-filter`. Bars use `origin-left animate-grow-x`.
- Gradient tokens (`--surface-modal`, `--primary-gradient`, `--gold-gradient`) are set with `bg-(image:--token)`, never with `bg-[var(--token)]`.
- Data is fetched on the client only (AGENT_GUIDE §6.1 gate 7).
- Every list store follows AGENT_GUIDE §5.2:
  - generation counter;
  - URL sync;
  - registered with `registerLogoutReset`;
  - ignores `ERR_CANCELED`.
- Write files with Write/Edit, never shell heredocs.
- Verify with real exit codes: `pnpm test --run; echo EXIT=$?`, then the same for `typecheck`, `lint` and `build` (build is required when routes or config change).
- Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Out of scope:
  - user-admin pages (Phase 3b);
  - early termination;
  - FX conversion;
  - audit history;
  - PPA feature rework. Do not "fix" PPA views except where a shared-API change forces it (Task 5).

## Review Focus

1. **Editing a contract that keeps its own contract number** must not return 409 "duplicate". The uniqueness check excludes the record itself. → Task 11 test.
2. **A hand-edited or stale URL** such as `?status=bogus&type=x&page=-3&pageSize=999&sort=evil` falls back to defaults without crashing. → Task 12 test.
3. **Deleting the only row on the last page** moves to the previous page instead of showing an empty table with "ສະແດງ 0 ຈາກ N". → Task 12 test.
4. **Clearing an optional value or equity during edit** sends `null` in the PATCH, so the server clears it. Omitting the key would leave the old value. → Task 10 test.
5. **A viewer opening `/contracts/new`, or calling a mutation directly**, is sent to `/forbidden`, or gets a 403 shown as `lo.errors.forbidden`. It never fails silently. → Task 11 + Task 16 tests.

---

## File Map

```
src/app/globals.css                         T1 (--text, chart/series tokens)
src/app/providers.tsx                       T1 (UiStoreHydrator)
src/stores/ui.store.ts                      T1
next.config.ts, src/app/(app)/{ppa,contracts,legal}/layout.tsx   T1 (remove instant)
docs/superpowers/plans/2026-10-20-lcms-phase2-ppa.md             T1 (mark unverified)
src/components/charts/{bar-list,stacked-status-bar,monthly-bars}.tsx  T2
src/components/shared/confirm-dialog.tsx, src/components/ui/dialog.tsx  T3
src/components/shared/{filter-chips,stepper,timeline}.tsx        T4
src/components/shared/data-table.tsx (+ ppa columns adapt)       T5
src/components/shared/{file-dropzone,file-list}.tsx, src/features/documents/**, src/lib/api/mock/handlers/documents.ts  T6
src/types/domain.ts, src/lib/auth/permissions.ts, src/components/guards/{can,permission-guard}.tsx, src/features/auth/mocks/auth.mock.ts  T7
src/components/shared/{date-picker,money-input}.tsx              T8
src/features/gc/{types.ts,lib/derive-status.ts,lib/alerts.ts,lib/term.ts}, lo.ts (gc section)  T9
src/features/gc/{schemas/gc.schema.ts,api/gc.service.ts}, src/lib/api/endpoints.ts   T10
src/features/gc/mocks/gc.mock.ts, src/lib/api/mock/handlers/{gc,alerts,home,documents}.ts, mock/index.ts  T11
src/features/gc/store/{gc-list.store.ts,gc-list-query.ts}, src/features/gc/hooks/use-gc-list-url-sync.ts  T12
src/features/gc/components/gc-contract-form-dialog.tsx            T13
src/features/gc/components/gc-contracts-view.tsx, app/(app)/contracts/list/page.tsx   T14
src/features/gc/components/gc-contract-detail-view.tsx, app/(app)/contracts/[id]/page.tsx  T15
src/features/gc/components/gc-wizard-view.tsx, app/(app)/contracts/new/page.tsx       T16
src/config/support.ts, src/components/layout/support-dialog.tsx, user-menu.tsx, src/features/gc/components/gc-dashboard-view.tsx, app/(app)/contracts/page.tsx  T17
src/features/gc/components/gc-alerts-view.tsx, app/(app)/contracts/alerts/page.tsx    T18
e2e/gc.spec.ts, e2e/responsive-a11y.spec.ts, e2e/dod-screenshots.spec.ts, e2e/rbac.spec.ts  T19
```

---

## Part 0 — Hardening the shared pieces (PPA-WIP review §1)

### Task 1: Tokens, UI-store hydration, config clean-up, WIP doc correction

**Files:**
- Modify: `src/app/globals.css`, `src/stores/ui.store.ts`, `src/app/providers.tsx`, `next.config.ts`, `src/app/(app)/{ppa,contracts,legal}/layout.tsx`, `docs/superpowers/plans/2026-10-20-lcms-phase2-ppa.md`
- Test: `src/stores/ui.store.test.ts`, `src/app/globals.test.ts` (new; reads the CSS file as text)

**Interfaces:**
- Produces:
  - CSS var `--text`: dark `#E8EEF9`, light `#0B1B3A`.
  - Categorical chart tokens:
    - `--chart-1..5`: dark `#5CC8FF #8B9CFF #D4B37A #C4B5FD #22D3EE`; light `#0369A1 #4338CA #8A6A2F #6D28D9 #0E7490`.
  - Module series stops (Design.md §7, same in both themes):
    - `--series-ppa-from:#2563EB; --series-ppa-to:#5CC8FF`
    - `--series-gc-from:#4F46E5; --series-gc-to:#8B9CFF`
    - `--series-legal-from:#9C7C45; --series-legal-to:#D4B37A`
    - `--series-litigation-from:#6D28D9; --series-litigation-to:#C4B5FD`
  - `UiStoreHydrator(): null`, a client component in `providers.tsx` that calls `useUiStore.persist.rehydrate()` inside `useEffect`.

- [ ] **Step 1: Write failing tests**

```ts
// globals.test.ts — import css via fs.readFileSync(path.resolve('src/app/globals.css'),'utf8')
it('defines --text in both themes', () => { expect(css).toMatch(/:root[^}]*--text:\s*#0B1B3A/i); expect(css).toMatch(/\.dark[^}]*--text:\s*#E8EEF9/i); });
it('chart tokens never reuse reserved status colours', () => {
  const reserved = ['#34D399','#059669','#60A5FA','#2563EB','#A78BFA','#7C3AED','#FBBF24','#FB7185','#E11D48','#94A3B8'];
  const charts = [...css.matchAll(/--chart-\d:\s*(#[0-9a-f]{6})/gi)].map(m => m[1].toUpperCase());
  expect(charts).toHaveLength(10); for (const c of charts) expect(reserved).not.toContain(c);
});
// ui.store.test.ts
it('does not rehydrate at module import', async () => { localStorage.setItem('lcms-ui', JSON.stringify({ state: { lastModule: 'gc' }, version: 0 })); vi.resetModules(); const { useUiStore } = await import('./ui.store'); expect(useUiStore.getState().lastModule).toBeNull(); });
```

- [ ] **Step 2:** Run `pnpm test --run src/app/globals.test.ts src/stores/ui.store.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add the tokens.
  - Remove the module-scope `rehydrate()` from `ui.store.ts`.
  - Mount `<UiStoreHydrator />` in `Providers`.
  - Delete `experimental.instantInsights` from `next.config.ts` and `export const instant = false` from the three module layouts (spec §10 ruling).
  - Prepend to the WIP plan doc a block quote: "**Unverified.** This document was written outside the reviewed process. Its 'COMPLETED & VERIFIED' and gate claims are incorrect; see `docs/superpowers/specs/2026-10-20-ppa-wip-review.md`." Do not rewrite the rest.
- [ ] **Step 4:** Run `pnpm test --run; pnpm typecheck; pnpm lint; pnpm build`, each with `echo EXIT=$?`. Expected: all 0.
- [ ] **Step 5:** Commit `fix: text and chart tokens, deferred ui-store hydration, drop instant config`.

### Task 2: Charts — tokens, transform-only motion, reduced motion, localized copy

**Files:**
- Modify: `src/components/charts/{bar-list,stacked-status-bar,monthly-bars}.tsx`, `src/lib/i18n/lo.ts` (key `charts.items`)
- Test: `src/components/charts/{bar-list,stacked-status-bar}.test.tsx`, `monthly-bars.test.tsx` (new)

**Interfaces:**
- Consumes: Task 1 series tokens.
- Produces:
  - `BarList` gets `accent?: 'ppa'|'gc'|'legal'|'litigation'`. The fill is `bg-linear-to-r from-(--series-<accent>-from) to-(--series-<accent>-to)`. The bar is `rounded-[4px]`, `style={{ width: pct% }}`, with no width transition. The fill wrapper has `origin-left animate-grow-x`.
  - `StackedStatusBar`: the same rule for motion. Its dots use the Design.md §2.5 colours for **both** themes (light dots `#059669 #2563EB #7C3AED #FBBF24 #E11D48 #94A3B8`). The bar container gets `role="img"` and `aria-label` = a summary built from lo labels and counts. The duplicate `TONE_COLOR`/`TONE_DOT` maps merge into one.
  - `MonthlyBars`:
    - the tooltip uses `bg-(image:--surface-modal)`;
    - the `ລາຍການ` literal becomes `lo.charts.items`;
    - `isAnimationActive={!prefersReducedMotion}` using `useSyncExternalStore` over `matchMedia('(prefers-reduced-motion: reduce)')`;
    - gradient ids come from `useId()`.

- [ ] **Step 1: Write failing tests**

```tsx
it('BarList fill has no width transition and uses grow-x', () => { render(<BarList data={[{key:'a',label:'A',value:5}]} accent="gc" />); const fill = screen.getByTestId('bar-fill-a'); expect(fill.className).not.toMatch(/transition-(all|\[width)/); expect(fill.parentElement!.className).toContain('animate-grow-x'); expect(fill.className).toContain('from-(--series-gc-from)'); });
it('StackedStatusBar exposes an accessible summary', () => { render(<StackedStatusBar data={[{status:'active',count:3},{status:'expired',count:1}]} />); expect(screen.getByRole('img')).toHaveAccessibleName(expect.stringContaining('ມີຜົນບັງຄັບໃຊ້ 3')); });
it('MonthlyBars disables animation under reduced motion', () => { mockMatchMedia(true); const { container } = render(<MonthlyBars data={[{month:'2026-01',value:2}]} />); expect(container.innerHTML).not.toContain('ລາຍການ'); /* + assert Bar received isAnimationActive=false via vi.mock('recharts') spy */ });
```

- [ ] **Step 2:** Run the three test files. Expected: FAIL.
- [ ] **Step 3: Implement.** Add `data-testid="bar-fill-<key>"` to the BarList fill element.
- [ ] **Step 4:** Run `pnpm test --run src/components/charts; pnpm typecheck; pnpm lint`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `fix: chart tokens, transform-only bars, reduced-motion recharts`.

### Task 3: Dialogs — ConfirmDialog behaviour and surface, localized close label

**Files:**
- Modify: `src/components/shared/confirm-dialog.tsx`, `src/components/ui/dialog.tsx:79`, `src/lib/i18n/lo.ts` (`common.close: 'ປິດ'`)
- Test: `src/components/shared/confirm-dialog.test.tsx`

**Interfaces:**
- Produces: `ConfirmDialog` keeps its props. Use role `dialog` (not `alertdialog`), so the tests and axe agree. `isLoading` is now optional, and an internal pending state covers the async case. Behaviour:
  - While `onConfirm()` is pending, the confirm button is disabled and shows a spinner.
  - Resolve → `onOpenChange(false)`.
  - Reject → the dialog stays open, and the error is not rethrown. The caller has already shown its own toast.
  - The panel uses `bg-(image:--surface-modal)` and `rounded-[26px]`.
  - The dialog close button's sr-only text is `lo.common.close`.

- [ ] **Step 1: Write failing tests**

```tsx
it('disables confirm while pending and closes on resolve', async () => { let resolve!: () => void; const onOpenChange = vi.fn(); render(<ConfirmDialog open onOpenChange={onOpenChange} onConfirm={() => new Promise<void>(r => (resolve = r))} />); await user.click(screen.getByRole('button', { name: lo.confirm.confirm })); expect(screen.getByRole('button', { name: lo.confirm.confirm })).toBeDisabled(); await user.click(screen.getByRole('button', { name: lo.confirm.confirm })); resolve(); await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false)); });
it('stays open when onConfirm rejects', async () => { const onOpenChange = vi.fn(); render(<ConfirmDialog open onOpenChange={onOpenChange} onConfirm={() => Promise.reject(new Error('x'))} />); await user.click(screen.getByRole('button', { name: lo.confirm.confirm })); await waitFor(() => expect(screen.getByRole('button', { name: lo.confirm.confirm })).toBeEnabled()); expect(onOpenChange).not.toHaveBeenCalledWith(false); });
it('close control is labelled in Lao', () => { render(<ConfirmDialog open onOpenChange={() => {}} onConfirm={() => {}} />); expect(screen.getByRole('button', { name: lo.common.close })).toBeInTheDocument(); });
it('panel uses the gradient as background-image', () => { render(<ConfirmDialog open onOpenChange={() => {}} onConfirm={() => {}} />); expect(screen.getByRole('dialog')).toHaveClass('bg-(image:--surface-modal)'); });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test --run src/components; pnpm typecheck; pnpm lint`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `fix: confirm dialog pending/reject handling, modal surface, lao close label`.

### Task 4: FilterChips, Stepper, Timeline a11y and tokens

**Files:**
- Modify: `src/components/shared/{filter-chips,stepper,timeline}.tsx`, `src/lib/i18n/lo.ts` (`stepper.nav: 'ຄວາມຄືບໜ້າ'`, `stepper.stepName(n,label,state)`, `timeline.status.{done,current,future}`)
- Test: the three existing test files

**Interfaces:**
- Produces:
  - **`FilterChips`**
    - Renders `<div role="group" aria-label={ariaLabel}>` containing `<button type="button" aria-pressed={selected}>` elements. `ariaLabel` becomes **required**.
    - Colours come from tokens (`text-(--gold)`, `text-(--gc)`, etc., which are already text-safe per theme), with the tint `bg-(--<accent>)/12` and border `border-(--<accent>)/30`.
    - `min-h-11`, `transition-[transform,opacity]`.
    - Accent union adds `'litigation'`.
  - **`Stepper`**
    - `aria-label={lo.stepper.nav}`.
    - Each step button's accessible name is `lo.stepper.stepName(n, label, state)` with state `'done'|'current'|'todo'`. Lao: `ຂັ້ນຕອນທີ ${n}: ${label} (${stateLabel})`, where stateLabel is `ສຳເລັດແລ້ວ` / `ປັດຈຸບັນ` / `ຍັງບໍ່ເຖິງ`.
    - The current step has `aria-current="step"`.
    - The light-theme connector uses `--gold-decor`.
  - **`Timeline`**
    - Renders `<ol>`/`<li>`.
    - Each item carries `<span className="sr-only">{lo.timeline.status[status]}</span>`, where the labels are `ສຳເລັດແລ້ວ`, `ປັດຈຸບັນ` and `ຈະມາເຖິງ`.
    - Raw palette classes become tokens.

- [ ] **Step 1: Write failing tests**

```tsx
it('FilterChips are toggle buttons in a labelled group', async () => { render(<FilterChips ariaLabel="ສະຖານະ" options={[{value:'a',label:'A'},{value:'b',label:'B'}]} value="a" onChange={onChange} />); expect(screen.getByRole('group', { name: 'ສະຖານະ' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true'); await user.click(screen.getByRole('button', { name: 'B' })); expect(onChange).toHaveBeenCalledWith('b'); expect(screen.queryByRole('radio')).toBeNull(); });
it('Stepper names steps with label and state', () => { render(<Stepper steps={[{id:1,label:'ໜຶ່ງ'},{id:2,label:'ສອງ'}]} currentStep={2} />); expect(screen.getByRole('navigation', { name: lo.stepper.nav })).toBeInTheDocument(); expect(screen.getByRole('button', { name: lo.stepper.stepName(2, 'ສອງ', 'current') })).toHaveAttribute('aria-current', 'step'); });
it('Timeline announces status in text', () => { render(<Timeline items={[{id:'1',title:'T',status:'done'}]} />); expect(screen.getByRole('listitem')).toHaveTextContent(lo.timeline.status.done); });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Implement.** Update the PPA callers of `FilterChips` so they pass `ariaLabel` (typecheck will flag each one).
- [ ] **Step 4:** Run `pnpm test --run src/components src/features; pnpm typecheck; pnpm lint`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `fix: accessible filter chips, stepper and timeline`.

### Task 5: DataTable on TanStack v9 core API, owned column type, sorting

**Files:**
- Modify: `src/components/shared/data-table.tsx`, `src/features/ppa/components/ppa-contracts-view.tsx` (column adapter only)
- Test: `src/components/shared/data-table.test.tsx`

**Interfaces:**
- Produces (the owned API; no TanStack types are exported):

```ts
export interface DataTableColumn<T> { id: string; header: string; cell: (row: T) => ReactNode; sortable?: boolean; align?: 'start' | 'end'; className?: string; }
export interface DataTableSort { id: string; order: 'asc' | 'desc' }
export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]; data: T[]; getRowId: (row: T) => string;
  total: number; page: number; pageSize: number; onPageChange: (page: number) => void;
  sort?: DataTableSort; onSortChange?: (sort: DataTableSort) => void;
  isLoading?: boolean; emptyTitle: string; emptyDescription?: string; emptyAction?: ReactNode;
  caption: string; // sr-only <caption>
}
```

- Internals:
  - Use the non-legacy TanStack v9 hook. Read `node_modules/@tanstack/react-table` and its v9 docs/types. **No** `useLegacyTable` or `Legacy*` imports.
  - Pagination and sorting are **manual**: the server does them.
- Behaviour:
  - A sortable header is a `<button>` inside `<th aria-sort="ascending|descending|none">`. Clicking toggles asc → desc → asc.
  - The footer reads `lo.common.showing(from–to, total)`, using the generic key. Widen its first parameter to `number | string` so a range can be passed, then delete the duplicate `table.showing` and update its users.
  - Pagination buttons are `size-11`, with Lao aria-labels.
  - Rows hover with `hover:bg-(--surface-inset)`.
  - The first 10 rows on initial load get `FadeIn variant="up-sm" index={i}`.

- [ ] **Step 1: Write failing tests**

```tsx
it('renders owned columns and sorts via aria-sort header', async () => { const onSortChange = vi.fn(); render(<DataTable caption="c" getRowId={r=>r.id} columns={[{id:'name',header:'ຊື່',cell:r=>r.name,sortable:true}]} data={[{id:'1',name:'A'}]} total={1} page={1} pageSize={10} onPageChange={()=>{}} sort={{id:'name',order:'asc'}} onSortChange={onSortChange} emptyTitle="e" />); expect(screen.getByRole('columnheader', { name: /ຊື່/ })).toHaveAttribute('aria-sort', 'ascending'); await user.click(screen.getByRole('button', { name: /ຊື່/ })); expect(onSortChange).toHaveBeenCalledWith({ id: 'name', order: 'desc' }); });
it('shows range and total in the footer', () => { render(/* 25 total, page 2, pageSize 10 */); expect(screen.getByText(lo.common.showing('11–20', 25))).toBeInTheDocument(); });
it('pagination buttons meet 44px and are labelled', () => { /* getByRole('button', {name: lo.table.next}) has class size-11 */ });
it('does not import legacy TanStack APIs', () => { const src = readFileSync('src/components/shared/data-table.tsx','utf8'); expect(src).not.toMatch(/Legacy/); });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Adapt the PPA view's column definitions to `DataTableColumn` with no behaviour change. If `lo.common.showing`'s signature differs from the call, change the call sites, not the key.
- [ ] **Step 4:** Run `pnpm test --run; pnpm typecheck; pnpm lint; pnpm build`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `refactor: data table on tanstack v9 core with owned columns and sorting`.

### Task 6: Files — FileDropzone, FileList, DocumentManager, documents mock

**Files:**
- Modify:
  - `src/components/shared/{file-dropzone,file-list}.tsx`
  - `src/features/documents/{api/documents.service.ts,components/document-manager.tsx,types.ts,index.ts}`
  - `src/lib/api/mock/handlers/documents.ts`
  - `src/lib/i18n/lo.ts` (`dropzone.tooLarge(name,max)`, `dropzone.badType(name)`, `dropzone.downloadFile(name)`, `dropzone.deleteFile(name)`, `documents.loadError`)
- Test: `file-dropzone.test.tsx`, `file-list.test.tsx` (new), `documents.service.test.ts`, `document-manager.test.tsx` (new)

**Interfaces:**
- Consumes: `ConfirmDialog` (Task 3), `toUserMessage`, `env.NEXT_PUBLIC_MAX_UPLOAD_MB`.
- Produces:
  - **`FileDropzone`**
    - `({ onFilesSelected(files: File[]), onReject?(messages: string[]), maxSizeMb = env.NEXT_PUBLIC_MAX_UPLOAD_MB, accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png', disabled })`.
    - It is a `<label>` wrapping an `sr-only` `<input type=file>`. There is no `role=button` wrapper and only one tab stop.
    - Files that are too large or of the wrong type are filtered out and reported through `onReject`, using the lo messages.
  - **`FileList`**
    - Tile colours are theme-aware and pass AA: light uses `#BE123C` (PDF) and `#1E40AF` (DOC) on their §2.5 light backgrounds; dark uses the §2.5 dark badge pairs.
    - Per-file aria-labels: `lo.dropzone.downloadFile(name)` and `lo.dropzone.deleteFile(name)`.
    - Buttons are `size-11`.
    - `formatBytes` clamps negatives to `0 B`.
  - **`documentsService`**
    - Adds `download(id: string): Promise<Blob>`, implemented as `api.get(endpoints.documents.download(id), { responseType: 'blob' })`.
  - **`DocumentManager`**
    - Props: `({ entityType, entityId, canUpload: boolean, canDownload: boolean, canDelete: boolean })`. These replace `readonly`.
    - Loading → skeleton. Load failure → `AlertBanner rose` with `toUserMessage(err)` and a retry button.
    - Download: `URL.createObjectURL(blob)` + a temporary `<a download={name}>` click, then revoke the URL.
    - Delete goes through `ConfirmDialog`.
    - Errors are toasted with `toUserMessage`.
  - The `features/documents` index stops exporting `MOCK_DOCUMENTS`.
  - `features/documents/types.ts` re-exports `DocumentFile` from `@/types/domain`, extended with `entityType`/`entityId`. Add those two fields to the domain type rather than keep a second type.
  - Mock handler:
    - anchored regexes: `/^\/documents$/` for list (with query params), `/^\/documents\/[^/]+$/` for delete, `/^\/documents\/[^/]+\/download$/` for download;
    - download returns `[200, new Blob([...], { type: mime })]`.

- [ ] **Step 1: Write failing tests**

```tsx
it('FileDropzone has a single focusable control and no nested interactive', () => { render(<FileDropzone onFilesSelected={vi.fn()} />); expect(screen.queryByRole('button')).toBeNull(); expect(document.querySelectorAll('input[type=file]')).toHaveLength(1); });
it('FileDropzone rejects oversize and wrong-type files', async () => { const onFiles = vi.fn(); const onReject = vi.fn(); render(<FileDropzone maxSizeMb={1} onFilesSelected={onFiles} onReject={onReject} />); const big = new File([new Uint8Array(2*1024*1024)], 'big.pdf', { type: 'application/pdf' }); const exe = new File(['x'], 'a.exe'); await user.upload(screen.getByLabelText(lo.dropzone.prompt), [big, exe], { applyAccept: false }); expect(onFiles).not.toHaveBeenCalled(); expect(onReject).toHaveBeenCalledWith([lo.dropzone.tooLarge('big.pdf', 1), lo.dropzone.badType('a.exe')]); });
it('FileList labels actions per file', () => { render(<FileList files={[{id:'1',name:'a.pdf',size:-5}]} onDownload={()=>{}} onDelete={()=>{}} />); expect(screen.getByRole('button', { name: lo.dropzone.downloadFile('a.pdf') })).toBeInTheDocument(); expect(screen.getByText('0 B')).toBeInTheDocument(); });
it('documents mock: list regex does not swallow download', async () => { const blob = await documentsService.download(seedId); expect(blob).toBeInstanceOf(Blob); });
it('DocumentManager shows error with retry on load failure', async () => { vi.spyOn(documentsService,'list').mockRejectedValueOnce({status:0,code:'NETWORK',message:''}); render(<DocumentManager entityType="gc" entityId="x" canUpload canDownload canDelete />); expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.network); });
it('DocumentManager hides download and delete without permission', async () => { render(<DocumentManager entityType="gc" entityId="x" canUpload={false} canDownload={false} canDelete={false} />); await screen.findByText(/\.pdf/); expect(screen.queryByRole('button', { name: /ດາວໂຫຼດ/ })).toBeNull(); });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Implement.** Update the PPA callers (`readonly` → the three flags, all `true` for now) so the PPA build keeps passing.
- [ ] **Step 4:** Run `pnpm test --run; pnpm typecheck; pnpm lint; pnpm build`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `fix: accessible dropzone with validation, AA file list, real download and error states`.

---

## Part 1 — General Contract module

### Task 7: Role-based permission model, `Can`, `PermissionGuard`, CNY

**Files:**
- Modify: `src/types/domain.ts`, `src/lib/auth/permissions.ts`, `src/features/auth/mocks/auth.mock.ts`, `src/lib/i18n/lo.ts` (`roles.{viewer,editor,main}`)
- Create: `src/lib/auth/roles.ts`, `src/components/guards/can.tsx`, `src/components/guards/permission-guard.tsx`
- Test: `src/lib/auth/permissions.test.ts`, `src/lib/auth/roles.test.ts`, `src/components/guards/{can,permission-guard}.test.tsx`

**Interfaces:**
- Produces:
  - Types:
    - `Permission = 'view'|'create'|'edit'|'delete'|'download'|'approve'`
    - `ModuleRole = 'viewer'|'editor'|'main'`
    - `User.moduleRoles: Partial<Record<ModuleKey, ModuleRole>>` replaces `User.permissions`, which is removed.
    - `Money.currency: 'LAK'|'USD'|'THB'|'CNY'`
  - `ROLE_PERMISSIONS: Record<ModuleRole, readonly Permission[]>`:
    - viewer: `['view']`
    - editor: `['view','create','edit','delete']`
    - main: `['view','create','edit','delete','download']`
  - `getModuleRole(u: User, m: ModuleKey): ModuleRole | null`. Returns null when there is no access; `'viewer'` when the user has access but no role. Admin also returns `'main'`.
  - `hasPermission(u, m, p)`: same signature. Admin → true. Otherwise the user must have access, and `ROLE_PERMISSIONS[role]` must include `p`.
  - `useCan(module: ModuleKey, permission: Permission): boolean` reads `useAuthStore`. `<Can module permission fallback?>{children}</Can>`.
  - `<PermissionGuard module permission>{children}</PermissionGuard>`: no permission → `router.replace('/forbidden')` and renders null. Same pattern as `ModuleGuard`.
  - Mock users (password `password`):
    - `admin`: unchanged
    - `gc.user`: `moduleRoles: { gc: 'main' }`
    - **new** `gc.editor`: modules `['gc']`, `{ gc: 'editor' }`
    - **new** `gc.viewer`: modules `['gc']`, `{ gc: 'viewer' }`
    - `multi.user`: `{ ppa: 'viewer', gc: 'editor' }`
    - `ppa.user`: `{ ppa: 'main' }`
    - `legal.user`: `{ legal: 'main' }`
    - `none.user`: `{}`
    - Lao names for the new users follow the existing style.

- [ ] **Step 1: Write failing tests**

```ts
expect(ROLE_PERMISSIONS.editor).not.toContain('download');
expect(hasPermission(gcViewer, 'gc', 'edit')).toBe(false);
expect(hasPermission(gcEditor, 'gc', 'delete')).toBe(true);
expect(hasPermission(gcEditor, 'gc', 'download')).toBe(false);
expect(hasPermission(gcMain, 'gc', 'download')).toBe(true);
expect(hasPermission(gcMain, 'ppa', 'view')).toBe(false);
expect(hasPermission({ ...gcViewer, moduleRoles: {} }, 'gc', 'view')).toBe(true);   // access, no role → viewer
expect(hasPermission(admin, 'legal', 'download')).toBe(true);
expect(getModuleRole(multi, 'gc')).toBe('editor');
// can.test.tsx
it('hides children without permission', () => { useAuthStore.setState({ user: gcViewer, status: 'authenticated' }); render(<Can module="gc" permission="edit"><button>e</button></Can>); expect(screen.queryByRole('button')).toBeNull(); });
// permission-guard.test.tsx
it('redirects to /forbidden', () => { /* gcViewer, permission create → replace('/forbidden'), children absent */ });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Implement.** Fix every compile error the removed `permissions` field causes; grep shows no use outside `permissions.ts` and tests.
- [ ] **Step 4:** Run `pnpm test --run; pnpm typecheck; pnpm lint`. Expected: EXIT 0. Existing e2e users keep their landing routes.
- [ ] **Step 5:** Commit `feat: module roles with download permission, Can and PermissionGuard`.

### Task 8: DatePicker and MoneyInput

**Files:**
- Create: `src/components/shared/date-picker.tsx`, `src/components/shared/money-input.tsx`
- Modify: `src/lib/i18n/lo.ts` (`datePicker.{open,clear,placeholder}`, `currency.{LAK:'ກີບ',USD:'USD',CNY:'ຢວນ',THB:'ບາດ'}`, `money.amount`)
- Test: `date-picker.test.tsx`, `money-input.test.tsx`

**Interfaces:**
- Consumes: shadcn `Popover` + `Calendar`, and `formatDate`, `LAO_MONTHS_SHORT`, `LAO_WEEKDAYS` from `@/lib/utils/date`.
- Produces:
  - **`DatePicker`**
    - `({ id: string; value: string | null; onChange(v: string | null): void; min?: string; max?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string; clearable?: boolean })`.
    - The trigger is a button that shows `formatDate(value)`, or `lo.datePicker.placeholder` when there is no value.
    - The calendar is Monday-first, with Lao month and weekday labels.
    - Today has a gold outline and the selected day the primary gradient (Design.md §6 Calendar).
    - It emits `YYYY-MM-DD` built from local date parts, **never** `toISOString()`.
  - **`MoneyInput`**
    - `({ id: string; value: Money | null; onChange(v: Money | null): void; currencies: Money['currency'][]; 'aria-invalid'?; 'aria-describedby'? })`.
    - The amount field is a text input with `inputMode="decimal"`. It displays comma grouping, parses `1,200,000.5` to `1200000.5`, and treats an empty string as `null`. The currency select sits next to it.

- [ ] **Step 1: Write failing tests**

```tsx
it('DatePicker emits local YYYY-MM-DD and shows dd/mm/yyyy', async () => { /* pick day 5 in a month view of 2026-03 → onChange('2026-03-05'); rerender value '2026-03-05' → trigger text '05/03/2026' */ });
it('DatePicker shows Lao weekdays Monday-first', async () => { /* open → first columnheader text 'ຈ' */ });
it('DatePicker clear emits null', async () => { /* clearable → click lo.datePicker.clear → onChange(null) */ });
it('MoneyInput parses grouped input and keeps currency', async () => { const onChange = vi.fn(); render(<MoneyInput id="v" value={null} onChange={onChange} currencies={['LAK','USD','CNY']} />); await user.type(screen.getByRole('textbox'), '1,200,000.5'); expect(onChange).toHaveBeenLastCalledWith({ amount: 1200000.5, currency: 'LAK' }); });
it('MoneyInput empty amount emits null', async () => { /* clear → onChange(null) */ });
it('MoneyInput offers only the given currencies with Lao labels', () => { /* options ກີບ, USD, ຢວນ; no ບາດ */ });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test --run src/components/shared; pnpm typecheck; pnpm lint`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `feat: lao date picker and money input`.

### Task 9: GC domain — types, Lao copy, derived status, alerts, term suggestion

**Files:**
- Create: `src/features/gc/types.ts`, `src/features/gc/lib/{derive-status.ts,alerts.ts,term.ts}`, `src/features/gc/index.ts`
- Modify: `src/lib/i18n/lo.ts` (`gc` section)
- Test: `src/features/gc/lib/{derive-status,alerts,term}.test.ts`

**Interfaces:**
- Produces:
  - Types:
    - `GC_CONTRACT_TYPES` is a readonly tuple of the 14 keys, in spec §2.2 order: `om_service, equipment_lease, land_lease, epc, pole_attachment, bill_collection, opgw_lease, current_deposit, edl_app_payment, cooperation, shareholding, pta, moa, other_assigned`. `GcContractType = typeof GC_CONTRACT_TYPES[number]`.
    - `GcStatus = 'pending'|'active'|'expiring'|'expired'`, with `GC_STATUSES` in that order.
    - `GcEquity = { kind: 'percent'; percent: number } | { kind: 'amount'; money: Money }`.
    - `GeneralContract`, per spec §2.1:
      - `id`, `title`, `type`, `contractNo`
      - `counterparty: string | null`, `termText: string | null`
      - `signedDate`, `effectiveDate`, `endDate: string | null`
      - `value: Money | null`, `equity: GcEquity | null`
      - `implementer: string | null`, `notes: string | null`
      - `createdAt`, `updatedAt`, `createdBy`
    - `GC_CURRENCIES = ['LAK','USD','CNY'] as const`.
  - `deriveGcStatus(c: Pick<GeneralContract,'effectiveDate'|'endDate'>, today?: Date): GcStatus`. Rules from spec §2.3, with `GC_EXPIRING_DAYS = 60`.
  - `GC_STATUS_TONE: Record<GcStatus, StatusTone>`: pending blue, active emerald, expiring amber, expired rose.
  - `GC_ALERT_DAYS = [60, 30, 7, 0] as const`.
  - `buildGcAlerts(contracts: GeneralContract[], today?: Date): Alert[]` generates **one alert per contract, for the latest window it has crossed** (ruling: one row per contract keeps the bell and the list readable):
    - `window = min{w ∈ GC_ALERT_DAYS : w ≥ daysLeft}` for `-30 ≤ daysLeft ≤ 60`.
    - Overdue contracts (−30..−1) get window `0`. Anything older than −30, and open-ended contracts, get nothing.
    - `id = gc-${c.id}-w${window}`, `module 'gc'`, `entityType 'gc-contract'`, `entityId = c.id`, `title = c.title`, `dueDate = c.endDate`, `daysLeft`, `read: false`.
  - `suggestTermText(effective: string, end: string): string`. Lao: `${y} ປີ`, `${m} ເດືອນ`, joined by a space, zero parts omitted. Under 1 month it gives `${d} ມື້`. Calendar-accurate, using `date-fns` `intervalToDuration`.
  - `lo.gc` holds the exact copy below. Copy not listed is drafted by the implementer and listed in the report.

```ts
gc: {
  types: { om_service:'ສັນຍາ ບໍລິການ O&M', equipment_lease:'ສັນຍາ ເຊົ່າອຸປະກອນພາກສະຖານີ-ສາຍສົ່ງ', land_lease:'ສັນຍາ ເຊົ່າພື້ນທີ່ດິນ', epc:'ສັນຍາ ຮັບເໝົາກໍ່ສ້າງ (EPC)', pole_attachment:'ສັນຍາ ບໍລິການເກາະຫ້ອຍ', bill_collection:'ສັນຍາບໍລິການ ຮັບຊຳລະຄ່າກະແສໄຟຟ້າ', opgw_lease:'ສັນຍາ ບໍລິການເຊົ່າສາຍ OPGW', current_deposit:'ສັນຍາ ບໍລິການເງິນຝາກກະແສລາຍວັນ', edl_app_payment:'ສັນຍາບໍລິການນຳໃຊ້ຜະລິດຕະພັນຊຳລະເງິນ ຂອງ ທະນາຄານ ໃນ EDL App', cooperation:'ສັນຍາຮ່ວມມື ແລະ ສັນຍາຮ່ວມທຸລະກິດ', shareholding:'ສັນຍາຮ່ວມຫຸ້ນ', pta:'ສັນຍາບໍລິການຜ່ານສາຍສົ່ງ (PTA)', moa:'ບົດບັນທຶກຂໍ້ຕົກລົງ (MOA)', other_assigned:'ສັນຍາອື່ນໆ ທີ່ຖືກມອບໝາຍໂດຍກົງ' },
  fields: { title:'ຊື່ສັນຍາ', type:'ປະເພດສັນຍາ', contractNo:'ເລກທີ', counterparty:'ຄູ່ສັນຍາ', termText:'ອາຍຸສັນຍາ', signedDate:'ມື້ລົງລາຍເຊັນ', effectiveDate:'ມື້ມີຜົນບັງຄັບໃຊ້', endDate:'ມື້ສິ້ນສຸດ', value:'ມູນຄ່າ', equity:'ສັດສ່ວນຫຸ້ນ ຫຼື ຈຳນວນເງິນປະກອບທຶນ', implementer:'ຜູ້ຈັດຕັ້ງປະຕິບັດ', notes:'ລາຍລະອຽດເພີ່ມເຕີມ', documents:'ເອກະສານແນບ' },
  status: { pending:'ລໍຖ້າມີຜົນ', active:'ມີຜົນບັງຄັບໃຊ້', expiring:'ໃກ້ໝົດອາຍຸ', expired:'ໝົດອາຍຸ' },
  openEnded: 'ບໍ່ມີກຳນົດ',
  term: { years: (n: number) => `${n} ປີ`, months: (n: number) => `${n} ເດືອນ`, days: (n: number) => `${n} ມື້` },
  wizard: { step1:'ຂໍ້ມູນທົ່ວໄປ', step2:'ວັນທີ', step3:'ມູນຄ່າ ແລະ ຫຸ້ນ', step4:'ເອກະສານ ແລະ ກວດສອບ' },
  equityKind: { percent:'ສັດສ່ວນຫຸ້ນ (%)', amount:'ຈຳນວນເງິນປະກອບທຶນ' },
}
```

- [ ] **Step 1: Write failing tests** (`today = new Date(2026, 9, 20)`)

```ts
expect(deriveGcStatus({ effectiveDate: '2026-11-01', endDate: '2027-11-01' }, today)).toBe('pending');
expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: '2026-12-20' }, today)).toBe('active');    // +61
expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: '2026-12-19' }, today)).toBe('expiring');  // +60
expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: '2026-10-20' }, today)).toBe('expiring');  // 0
expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: '2026-10-19' }, today)).toBe('expired');   // -1
expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: null }, today)).toBe('active');
const a = (end: string | null) => buildGcAlerts([mk({ id: 'x', endDate: end })], today);
expect(a('2026-12-19').map(x => x.id)).toEqual(['gc-x-w60']);
expect(a('2026-11-19').map(x => x.id)).toEqual(['gc-x-w30']);   // +30
expect(a('2026-10-27').map(x => x.id)).toEqual(['gc-x-w7']);    // +7
expect(a('2026-10-20').map(x => x.id)).toEqual(['gc-x-w0']);
expect(a('2026-10-10').map(x => x.id)).toEqual(['gc-x-w0']);    // -10 overdue
expect(a('2026-09-19')).toEqual([]);                             // -31
expect(a('2026-12-20')).toEqual([]);                             // +61
expect(a(null)).toEqual([]);
expect(suggestTermText('2026-01-01', '2031-01-01')).toBe('5 ປີ');
expect(suggestTermText('2026-01-01', '2027-04-01')).toBe('1 ປີ 3 ເດືອນ');
expect(suggestTermText('2026-01-01', '2026-01-21')).toBe('20 ມື້');
expect(Object.keys(lo.gc.types)).toEqual([...GC_CONTRACT_TYPES]);
```

- [ ] **Step 2:** Run `pnpm test --run src/features/gc`. Expected: FAIL.
- [ ] **Step 3:** Implement. `daysLeft` from `@/lib/utils/date` is the only day arithmetic.
- [ ] **Step 4:** Run `pnpm test --run src/features/gc; pnpm typecheck; pnpm lint`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `feat(gc): domain types, lao copy, derived status, alerts and term suggestion`.

### Task 10: GC schema, payload mapping, endpoints, service

**Files:**
- Create: `src/features/gc/schemas/gc.schema.ts`, `src/features/gc/api/gc.service.ts`
- Modify: `src/lib/api/endpoints.ts`, `src/features/gc/index.ts`, `src/lib/i18n/lo.ts` (`gc.validation.*`, `gc.errors.duplicateNo`)
- Test: `src/features/gc/schemas/gc.schema.test.ts`, `src/features/gc/api/gc.service.test.ts`

**Interfaces:**
- Consumes: Task 9 types.
- Produces:
  - `endpoints.gc = { list: '/contracts', detail: (id) => `/contracts/${id}`, dashboard: '/contracts/dashboard' }`.
  - `gcFormSchema` (zod). Form values:
    - `title`, `type`, `contractNo` as strings
    - `counterparty`, `termText`, `implementer`, `notes` as strings (`''` allowed)
    - `signedDate`, `effectiveDate` as `string` (required)
    - `endDate: string | null`
    - `value: Money | null`
    - `equity: GcEquity | null`
  - Rules, each with a Lao message from `lo.gc.validation`:
    - required fields
    - title ≤ 300 characters
    - notes ≤ 2000 characters
    - `endDate > effectiveDate` when present (the error goes on `endDate`)
    - `value.amount > 0`
    - `0 < percent ≤ 100`
    - `equity.money.amount > 0`
    - currency ∈ `GC_CURRENCIES`
  - `GcFormValues = z.infer<typeof gcFormSchema>`. `emptyGcForm(): GcFormValues` returns `type: 'om_service'`, empty strings, and nulls.
  - `toGcPayload(v: GcFormValues): GcContractInput`. Trims strings, turns `''` into `null`, and **always includes** the optional keys, using `null` when cleared.
  - `fromGcContract(c: GeneralContract): GcFormValues` turns nulls into `''` for text inputs.
  - `GcContractInput` = `GeneralContract` without `id`/`createdAt`/`updatedAt`/`createdBy`.
  - `GcListQuery extends ListQuery`:
    - `{ type?: GcContractType; status?: GcStatus; sort?: 'endDate'|'signedDate'|'title'; order?: 'asc'|'desc' }`
  - `GcDashboard`:
    - `total: number`
    - `byStatus: Record<GcStatus, number>`
    - `byType: { type: GcContractType; count: number }[]`
    - `valueTotals: { currency: 'LAK'|'USD'|'CNY'; amount: number; count: number }[]`
    - `upcoming: GeneralContract[]` (endDate in 0..90, ascending, ≤ 10)
  - `gcService`:
    - `list(q): Promise<Paginated<GeneralContract>>`
    - `get(id)`
    - `create(body: GcContractInput)`
    - `update(id, body: GcContractInput)`, which is a PATCH with the full payload
    - `remove(id): Promise<void>`
    - `dashboard(): Promise<GcDashboard>`

- [ ] **Step 1: Write failing tests**

```ts
const base = { ...emptyGcForm(), title: 'T', contractNo: 'GC-1', signedDate: '2026-01-01', effectiveDate: '2026-01-02' };
expect(gcFormSchema.safeParse(base).success).toBe(true);
expect(issuePath(gcFormSchema.safeParse({ ...base, endDate: '2026-01-02' }))).toEqual(['endDate']);
expect(gcFormSchema.safeParse({ ...base, equity: { kind: 'percent', percent: 101 } }).success).toBe(false);
expect(gcFormSchema.safeParse({ ...base, equity: { kind: 'percent', percent: 100 } }).success).toBe(true);
expect(gcFormSchema.safeParse({ ...base, value: { amount: 5, currency: 'THB' } }).success).toBe(false);
// Review Focus 4 — cleared optionals are explicit nulls
const p = toGcPayload({ ...base, counterparty: '  ', value: null, equity: null, endDate: null });
expect(p).toMatchObject({ counterparty: null, value: null, equity: null, endDate: null });
expect(Object.keys(p)).toEqual(expect.arrayContaining(['value', 'equity', 'endDate', 'counterparty', 'termText', 'implementer', 'notes']));
expect(fromGcContract(toContract(p))).toMatchObject({ counterparty: '', notes: '' });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. The service follows the existing `ppa.service.ts` call shape.
- [ ] **Step 4:** Run `pnpm test --run src/features/gc; pnpm typecheck; pnpm lint`. Expected: EXIT 0. The service tests run in Task 11, once the mocks exist; here assert only the URL builders.
- [ ] **Step 5:** Commit `feat(gc): form schema, payload mapping, endpoints and service`.

### Task 11: GC mock data and handlers; alerts, home and documents integration

**Files:**
- Create: `src/features/gc/mocks/gc.mock.ts`, `src/lib/api/mock/handlers/gc.ts`
- Modify:
  - `src/lib/api/mock/index.ts` (register gc **before** the generic handlers)
  - `src/lib/api/mock/handlers/{alerts,home,documents}.ts`
  - `src/features/alerts/mocks/alerts.mock.ts` (remove the static gc entries)
  - `src/features/documents/mocks/documents.mock.ts` (seed 1–2 files on a few gc contracts)
- Create: `src/lib/api/mock/session.ts` (shared `getMockSessionUser(): User | null`, replacing the copies in the handlers)
- Test: `src/lib/api/mock/handlers/gc.test.ts`, `src/features/gc/mocks/gc.mock.test.ts`, `src/lib/api/mock/handlers/documents.test.ts`

**Interfaces:**
- Consumes: Tasks 7, 9, 10.
- Produces:
  - `gcMockDb`:
    - `{ all(): GeneralContract[]; get(id): GeneralContract | undefined; insert(input, by: string): GeneralContract; update(id, input): GeneralContract; remove(id): void; reset(today?: Date): void }`
    - Seeded by `createGcSeed(today)` with **exactly 42** contracts, 3 per type. Dates are relative to `today`. The seed covers:
      - ≥ 3 pending
      - ≥ 6 expiring, at end offsets 0, 3, 7, 25, 45 and 60
      - ≥ 5 expired, at end offsets −1, −10, −25, −40 and −200
      - ≥ 3 open-ended
      - all three currencies
      - ≥ 4 with no value
      - equity percent on `shareholding`, equity amount on `cooperation`
  - Handlers (all under `/contracts`):
    - **Permissions.** Each request resolves `getMockSessionUser()`. No user → **401**. Each route requires its permission through `hasPermission(u, 'gc', p)`, otherwise **403** `{ code: 'FORBIDDEN' }`:
      - GET → `view`
      - POST → `create`
      - PATCH → `edit`
      - DELETE → `delete`
    - **`GET /contracts/dashboard`** is registered **before** the detail route. It computes `GcDashboard` from `gcMockDb.all()`.
    - **`GET /contracts`**:
      - server-side `q` (case-insensitive substring over title, contractNo and counterparty)
      - `type` and `status` filters (derived status); unknown values are ignored
      - sort by `sort`/`order` (default `endDate asc`, nulls last)
      - pagination with `page ≥ 1` and `pageSize ∈ {10,20,50}`, else 10
      - returns `Paginated`
    - **`POST /contracts`** and **`PATCH /contracts/:id`**: a duplicate `contractNo` (case-insensitive, **excluding the record itself**) → **409** `{ code: 'DUPLICATE_CONTRACT_NO', message: '', fieldErrors: { contractNo: 'DUPLICATE_CONTRACT_NO' } }`.
    - **Unknown id** → 404.
  - Integration:
    - The alerts handler returns `buildGcAlerts(gcMockDb.all())` for gc. Read state persists in its existing in-memory read set, keyed by alert id.
    - The home handler computes gc `ModuleStats` from `gcMockDb`: `total` = all, `active` = active + expiring, `expiring` = expiring.
    - The documents handler maps `entityType` to a module (`'gc'` or `'gc-contract'` → `gc`; anything starting with `ppa` → `ppa`). It then enforces:
      - list → `view`
      - upload → `create`
      - delete → `delete`
      - download → **`download`**
      Each failure returns 403.

- [ ] **Step 1: Write failing tests** (they use the real `api` with mocks; `setMockSession(user)`, `gcMockDb.reset(today)` in `beforeEach`)

```ts
it('seed covers every type, status and currency', () => { const all = createGcSeed(today); expect(all).toHaveLength(42); for (const t of GC_CONTRACT_TYPES) expect(all.filter(c => c.type === t)).toHaveLength(3); expect(new Set(all.map(c => deriveGcStatus(c, today)))).toEqual(new Set(GC_STATUSES)); expect(new Set(all.flatMap(c => c.value ? [c.value.currency] : []))).toEqual(new Set(['LAK','USD','CNY'])); expect(all.filter(c => c.endDate === null).length).toBeGreaterThanOrEqual(3); });
it('list filters, sorts and paginates on the server', async () => { setMockSession('gc.viewer', false); const r = await gcService.list({ status: 'expiring', page: 1, pageSize: 10 }); expect(r.items.every(c => deriveGcStatus(c) === 'expiring')).toBe(true); expect(r.total).toBe(r.items.length); const endDates = r.items.map(c => c.endDate); expect(endDates).toEqual([...endDates].sort()); });
it('ignores invalid query values', async () => { const r = await gcService.list({ status: 'bogus' as never, pageSize: 999, page: -2 }); expect(r.pageSize).toBe(10); expect(r.page).toBe(1); });
it('viewer gets 403 on create; editor succeeds', async () => { setMockSession('gc.viewer', false); await expect(gcService.create(input)).rejects.toMatchObject({ status: 403 }); setMockSession('gc.editor', false); await expect(gcService.create(input)).resolves.toMatchObject({ contractNo: input.contractNo }); });
it('duplicate contractNo → 409 with field error; editing self keeps own number (Review Focus 1)', async () => { setMockSession('gc.editor', false); const [first, second] = gcMockDb.all(); await expect(gcService.update(second.id, { ...toInput(second), contractNo: first.contractNo.toLowerCase() })).rejects.toMatchObject({ status: 409, fieldErrors: { contractNo: 'DUPLICATE_CONTRACT_NO' } }); await expect(gcService.update(first.id, toInput(first))).resolves.toMatchObject({ id: first.id }); });
it('PATCH with null clears value', async () => { /* contract with value → update(..., value: null) → get(id).value === null */ });
it('dashboard route is not captured by detail', async () => { const d = await gcService.dashboard(); expect(d.total).toBe(42); });
it('download needs the download permission', async () => { setMockSession('gc.editor', false); await expect(documentsService.download(gcDocId)).rejects.toMatchObject({ status: 403 }); setMockSession('gc.user', false); await expect(documentsService.download(gcDocId)).resolves.toBeInstanceOf(Blob); });
it('alerts include generated gc alerts', async () => { setMockSession('gc.user', false); const alerts = await alertsService.list({ module: 'gc' }); expect(alerts.some(a => a.id.endsWith('-w60'))).toBe(true); });
```

- [ ] **Step 2:** Run `pnpm test --run src/lib/api/mock src/features/gc`. Expected: FAIL.
- [ ] **Step 3:** Implement. Anchor every regex (`/^\/contracts\/[^/]+$/`). Read query params from `config.params`.
- [ ] **Step 4:** Run `pnpm test --run; pnpm typecheck; pnpm lint`. Expected: EXIT 0. The existing Home tests that expected gc numbers are updated to the computed values; show the arithmetic in the report.
- [ ] **Step 5:** Commit `feat(gc): mock register with server-side filtering and permission enforcement`.

### Task 12: GC list store and URL sync

**Files:**
- Create: `src/features/gc/store/gc-list-query.ts`, `src/features/gc/store/gc-list.store.ts`, `src/features/gc/hooks/use-gc-list-url-sync.ts`
- Test: `src/features/gc/store/{gc-list-query,gc-list.store}.test.ts`

**Interfaces:**
- Consumes: `gcService.list`, `registerLogoutReset`, `normalizeError`.
- Produces:
  - Query shape: `DEFAULT_GC_QUERY: Required<Pick<GcListQuery,'page'|'pageSize'|'sort'|'order'>> & GcListQuery = { page: 1, pageSize: 10, sort: 'endDate', order: 'asc' }`.
  - `parseGcListQuery(sp: URLSearchParams): GcListQuery`. Every invalid value falls back to its default or is dropped.
  - `serializeGcListQuery(q: GcListQuery): string` omits defaults and returns `''` for the default query.
  - `useGcListStore` state:
    - `query`, `items: GeneralContract[]`, `total`
    - `status: 'idle'|'loading'|'ready'|'error'`, `error: ApiError | null`
  - `useGcListStore` actions:
    - `setQuery(patch: Partial<GcListQuery>)`. Any patch without `page` resets `page` to 1.
    - `fetch(): Promise<void>`. Uses the generation counter and ignores `ERR_CANCELED`.
    - `afterDelete(): Promise<void>`. Refetches. If `items` is then empty and `page > 1`, it moves to `page - 1` and fetches again.
    - `reset()`.
  - The store is registered with `registerLogoutReset` at module scope.
  - `useGcListUrlSync(): void` is a client hook:
    - On mount: `setQuery(parseGcListQuery(useSearchParams()))`.
    - On every query change: `router.replace(pathname + (s ? `?${s}` : ''), { scroll: false })`.
    - On every query change: calls `fetch()`.

- [ ] **Step 1: Write failing tests**

```ts
// Review Focus 2
expect(parseGcListQuery(new URLSearchParams('status=bogus&type=x&page=-3&pageSize=999&sort=evil&order=up'))).toEqual(DEFAULT_GC_QUERY);
expect(parseGcListQuery(new URLSearchParams('q=edl&type=epc&status=expired&page=2&pageSize=20&sort=title&order=desc'))).toEqual({ q: 'edl', type: 'epc', status: 'expired', page: 2, pageSize: 20, sort: 'title', order: 'desc' });
expect(serializeGcListQuery(DEFAULT_GC_QUERY)).toBe('');
expect(serializeGcListQuery({ ...DEFAULT_GC_QUERY, status: 'expiring' })).toBe('status=expiring');
it('setQuery resets page unless given', () => { s.setQuery({ page: 3 }); s.setQuery({ q: 'x' }); expect(s.getState().query.page).toBe(1); });
it('drops a stale response after reset', async () => { /* deferred list; fetch(); reset(); resolve → items [] */ });
// Review Focus 3
it('afterDelete steps back when the last page empties', async () => { /* mock list: page 3 → empty, page 2 → 10 items; query.page=3; afterDelete → query.page 2, items length 10 */ });
it('is cleared by logout resets', () => { s.setState({ items: [x] }); runLogoutResets(); expect(s.getState().items).toEqual([]); });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test --run src/features/gc; pnpm typecheck; pnpm lint`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `feat(gc): list store with url sync, generation counter and logout reset`.

### Task 13: GC contract form dialog (create and edit)

**Files:**
- Create: `src/features/gc/components/gc-contract-form-fields.tsx` (field groups, reused by the wizard) and `src/features/gc/components/gc-contract-form-dialog.tsx`
- Modify: `src/lib/i18n/lo.ts` (`gc.form.{createTitle,editTitle,save,saved,suggestTerm,useSuggestion,requiredHint}`)
- Test: `src/features/gc/components/gc-contract-form-dialog.test.tsx`

**Interfaces:**
- Consumes: `gcFormSchema`, `emptyGcForm`, `toGcPayload`, `fromGcContract`, `gcService`, `DatePicker`, `MoneyInput`, shadcn `Dialog`/`Select`/`Input`/`Textarea`/`RadioGroup`, `toUserMessage`.
- Produces:
  - **`GcFormFieldGroup`**: `({ group: 'general'|'dates'|'money'|'notes', form: UseFormReturn<GcFormValues> })`. It renders the fields of one wizard step.
  - **Equity** UI: a radio group, ໍບໍ່ມີ / % / amount. "None" sets `equity: null`.
  - **Term suggestion** appears once both dates are valid. It reads `lo.gc.form.suggestTerm(text)` and has a "ໃຊ້" button that sets `termText`.
  - **`GcContractFormDialog`**: `({ open, onOpenChange, contract?: GeneralContract, onSaved(c: GeneralContract): void })`.
    - Create when `contract` is absent; edit otherwise.
    - The dialog is `max-w-[780px]`, `rounded-[26px]`, `bg-(image:--surface-modal)`. The body is a grid of `auto-fit minmax(240px,1fr)` (Design.md §6 modal).
    - The footer has Cancel (ghost) and Save (primary).
    - Required markers are a gold `*`.
  - **Errors:**
    - A 409 with `fieldErrors.contractNo === 'DUPLICATE_CONTRACT_NO'` → `setError('contractNo', { message: lo.gc.errors.duplicateNo })`.
    - Other `fieldErrors` keys that match form fields get the server message.
    - Anything else → a rose AlertBanner inside the dialog showing `toUserMessage`.
  - **Success** → a toast `lo.gc.form.saved`, then `onSaved`, then close.

- [ ] **Step 1: Write failing tests** (with real mocks, session `gc.editor`)

```tsx
it('shows Lao required errors', async () => { /* open create, click save → lo.gc.validation.required under title & contractNo */ });
it('maps duplicate contractNo to the field', async () => { /* type existing number → save → text lo.gc.errors.duplicateNo near contractNo input (aria-describedby) */ });
it('rejects end date before effective date', async () => { /* dates 2026-05-01 / 2026-04-01 → error on endDate */ });
it('offers a term suggestion and applies it', async () => { /* effective 2026-01-01, end 2031-01-01 → click useSuggestion → termText value '5 ປີ' */ });
it('edit prefills and saving with cleared value sends null', async () => { const spy = vi.spyOn(gcService, 'update'); /* open with contract having value; clear amount; save */ expect(spy.mock.calls[0][1]).toMatchObject({ value: null }); });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Use `useWatch`, not `watch()`, to avoid the `react-hooks/incompatible-library` lint warning.
- [ ] **Step 4:** Run `pnpm test --run src/features/gc; pnpm typecheck; pnpm lint`. Expected: EXIT 0 and no new lint warnings.
- [ ] **Step 5:** Commit `feat(gc): contract form dialog with server error mapping`.

### Task 14: Contracts list page `/contracts/list`

**Files:**
- Create: `src/features/gc/components/gc-contracts-view.tsx`, `src/app/(app)/contracts/list/page.tsx`
- Modify: `src/lib/i18n/lo.ts` (`gc.list.{title,searchLabel,typeFilter,allTypes,create,openWizard,edit,delete,deleted,deleteTitle,deleteDesc(no),caption}`)
- Test: `src/features/gc/components/gc-contracts-view.test.tsx`

**Interfaces:**
- Consumes:
  - `useGcListStore`, `useGcListUrlSync` (Task 12)
  - `DataTable` (Task 5), `FilterChips` (Task 4), `ConfirmDialog` (Task 3)
  - `GcContractFormDialog` (Task 13), `Can`/`useCan` (Task 7)
  - `ContractStatusBadge`-style rendering via `StatusBadge` with `GC_STATUS_TONE` + `lo.gc.status`
  - `CountdownBadge`, `formatDate`, `formatMoney`, `SearchInput`, `PageHeader`
- Produces:
  - **`GcContractsView`** (client).
    - The page is a Server Component that renders `<Suspense fallback={<TableSkeleton/>}><GcContractsView/></Suspense>`.
  - **Header:** eyebrow `GC`, title `lo.gc.list.title`. Actions, both requiring `create`: "ສ້າງສັນຍາ" opens the dialog, and a secondary link goes to `/contracts/new`.
  - **Filters:**
    - `SearchInput`, debounced 300ms, writes to `q`.
    - Type `Select`: `lo.gc.list.allTypes` plus the 14 types.
    - Status `FilterChips` (`accent="gc"`): all plus the 4 statuses.
  - **Columns** (spec §6.2):
    - ເລກທີ: a link to `/contracts/{id}`
    - ຊື່ສັນຍາ
    - ປະເພດ
    - ຄູ່ສັນຍາ (`—` when null)
    - ມື້ສິ້ນສຸດ (`lo.gc.openEnded` when null), sortable
    - ມູນຄ່າ (`formatMoney` or `—`)
    - ສະຖານະ (badge)
    - countdown: `CountdownBadge` with `daysLeft(endDate)` when there is an endDate
    - actions: Edit (`edit`) and Delete (`delete`), as icon buttons whose aria-labels include the contract number
  - The ຊື່ສັນຍາ and signed-date columns are sortable through `sort`.
  - **Delete:** `ConfirmDialog` tone danger, then `gcService.remove`, a toast, and `afterDelete()`.
  - **States:** loading skeleton; error → AlertBanner rose with retry; empty → `EmptyState` with the "change filters" suggestion.

- [ ] **Step 1: Write failing tests** (real mocks; `next/navigation` mocked with an in-memory `useSearchParams` + `replace` spy)

```tsx
it('viewer sees rows but no create, edit or delete controls', async () => { session('gc.viewer'); render(<GcContractsView />); expect(await screen.findAllByRole('row')).not.toHaveLength(0); expect(screen.queryByRole('button', { name: lo.gc.list.create })).toBeNull(); expect(screen.queryByRole('button', { name: /ແກ້ໄຂ/ })).toBeNull(); });
it('editor sees edit and delete per row', async () => { session('gc.editor'); /* buttons named with contract numbers present */ });
it('status chip writes to the URL', async () => { /* click lo.gc.status.expiring → replace called with '/contracts/list?status=expiring' */ });
it('search filters on the server', async () => { /* type contract number of seed[5] → single row */ });
it('delete confirms, removes and toasts', async () => { /* editor: delete row → confirm → row gone, toast lo.gc.list.deleted */ });
it('error state offers retry', async () => { vi.spyOn(gcService,'list').mockRejectedValueOnce({status:500,code:'HTTP_500',message:''}); /* alert with lo.errors.server; click lo.common.retry → rows */ });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test --run src/features/gc; pnpm typecheck; pnpm lint; pnpm build`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `feat(gc): contract list with filters, permissions and delete`.

### Task 15: Contract detail page `/contracts/[id]`

**Files:**
- Create: `src/features/gc/components/gc-contract-detail-view.tsx`, `src/app/(app)/contracts/[id]/page.tsx`
- Modify: `src/lib/i18n/lo.ts` (`gc.detail.{keyDates,info,notFound,backToList,alertAt(n)}`)
- Test: `src/features/gc/components/gc-contract-detail-view.test.tsx`

**Interfaces:**
- Consumes: `gcService.get`, `GcContractFormDialog`, `ConfirmDialog`, `Timeline` (Task 4), `DocumentManager` (Task 6), `useCan`, `deriveGcStatus`, `GC_ALERT_DAYS`.
- Produces: `GcContractDetailView({ id }: { id: string })`. The page awaits `params` and passes `id`, with the view wrapped in `<Suspense>`.
  - **Header:** `PageHeader`, eyebrow `GC · {contractNo}`, the title, and a meta line with the status badge and countdown. Actions: Edit and Delete, permission-gated. After delete it does `router.replace('/contracts/list')`.
  - **Info grid:**
    - every spec §2.1 field
    - money through `formatMoney`
    - percent as `${percent}%`
    - empty values as `—`
    - `endDate` null → `lo.gc.openEnded`
  - **Key-dates Timeline:** signed, effective, then each `GC_ALERT_DAYS` point (endDate − n days, using `lo.gc.detail.alertAt(n)`), then end. Status per item: `done` if the date is before today, `current` for the nearest upcoming one, `future` for the rest. Open-ended contracts show only signed and effective.
  - **Documents:** `DocumentManager entityType="gc" entityId={id} canUpload={can('create')} canDownload={can('download')} canDelete={can('delete')}`.
  - **404** → `EmptyState` (`lo.gc.detail.notFound`) with a link back to the list.

- [ ] **Step 1: Write failing tests**

```tsx
it('renders fields and status for a seeded contract', async () => { /* gc.viewer; seed expiring contract → title, lo.gc.status.expiring, formatDate(endDate) */ });
it('timeline lists alert points before the end date', async () => { /* items include lo.gc.detail.alertAt(60), alertAt(30), alertAt(7) */ });
it('open-ended contract shows ບໍ່ມີກຳນົດ and no alert points', async () => { /* … */ });
it('viewer cannot download; main user can', async () => { /* gc.viewer → no download button; gc.user → download button present */ });
it('unknown id shows not-found with back link', async () => { /* id 'nope' → lo.gc.detail.notFound, link /contracts/list */ });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test --run src/features/gc; pnpm typecheck; pnpm lint; pnpm build`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `feat(gc): contract detail with key-date timeline and documents`.

### Task 16: Create wizard `/contracts/new`

**Files:**
- Create: `src/features/gc/components/gc-wizard-view.tsx`, `src/app/(app)/contracts/new/page.tsx`
- Modify: `src/lib/i18n/lo.ts` (`gc.wizard.{title,next,back,submit,summary,progress}`)
- Test: `src/features/gc/components/gc-wizard-view.test.tsx`

**Interfaces:**
- Consumes: `GcFormFieldGroup` (Task 13), `gcFormSchema`, `toGcPayload`, `gcService.create`, `documentsService.upload`, `FileDropzone`, `Stepper`, `PermissionGuard` (Task 7).
- Produces:
  - The page renders `<PermissionGuard module="gc" permission="create"><GcWizardView/></PermissionGuard>`.
  - `GcWizardView` follows Design.md §5 Wizard:
    - focused layout, max-w 1180
    - Stepper on top
    - form card plus a live-summary aside with a gold progress bar
  - The four steps follow spec §6.4:
    1. `general`
    2. `dates`
    3. `money`
    4. files (staged locally with `FileDropzone`), `notes`, and a review of every value
  - Behaviour:
    - "Next" validates only the current step's fields (`trigger([...stepFields])`). "Back" keeps values. A completed step can be revisited by clicking it in the Stepper.
    - Submit: `create`, then upload the staged files to `entityType 'gc'`, then a toast, then `router.replace('/contracts/' + id)`.
    - A 409 jumps back to step 1 with the contractNo error.
    - If an upload fails, the contract is still created; a rose toast lists the failed file names and the navigation still happens.

- [ ] **Step 1: Write failing tests**

```tsx
// Review Focus 5
it('viewer is redirected to /forbidden', () => { session('gc.viewer'); render(<NewPage />); expect(replace).toHaveBeenCalledWith('/forbidden'); });
it('next validates only the current step', async () => { /* step 1 empty → next → errors on title; dates step not reached */ });
it('back keeps entered values', async () => { /* fill step1, next, back → values intact */ });
it('submits, uploads staged files and navigates to detail', async () => { /* full flow as gc.editor → replace('/contracts/<newId>'); documentsService.upload called with entityType 'gc' */ });
it('duplicate number returns to step 1 with field error', async () => { /* … */ });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test --run src/features/gc; pnpm typecheck; pnpm lint; pnpm build`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `feat(gc): four-step create wizard with staged uploads`.

### Task 17: Dashboard `/contracts` and the support-contact channel

**Files:**
- Create:
  - `src/config/support.ts`
  - `src/components/layout/support-dialog.tsx`
  - `src/features/gc/components/{gc-dashboard-view,support-card}.tsx`
- Modify:
  - `src/app/(app)/contracts/page.tsx` (replaces the placeholder)
  - `src/components/layout/user-menu.tsx`
  - `src/lib/i18n/lo.ts` (`support.{title,menu,phone,email,intro}`, `gc.dashboard.{kpiTotal,kpiActive,kpiExpiring,kpiExpired,valueTotal(cur),contractsCount(n),byType,byStatus,upcoming90,noUpcoming}`)
- Test: `src/features/gc/components/gc-dashboard-view.test.tsx`, `src/components/layout/support-dialog.test.tsx`

**Interfaces:**
- Consumes: `gcService.dashboard`, `KpiCard`, `BarList accent="gc"`, `StackedStatusBar`, `CountdownBadge`, `GlassCard`, `formatNumber`.
- Produces:
  - `SUPPORT_CONTACTS = { phone: '+856 21 000 000', email: 'support@lcms.example' } as const`. These are the sample values per spec §6.6; the data lives only here.
  - **`SupportDialog({ open, onOpenChange })`** lists the phone as a `tel:` link and the email as a `mailto:` link.
    - The user menu gains an item `lo.support.menu` that opens it. That item is visible to every signed-in user.
  - **`SupportCard`**: a highlight `GlassCard` showing the same contacts.
  - **`GcDashboardView`** layout:
    - **KPI row:** total; active (default variant); expiring ≤60 (`warning`); expired (`danger`).
    - **Value row:** three KpiCards, LAK, USD and CNY in that order. Each shows `formatNumber(amount)` and `lo.gc.dashboard.contractsCount(count)` as the delta text, with no conversion. A currency with no contracts shows `0`.
    - **Two columns (3:2):**
      - BarList "by type", sorted by count descending, labels from `lo.gc.types`;
      - StackedStatusBar "by status".
      - `StackedStatusBar` gets an optional `getLabel` and `getTone`, so GC can pass `GcStatus` → `lo.gc.status` and `GC_STATUS_TONE`. Its default stays `STATUS_META`.
    - **Upcoming list** (≤90 days, ≤10 rows): rows link to the detail page and show a `CountdownBadge`.
    - **SupportCard.**
  - Entrance motion follows Design.md §8.4.

- [ ] **Step 1: Write failing tests**

```tsx
it('shows KPI counts from the dashboard payload', async () => { /* gc.viewer; mocked dashboard {total:42, byStatus:{pending:3,active:25,expiring:7,expired:7}} → '42','25','7','7' */ });
it('shows per-currency totals without conversion', async () => { /* valueTotals LAK 1,200,000 / USD 0 / CNY 50,000 → '1,200,000', '0', '50,000' and lo.currency labels */ });
it('by-type chart uses Lao type labels sorted by count', async () => { /* first bar label = lo.gc.types[topType] */ });
it('support dialog exposes tel and mailto links', async () => { render(<SupportDialog open onOpenChange={()=>{}} />); expect(screen.getByRole('link', { name: /\+856 21 000 000/ })).toHaveAttribute('href', 'tel:+85621000000'); expect(screen.getByRole('link', { name: /support@lcms\.example/ })).toHaveAttribute('href', 'mailto:support@lcms.example'); });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test --run; pnpm typecheck; pnpm lint; pnpm build`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `feat(gc): dashboard with per-currency totals and support contact channel`.

### Task 18: Alerts page `/contracts/alerts`

**Files:**
- Create: `src/features/gc/components/gc-alerts-view.tsx`, `src/app/(app)/contracts/alerts/page.tsx`
- Modify: `src/lib/i18n/lo.ts` (`gc.alerts.{title,groupOverdue,group7,group30,group60,markRead,allRead,empty}`)
- Test: `src/features/gc/components/gc-alerts-view.test.tsx`

**Interfaces:**
- Consumes: `alertsService.list({ module: 'gc' })`, `alertsService.markRead`, `useAlertsStore` (refresh the bell after mark-read), `CountdownBadge`, `formatDate`.
- Produces: `GcAlertsView`.
  - Groups, in this order:
    - `groupOverdue` (daysLeft ≤ 0)
    - `group7` (1–7)
    - `group30` (8–30)
    - `group60` (31–60)
  - Each group is a heading plus a list. Rows link to `/contracts/{entityId}`, and unread rows show a dot together with sr-only "unread" text.
  - "Mark as read" is a per-row icon button whose aria-label includes the title.
  - Empty → `EmptyState`. Error → banner with retry.

- [ ] **Step 1: Write failing tests**

```tsx
it('groups alerts by window', async () => { /* gc.user → headings in order; a seeded +60 contract appears under group60 */ });
it('mark read updates row and bell count', async () => { /* click markRead → row no longer unread; useAlertsStore.getState().unreadCount decremented after refetch */ });
it('rows link to contract detail', async () => { /* href '/contracts/<id>' */ });
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `pnpm test --run src/features/gc; pnpm typecheck; pnpm lint; pnpm build`. Expected: EXIT 0.
- [ ] **Step 5:** Commit `feat(gc): alerts page grouped by 60/30/7/0 windows`.

### Task 19: E2E, axe coverage and Definition of Done

**Files:**
- Create: `e2e/gc.spec.ts`
- Modify:
  - `e2e/responsive-a11y.spec.ts` (add `/contracts`, `/contracts/list`, `/contracts/<seed id>`, `/contracts/new` in both themes and both projects)
  - `e2e/dod-screenshots.spec.ts` (GC routes)
  - `e2e/rbac.spec.ts` (the new mock users land on `/contracts`)
- Test: the specs themselves

**Interfaces:**
- Consumes: `loginAs`, `setTheme` from `e2e/helpers.ts`; mock users from Task 7; seed ids from Task 11. Read seed ids by visiting the list. Do not hard-code generated ids.

- [ ] **Step 1: Write the specs**

```ts
test('gc.viewer: read-only everywhere', async ({ page }) => { /* /contracts/list: no 'ສ້າງສັນຍາ', no edit/delete; open a row → no download button; goto /contracts/new → URL /forbidden */ });
test('gc.editor: create via modal, find by search, edit, delete; cannot download', async ({ page }) => { /* unique contractNo `E2E-${Date.now()}`; after create search it → 1 row; edit title; delete → gone; detail of seeded doc has no download */ });
test('gc.user: downloads an attached file', async ({ page }) => { const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /ດາວໂຫຼດ/ }).first().click()]); expect(download.suggestedFilename()).toMatch(/\.(pdf|docx?|png|jpe?g)$/); });
test('wizard creates a contract and lands on its detail', async ({ page }) => { /* gc.editor, 4 steps, URL /contracts/<id>, title visible */ });
test('alerts page lists a 60-day contract', async ({ page }) => { /* gc.user → /contracts/alerts → heading lo.gc.alerts.group60 with ≥1 row */ });
test('list filters survive reload via URL', async ({ page }) => { /* click expiring chip → reload → chip aria-pressed=true, all badges expiring */ });
// responsive-a11y additions: no horizontal scroll at 360; axe serious|critical = [] in dark and light for the four GC routes
```

- [ ] **Step 2:** Run `pnpm e2e; echo EXIT=$?`. Fix failures in place. A failure here is a bug in Tasks 1–18; fix it there and re-run that task's unit tests.
- [ ] **Step 3: Full verification.** Run `pnpm typecheck; pnpm lint; pnpm test --run; pnpm build; pnpm e2e`, each with `echo EXIT=$?`. Expected: all 0, and lint shows no warnings in `src/features/gc`.
- [ ] **Step 4:** Run `DOD_SHOTS=1 pnpm e2e` (PowerShell: `$env:DOD_SHOTS=1; pnpm e2e`). Report the GC screenshot paths for the Opus visual check.
- [ ] **Step 5:** Commit `test(gc): e2e for permissions, crud, wizard, alerts, a11y`.

---

## Phase 3a Exit Criteria

- Every task is reviewed and approved by the Opus controller. The final whole-branch review is clean.
- `pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm e2e` is green on `phase-3a-gc`.
- PPA-WIP review §1 items 1–17 are closed, each traceable to a Part 0 task. Item 18 is closed by Task 1.
- New Lao keys are listed for native-speaker review in the final report.
