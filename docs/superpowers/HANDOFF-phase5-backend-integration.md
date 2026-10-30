# Handoff — Phase 5 Backend Integration (resume as controller)

You are taking over as **controller** (planner + reviewer, Opus) of Phase 5. Implementation tasks 1–13 are
done and merged. What is left is verification, cleanup, live-backend validation and a few decisions.
Do not redo finished tasks. Implementers are Sonnet subagents, one task each (see `CLAUDE.md` → Model workflow).

## Read first

1. `CLAUDE.md` — binding rules and verification commands.
2. `docs/AGENT_GUIDE.md` — reuse inventory and pitfalls (**partly stale**: still describes pre-Phase-5 auth, `DocumentManager` with `entityType`, alerts, `ModuleRole`; Task 14 below updates it).
3. `docs/superpowers/plans/2026-10-30-lcms-phase5-backend-integration.md` — the Phase 5 plan: §1 Rulings, §2 shared contracts, §3 tasks.
4. Backend references: `D:\LCMS\backend-guide-line\FRONTEND_API_SUMMARY.md`, `D:\LCMS\backend-guide-line\SYSTEM_FLOW_AND_MODULES.md`, `docs/backend/openapi.json` (request DTOs + query enums only; **no response schemas**).

## Where things are

| Item | Value |
|---|---|
| Repo | `D:\LCMS\lcms-frontend` |
| Branch | `phase-5-backend-integration` (from `phase-4a-legal`; not pushed, not merged to `main`) |
| HEAD at handoff | `0bf71b3` (merge of `p5-admin`) |
| Leftover worktree | `D:\LCMS\wt\admin` on branch `p5-admin` (already merged) — remove it (Task 14) |
| Untracked file | `docs/superpowers/HANDOFF-phase4a-legal.md` (old Phase 4a handoff, never committed — decide: commit as history or delete) |
| `.env.local` | gitignored; `NEXT_PUBLIC_API_MODE=mock`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api`, `NEXT_PUBLIC_MAX_UPLOAD_MB=25`. `.env.example` is committed with the same keys and the UAT URL commented. |

### Completed tasks

| Task | What | Commit |
|---|---|---|
| Plan | Phase 5 plan + OpenAPI snapshot | `4458963` |
| 1 | Env, Bearer interceptor, no refresh flow, Nest error normalisation, `envelope.ts` (`unwrap`, `unwrapPage`, `toNum`, `toStr`, `toIsoDate`), full endpoint map, `scripts/live-smoke.mjs` (`pnpm smoke:live`) | `fd772a1` |
| 2 | Backend `User` (role + 5 `can*` flags + `accessibleModules`), flag-based `permissions.ts`, token login, client-only logout, mock users per division, static forgot-password notice | `8be6ecf` |
| 3 | Backend `ContractStatus`, `features/lookups` (departments, contract types, project types), per-module attachments `DocumentManager` (blob preview/download, PDF + images ≤ 25 MB), `features/history` + `HistoryTimeline` | `a0575e3` |
| 4 | `features/notifications` (contracts + power), `/notifications` page | `0085ca3` |
| 5 | Sidebar from `accessibleModules` (+ common + admin sections, mobile Sheet), Topbar (notification menu, user menu; global search removed), placeholder `/support` + `/admin/*` with admin guard | `f08f7f4` |
| 6 | General contracts on `/api/contracts` | `6315a67` |
| 7+8 | Legal documents (`/legal/regulations`) + legal cases on `/api/legal-documents`, `/api/legal-cases` | `2e30576` |
| 9 | Power contracts on `/api/power-contracts` (PURCHASE → project-type select, SALE → free text); `/ppa/documents` removed | `793fba7` |
| Fix | e2e specs aligned with merged UI; legal cases filter overflow fix; `testTimeout: 15000`; legacy status code removed | `0b531c5` |
| 10 | Home built from module dashboards + notifications; `features/alerts`, `/home/summary` deleted | `b5fe8b1` |
| 11 | `/support`: contact channels, tickets (multipart image), admin ticket update + contact CRUD | `cd13655` |
| 12 | `/admin/users`: list/filters, create with HRM lookup, edit (role/division/flags), delete | `548f689` |
| 13 | `/admin/audit-logs`, `/admin/contract-types`, `/admin/departments` (+ HRM sync) | `925a0bf` |

Routes now: `/`, `/notifications`, `/support`, `/contracts{,/list,/new,/alerts,/[id]}`, `/legal{,/regulations,/regulations/[id],/cases,/cases/[id],/new}`, `/ppa{,/contracts,/contracts/[id],/new,/alerts}`, `/admin/{users,audit-logs,contract-types,departments}`, `/forbidden`.
Features: `admin auth documents gc history home legal lookups notifications ppa support users`.

### Last known verification

| Check | Result | Where / when |
|---|---|---|
| typecheck, lint | pass (1 warning: unused `METRICS` in `src/features/legal/cases/lib/legal-case-mapper.ts`) | each task |
| Unit | 694 pass after the e2e-fix commit; each Wave C branch green on its own; Task 13: 40/40 admin tests, typecheck clean | before final merges |
| Build | pass at `0b531c5` | main checkout |
| e2e | 231 pass, 1 load flake (passes alone), 60 skipped by project (desktop-only / mobile-only) | at `0b531c5`, **before** Tasks 10–13 merged |

**Not yet verified on the fully merged HEAD (`0bf71b3`)**: full unit run, `pnpm build`, full `pnpm e2e`. That is Task 14, first step.

## Key decisions (details in plan §1)

- Backend field names and enum values are the frontend model; raw responses go through tolerant per-feature mappers (`toX(raw: unknown)`), because the backend's response shapes are undocumented.
- Mock mode stays and returns the assumed live envelopes: `{ data }`, `{ data, meta: { total, page, limit, totalPages } }`, login `{ accessToken, user }`.
- Auth: Bearer JWT in the JS-readable cookie `lcms_session`; 401 → logout (no refresh endpoint). Permissions: ADMIN / MAIN_USER → all; else `view→canView, create→canUpload, edit→canEdit, delete→canDelete, download→canDownload`. UI modules: `gc ⇐ contracts`, `legal ⇐ legal-documents | legal-cases`, `ppa ⇐ power-contracts`; admin pages ⇐ `role === 'ADMIN'`.
- No sorting (backend has no sort params). Attachments and ticket images are fetched as blobs through `api` (token never in a URL).

## Remaining work — task plan for implementers

Run tasks one at a time unless marked parallel-safe. Each brief must name exact files, expected behaviour and the verification commands (template at the end).

### Task 14 — Integration verification and cleanup (do first)

1. On `0bf71b3`: `pnpm typecheck`, `pnpm lint`, `pnpm test --run`, `pnpm build`, full `pnpm e2e`. Fix regressions from the Wave C merges. Likely spots: Home e2e assertions (`e2e/rbac.spec.ts`, `responsive-a11y.spec.ts`, `dod-screenshots.spec.ts` visit Home), the `/support` and `/admin/*` pages that replaced placeholders, the `none.user` landing (see Task 17).
2. Remove the dead code:
   - The `METRICS` lint warning.
   - `src/components/layout/support-dialog.tsx` (no longer used by any page; the user menu links to `/support`) + its test, unless a page adopts it.
   - Unused `lo` keys (`nav.procurement`, `nav.laws`, `nav.hearings`, `topbar.searchLabel`, `common.search`, and any others a grep shows unused).
3. Remove the merged worktree `D:\LCMS\wt\admin` and branch `p5-admin` (`git worktree remove --force`, `git worktree prune`, `git branch -d p5-admin`; if Windows reports busy files, a stale dev/test server holds them — stop it first).
4. Update `docs/AGENT_GUIDE.md` to Phase 5: phase table, reuse inventory (new features, `envelope.ts`, `DocumentManager module=…`, `HistoryTimeline`, lookups hooks, notifications store, new permission helpers, `isAdmin`, `hasSystemModule`), the auth model, mock envelopes, the pitfalls below. Update `README.md` env section (`NEXT_PUBLIC_API_MODE`, base URL, UAT, `pnpm smoke:live`).
5. Done when: every check exits 0 (e2e: only documented skips; re-run any flake alone and record it), docs updated, one commit.

### Task 15 — Live backend validation (needs the user)

The user must run the smoke script with their own credentials (agents must not enter passwords):

```bash
LCMS_API=http://localhost:3001/api LCMS_USER=<user> LCMS_PASS=<pass> pnpm smoke:live
```

It writes `docs/backend/live-shapes.json` (keys and types only, tokens redacted). Then, per module (parallel-safe, one agent each, separate worktrees):

- **auth + users**: login body (`user` vs `userProfile`), `/auth/me`, users list envelope, HRM lookup shape.
- **gc + lookups + history**: list envelope and `meta` keys, dashboard shapes (`byStatus`, `valueByCurrency`, `byContractType`), dropdown shapes, history `changes`.
- **legal**: documents/cases list + dashboards, `internalId`.
- **ppa + notifications**: power list/dashboard (`byProjectType` grouping for SALE), notifications item shape for both sources.
- **documents/attachments**: attachment field names, preview/download content types.
- **support + admin**: tickets/contacts, audit-log `oldValues`/`newValues`, departments sync result.

For each: tighten the mapper to the real shape (keep tolerance only where the backend is inconsistent), make the mock handler return the real shape, update the mapper tests with a fixture copied from `live-shapes.json`. Then switch `.env.local` to `NEXT_PUBLIC_API_MODE=live` and click through every route with each role.

### Task 16 — PATCH semantics for cleared fields (after Task 15)

GC `diffPayload` drops cleared fields (cannot clear a value). Legal sends `null`. PPA sends only changed composed text. Verify against the live backend what `PATCH` accepts for clearing an optional field (`null`, `""`, omitted), then make GC, legal, PPA and users consistent and test it.

### Task 17 — Landing for users without a business module (decision)

`getLandingRoute` (`src/lib/auth/permissions.ts`) sends such users to `/support`. Task 10's Home also shows an empty state with a `/support` link for them. Ask the product owner which one is wanted, then make login redirect, Home and the e2e test agree.

### Task 18 — Live-mode e2e project

Add a Playwright project that runs against a real backend (`NEXT_PUBLIC_API_MODE=live`, base URL and credentials from env, skipped when absent): login per role, list → detail → attachment preview per module, create/edit/delete on a disposable record. Make the web-server port configurable (`PLAYWRIGHT_PORT`, default 3100) so parallel worktrees stop colliding.

### Task 19 — Lao copy review (human)

Collect for a native speaker every `lo` key added in Phase 5: `roles`, `status` (uppercase), `notifications`, `nav`/`topbar`/`admin` additions, `lookups`, `history`, `documents`/`dropzone` additions, and the sections `gc`, `legal`, `ppa`, `home`, `support`, `users`, `auditLogs`, `contractTypes`, `departments`. Each implementer report listed its keys; produce one table (key, current text, context) for review.

### Task 20 — Security review (before UAT)

- Token in a JS-readable cookie (XSS exposure; consider a short expiry and a strict CSP).
- Backend CORS must allow the frontend origin and the `Authorization` header.
- Every external link guard (`externalUrl`, http/https only) stays in place.
- No secrets in `NEXT_PUBLIC_*`.
- `live-smoke.mjs` redaction.

## Pitfalls learned in Phase 5

| Pitfall | Do this |
|---|---|
| Several agents at once on one machine cause unit timeouts (wizard/dialog tests) and e2e compile flakes | Run heavy suites with no other agents active; parallel agents use `--maxWorkers=2 --testTimeout=30000`; re-run a failure alone before calling it real |
| `pnpm e2e` always uses port 3100, so parallel worktrees reuse each other's server | Only the controller runs e2e, in the main checkout (until Task 18 makes the port configurable) |
| Typecheck errors in `.next/dev/types/validator.ts` after deleting a route | Stale dev types: `rm -rf .next/dev/types` |
| `pnpm build` fails in a fresh worktree on `next/font/google` | Environment-only; build in the main checkout |
| Merging parallel branches conflicts on `src/lib/api/mock/index.ts` and `endpoints.ts` | Trivial: keep all imports/handlers; drop legacy blocks each side deleted. Keep `registerAdmin` after `registerLookups` |
| `lo.ts` and sources are CRLF in the working copy | Use the Edit tool, not scripted splices |
| `git stash` is shared across worktrees and sessions | Never use it; use a WIP commit |
| Removing a worktree fails with "Device or resource busy" | A test/dev server from that worktree is still running; stop it, then delete the folder |
| `cmd | tail; echo $?` reports tail's exit code | Redirect to a file, then `grep` it for `Tests`/`FAIL`, or use `${PIPESTATUS[0]}` |

## Implementer brief template

```
You are the implementer for Task <N> (<title>) of Phase 5 in <D:\LCMS\lcms-frontend | worktree path> (branch <b>, HEAD <sha>).
Work only there. pnpm. Write/Edit tools for source (no shell heredocs). Exit codes via `cmd; echo EXIT=$?`. Never `git stash`.
Read: CLAUDE.md, docs/AGENT_GUIDE.md, this handoff (Task <N>), plan §<…>, backend refs <…>.
Scope (files you own): <…>. Do NOT edit: <…>.
Deliver: <exact behaviour, signatures, files>.
Process: TDD (failing test first, keep RED evidence) → pnpm typecheck / lint / test --run / build (+ e2e if allowed) all 0.
If the same verification fails twice after fixes, stop and report the output.
Commit only your files, conventional message, last line: Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Report: files changed, exported API, RED/GREEN evidence, exit codes, commit hash, edits outside scope, Lao keys for review, plan errors.
```
