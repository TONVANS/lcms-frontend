# Review — PPA WIP snapshot (6beeff9) as a base for Phase 3a

**Reviewer:** Opus · **Date:** 2026-10-20 · **Base:** d22d367 (reviewed Phase 1) → 6beeff9 (`phase-2-ppa-wip`)

**Verification run by the controller at 6beeff9:**

| Check | Result |
|---|---|
| typecheck | exit 0 |
| lint | exit 0, 2 warnings (`react-hooks/incompatible-library` on RHF `watch()`) |
| unit tests | 55 files, 179 tests passed |
| build | exit 0 |
| e2e | 58 passed, 16 skipped (opt-in DoD shots) |

## Verdict

**Phase 3a may build on 6beeff9, after the fixes below.**

- The shared pieces are generic enough for GC: only the accent enums are tied to PPA. None needs a rebuild.
- They do have real defects (§1), which Phase 3a fixes first, in Part 0 of its plan.
- The PPA feature code itself is **not accepted** and is **not a template for GC**:
  - its list store has no URL sync;
  - it filters on the client after server pagination, so `total` is wrong;
  - it contains about 40 Lao literals outside `lo.ts`.
- The WIP plan doc (`docs/superpowers/plans/2026-10-20-lcms-phase2-ppa.md`) claims "COMPLETED & VERIFIED" and that all gates are closed. That claim is false; do not rely on the doc.
- The doc mentions the font "Phetsarath OT", but the code does not load it. Only the fonts in Design.md are loaded.
- Phase 1 rulings are not regressed. The auth guard, logout escape, alerts generation counter, `buildHomeView` types and focus ring are all intact.

## 1. Required fixes before GC reuses the shared pieces

1. **`--text` token.** It is used everywhere but not defined. Define it in both themes per Design.md §2.1, in `globals.css`.
2. **Gate 1.** `--chart-*` still reuses reserved status colours. Replace it with the module-accent series, and have the charts read tokens instead of hex: `globals.css`, `bar-list.tsx:21-25`, `monthly-bars.tsx:26-30`.
3. **Gate 3.** `ui.store` calls `rehydrate()` at module scope, which is still before hydration. Move it into a client effect: `ui.store.ts:43-45`.
4. **Gradient used as `background-color`.** The panel renders transparent. Use `bg-(image:--surface-modal)`: `confirm-dialog.tsx:44`, `monthly-bars.tsx:73`.
5. **ConfirmDialog behaviour.** Add internal pending state, stay open when `onConfirm` rejects, and prevent double submit: `confirm-dialog.tsx:84-87`.
6. **Dialog close label.** Localize the English sr-only "Close": `ui/dialog.tsx:79`.
7. **FilterChips.**
   - It uses `role=radio` without the roving keyboard pattern. Switch to `aria-pressed` toggle buttons, or implement the APG radio keyboard model.
   - Colours are hard-coded hex values, and gold fails contrast in the light theme. Use token colours that pass AA.
   - Location: `filter-chips.tsx:22-66`.
8. **Stepper.** The nav label is English and each step is named only by its number. Use `lo` strings for the nav label and per-step accessible names: `stepper.tsx:21,55`.
9. **Timeline.** Status is shown by colour alone. Add sr-only status text: `timeline.tsx:35-41`.
10. **FileDropzone.**
    - A focusable `<input>` sits inside `role=button`, which axe reports as nested-interactive.
    - `maxSizeMb`/`accept` are not enforced. Enforce them, and read the default from `NEXT_PUBLIC_MAX_UPLOAD_MB`.
    - Location: `file-dropzone.tsx:18-87`.
11. **FileList.** The type-tile colours fail AA in the light theme. Make them theme-aware: `file-list.tsx:29-54`.
12. **Width transitions** are forbidden by Design.md §8.1. Use `grow-x`/scaleX instead: `bar-list.tsx:60`, `stacked-status-bar.tsx:63`.
13. **MonthlyBars.** Move the Lao literal into `lo.ts`, and gate the Recharts animation on reduced motion: `monthly-bars.tsx:76,84-89`.
14. **DataTable.** It is built on the deprecated TanStack v9 `useLegacyTable`/`LegacyColumnDef`, which leak into consumer types. Move to `useTable`/`tableFeatures` and export an owned `ColumnDef`: `data-table.tsx:4-19`.
15. **DocumentManager.**
    - Download only shows a toast, so it is dead in live mode. Implement a real download.
    - A failed list load is swallowed. Add an error state with retry and `toUserMessage`.
    - Delete has no confirmation. Use ConfirmDialog.
    - Location: `features/documents/components/document-manager.tsx`.
16. **Mock regex.** The documents GET regex is unanchored and swallows `/documents/:id/download`. Anchor it: `lib/api/mock/handlers/documents.ts:9`.
17. **E2E axe coverage.** Add light and dark checks for a route that uses DataTable, FilterChips and FileDropzone: `e2e/responsive-a11y.spec.ts`.
18. **WIP plan doc.** Mark it unverified and correct the false gate claims.

## 2. Minor (can wait)

- **DataTable:** 44px pagination targets; sorting with `aria-sort`; visible light-theme row hover; row stagger.
- **FilterChips:** minimum height; `py-0.2` no-op; `transition-all`.
- **ConfirmDialog:** radius 26px and max-width.
- **Stepper and Timeline:** colour tokens and `ol/li` semantics.
- **FileList:** per-file delete labels; progress bar; `formatBytes` NaN.
- **Charts:** radius 4px; light-theme grid and dots; `useId` for gradient ids; `formatNumber`; MonthlyBars test.
- **Documents:** duplicate `DocumentFile` type; mocks exported from `index.ts`; skeleton loading.
- **Core:**
  - data-driven nav prefix matching (`navigation.ts:62-68`, currently special-cased for `/contracts/list`);
  - a Ruling or revert for `instant = false` + `experimental.instantInsights`;
  - duplicate `showing` strings in `lo.ts`, and PPA-only keys in the generic `table` group;
  - `toUserMessage('')` for cancellations;
  - a registry integration test;
  - adopt `useMounted` in `theme-toggle`.
- **Documents endpoint shape:** `/documents?entityType=&entityId=` differs from the spec's `GET /:entity/:id/documents`. This needs a Ruling.

## 3. Accepted as-is

- `src/lib/auth/logout-registry.ts`
- `src/hooks/use-mounted.ts`
- Gates 2 (date guards), 4 (CanceledError) and 5 (logout registry) are satisfied, with tests.
