# Handoff — Phase 4a Legal (resume execution)

You are taking over as **controller** (planner + reviewer) of Phase 4a. Execution is paused mid-plan. Do not redo finished tasks.

## Where things are

- Repo: `D:\LCMS\lcms-frontend`, branch **`phase-4a-legal`**. The shell's working directory may reset to `D:\LCMS`, which is not a git repo, so always run `git -C D:/LCMS/lcms-frontend …`.
- Spec: `docs/superpowers/specs/2026-10-24-phase4a-legal-design.md`
- Plan: `docs/superpowers/plans/2026-10-24-lcms-phase4a-legal.md` (20 tasks)
- SDD workspace (git-ignored): `.superpowers/sdd/2026-10-24-lcms-phase4a-legal/`
  - `progress.md`: the **ledger**, the source of truth for progress, rulings P1–P6 and deferred minors.
  - `global-constraints.md`: the plan's Global Constraints, Rulings R1–R4 and Review Focus.
  - `implementer-contract.md` / `reviewer-contract.md`: standard dispatch contracts.
  - `task-N-brief.md`, `task-N-report.md`, `review-*.diff`: per-task artifacts.
- Merge base for the final review: `9a7e36d`.

## Status

Updated 2026-10-24 ~22:20 by the outgoing controller. HEAD is `377d711`, and the working tree is clean apart from this file.

- **Tasks 1–9: complete**, all reviewed clean, some after fix rounds. The ledger lists their commits.
- **Task 10 (regulation detail page): mid fix loop. Round 1 is committed; the re-review is still pending.**
  - Task commit: `b8114cd`. Base: `1569672`.
  - **The task review is done.** Verdict: Needs fixes. The Important finding was that `createdAt`, `updatedAt` and `createdBy` were missing from the info grid.
  - Controller ruling: the review's Minor "external links rendered into href without a protocol guard" is also fixed in round 1.
  - **Fix round 1 is committed as `377d711`.** It adds the 3 metadata fields (using `formatDate` and new `lo.legal.fields.createdAt/updatedAt/createdBy`). Links render as anchors only when `new URL()` gives `https:`; anything else is plain text. The new test passes; the report covers it.
  - The full suite and `pnpm build` were last run at `b8114cd`. They were not re-run after the fix, which is test-scoped.
  - **Next step:** dispatch a scoped **re-review** (Opus) with the re-review template. Inputs:
    - the findings below;
    - `task-10-brief.md`;
    - `task-10-report.md`, with fix round 1 appended at its end;
    - the ready package `review-b8114cd..377d711.diff` (fix base `b8114cd`, head `377d711`).
  - Findings to verify:
    1. The detail info grid must show `createdAt`, `updatedAt` and `createdBy`, as spec §2.1 marks them "display only" and §6.5 asks for every field. GC shows them.
    2. External links must render as anchors only when the protocol is https; any other entry renders as plain text. Keys must be `${i}-${url}`.
  - If the re-review is clean, add the ledger lines `Task 10: fix round 1/5 (2 addressed, 0 open; commits b8114cd..377d711)` and `Task 10: complete (commits 1569672..377d711, review clean)`. Then start Task 11 from base `377d711`.
- **Tasks 11–20: not started.**

## Workflow (required by the user and by `CLAUDE.md`)

The user's instruction: **Opus plans and reviews, Sonnet implements and tests.**

Use the `superpowers:subagent-driven-development` skill. Per task:

1. Run `bash <skill>/scripts/task-brief <plan> N`, record BASE (`git rev-parse HEAD`), and append `Task N: dispatched (base …)` to the ledger.
2. Dispatch the implementer, `model: sonnet`. Give it the contract path, the brief path, the report path `task-N-report.md`, the interfaces from earlier tasks, and controller resolutions.
3. When it reports DONE, run `bash <skill>/scripts/review-package <plan> BASE HEAD` and dispatch the reviewer, `model: opus`, with `reviewer-contract.md`.
4. Fix loop for Important or Critical findings:
   - Resume the same implementer with the findings verbatim.
   - Then run a scoped Opus re-review of `FIX_BASE..HEAD`.
   - Rounds 4–5 use a fresh Opus implementer.
5. Ledger lines:
   - completion: `Task N: complete (commits a..b, review clean)`
   - each deferred Minor: `Task N: minor (deferred): …`
   - each decision: `Ruling: … — why — cost if wrong`
6. Never write feature code as the controller. Never push or merge without the user's go-ahead.

## Carry-forward notes for upcoming tasks

- **Task 11:** cases mock, handler, service and store. It extends `src/lib/api/mock/handlers/legal.ts`, and must reuse `createListStore`, `createQueryCodec` and `useListUrlSync` from `features/legal/lib`.
- **Task 12:** Ruling R3, which adds a single-currency mode to `MoneyInput`.
- **Task 13:** `RegulationsSearch` is a verbatim copy of `GcSearch`. Lift it into `features/legal/lib` and reuse it; do not make a third copy. Print uses `print:hidden` in `app-shell.tsx`.
- **Task 17:**
  - Ruling P5: add an optional prop to `RegulationFormFields` that selects which fields render, for the wizard steps.
  - Ruling P6: extract the dialog's 409 → `number` mapping into `regulations/lib/regulation-server-errors.ts`.
- **Task 19:**
  - Cover the deferred sidebar check: viewer sees 3 Legal items, editor sees 4.
  - Check for page-level horizontal scroll at 360px (Task 8 ⚠️).
- **Date-picker tests:** match day buttons with `(^|, )dd/MM/yyyy`. Today's button label has a "today, " prefix.
- Expected lint state: 0 errors and exactly 2 pre-existing PPA `react-hooks/incompatible-library` warnings. Any extra warning is a finding.

## Finish

After Task 20:
1. Run the final whole-branch review on Opus over `9a7e36d..HEAD`, pointing it at the ledger's deferred minors.
2. Dispatch one fix wave, then one scoped re-review.
3. Report every `Ruling:` line in the ledger to the user.
4. Use `superpowers:finishing-a-development-branch`.
