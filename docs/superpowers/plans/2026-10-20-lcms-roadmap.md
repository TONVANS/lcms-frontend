# LCMS Frontend — Roadmap & Model Workflow

**Specs:** `Design.md`, `Frontend_LCMS_Project.md` (both are the source of truth; this file only sequences them).

## 1. Who does what

| Role | Model | Responsibilities |
|---|---|---|
| Planner / controller / reviewer | **Opus 5.5** (main session) | Writes each phase plan from the spec **and the code that already exists**; dispatches one task at a time; reviews every finished task against the plan + spec (correctness, Design.md fidelity, a11y, Lao copy keys); runs the whole-branch review at the end of a phase; updates the plan when a task reveals a wrong assumption. Never writes feature code. |
| Implementer + tester | **Sonnet 5.5** (subagent per task, `Agent` tool with `model: "sonnet"`) | Implements exactly one task with TDD: writes the failing test, runs it, implements, runs unit tests + `pnpm typecheck` + `pnpm lint`, commits. Reports back: files changed, test output, anything the plan got wrong. Does **not** change interfaces owned by other tasks; if one is wrong it stops and reports. |

Execution skill: `superpowers:subagent-driven-development`, with implementer subagents pinned to `model: "sonnet"` and the review step done by the Opus controller.

Escalation rule: if a Sonnet implementer fails the same verification twice, it stops and reports the error output; Opus diagnoses (`superpowers:systematic-debugging`), amends the plan, and re-dispatches.

## 2. Phases → plans

| Phase | Plan file | Written when | Status |
|---|---|---|---|
| 1 Foundation: bootstrap, tokens, fonts, theme, API layer + mocks, auth, RBAC, AppShell, shared components, Home | `2026-10-20-lcms-phase1-foundation.md` | now | Ready for review |
| 2 PPA module | `…-lcms-phase2-ppa.md` | after Phase 1 merges | — |
| 3 General Contract module | `…-lcms-phase3-gc.md` | after Phase 2 merges (reuses PPA list/detail/wizard patterns) | — |
| 4 Legal module | `…-lcms-phase4-legal.md` | after Phase 3 | — |
| 5 Backend integration | `…-lcms-phase5-backend.md` | when the OpenAPI spec exists | blocked on backend |
| 6 Admin, notifications center, hardening, e2e | `…-lcms-phase6-admin.md` | after Phase 4 | — |

Each phase ships on its own branch, passes `typecheck`, `lint`, `test --run`, `build` and `e2e`, and is merged before the next plan is written.

## 3. Phase scope outlines (detailed plans come later)

**Phase 2 — PPA** (`/ppa`, `/ppa/contracts`, `/ppa/contracts/[id]`, `/ppa/new`, `/ppa/alerts`, `/ppa/documents`)
- Shared components first needed here: `DataTable` (@tanstack, URL-synced filters, "ສະແດງ X ຈາກ Y" + pagination), `FilterChips`, `ConfirmDialog`, `Stepper`, `Timeline`, `FileDropzone` + `FileList`, charts `BarList` / `StackedStatusBar` / `MonthlyBars`.
- `features/ppa`: types, `ppa.schema.ts` (one zod schema shared by modal form and wizard), service, mocks (≥ 25 contracts covering every status and energy type), `ppa-list.store.ts` (URL-synced), dashboard KPIs.
- Logout reset registry so feature stores clear on logout.
- `features/documents` upload/preview/versions (mock multipart; size limit `NEXT_PUBLIC_MAX_UPLOAD_MB`).

**Phase 3 — General Contract** (`/contracts`, `/contracts/list`, `/contracts/[id]`, `/contracts/new`, `/contracts/alerts`): same shape as PPA; GC accent; `Money` display; `autoRenew`.

**Phase 4 — Legal** (`/legal` dashboard, regulations, procurement, law library, cases, hearings calendar, `/legal/new`): `MiniCalendar` (Mon-first, Lao weekdays), litigation stage timeline, gold CTA, violet litigation accent.

**Phase 5 — Backend integration**: follow `Frontend_LCMS_Project.md §11` checklist verbatim.

**Phase 6** — Admin users/roles/departments, notifications center, global search, hardening (error boundaries, perf budget), e2e for every route in light + dark at 360px and 1280px.

## 4. Open questions to raise with stakeholders (do not block Phase 1)

1. Token strategy (httpOnly cookie vs bearer) — Phase 1 builds the cookie flow per spec §4.
2. `daysLeft` source: server or client? Phase 1 computes client-side from `dueDate` in local calendar days (Asia/Vientiane assumed).
3. Lao copy review by a native speaker — every string lives in `src/lib/i18n/lo.ts`, so review is one file.
4. Status label for `terminated` (not in Design.md §2.5) — Phase 1 uses `ຍົກເລີກ` with the Draft (slate) tone.
5. Real logo assets for `public/brand/`.
