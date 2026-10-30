# Phase 6 — Remaining Tasks for AI Coding Agents

Branch base: `phase-5-backend-integration` (HEAD `40f0733` when this list was written; not pushed, not merged to `main`).
Status before Phase 6: typecheck / lint / 805 unit tests / build / e2e (232 passed, 0 failed) all green in **mock** mode.
Nothing has been run against the real backend yet.

This list replaces "Remaining work" (Tasks 15–20) in `docs/superpowers/HANDOFF-phase5-backend-integration.md`.
Read that handoff first for context, pitfalls and the implementer brief template.

## 0. How to run this list

- Controller (Opus) dispatches one Sonnet implementer per task with the handoff's brief template; the controller reviews every report before merging.
- **Owner** column: `agent` = an implementer can do it alone; `human` = the user must act (credentials, product decision, native Lao review, push/merge); `agent ← human` = an agent does it after the human input exists.
- **Parallel-safe** tasks run in separate git worktrees (`git worktree add ../wt/<name> -b p6-<name>`), never in the main checkout at the same time as another writer. Only the controller runs the full `pnpm e2e` in the main checkout until P6-03 lands.
- Every agent task ends with `pnpm typecheck`, `pnpm lint`, `pnpm test --run`, `pnpm build` all exit 0 (capture real exit codes), plus the e2e specs named in the task. Commit only owned files, conventional message.

## 1. Task index

| ID | Task | Owner | Depends on | Parallel-safe | Priority |
|---|---|---|---|---|---|
| P6-01 | Env + repo housekeeping | agent | — | yes | high |
| P6-02 | Move generic list helpers out of `features/legal` | agent | — | yes (before P6-05) | medium |
| P6-03 | Configurable Playwright port | agent | — | yes | high |
| P6-04 | e2e + a11y coverage for Phase 5 pages | agent | P6-03 | yes | high |
| P6-05 | URL sync + page size for users, admin, support, notifications lists | agent | P6-02 | yes | medium |
| P6-06 | Session expiry + security hardening | agent | — | yes | high |
| P6-07 | Lao copy review sheet | agent → human → agent | — | yes | medium |
| P6-08 | Run the live smoke script | **human** | backend reachable | — | **blocking** |
| P6-09 | Tighten mappers + mocks to real shapes (6 sub-tasks) | agent ← human | P6-08 | yes (per module) | **blocking** |
| P6-10 | PATCH semantics for cleared fields | agent ← human | P6-09 | no | high |
| P6-11 | Live-mode e2e project + manual live checklist | agent ← human | P6-03, P6-09 | no | high |
| P6-12 | Landing for users without a business module | human decision → agent | — | yes | low |
| P6-13 | CSV export / print parity for GC and PPA | human decision → agent | — | yes | low |
| P6-14 | Branch finish: PR to `main` | **human** approves → agent | P6-01…P6-11 | no | final |
| P6-15 | Legal 4b (procurement, laws, hearings) | blocked on backend | backend endpoints | — | deferred |

Suggested order: **Wave 1** (now, parallel): P6-01, P6-02, P6-03, P6-06, P6-07 (sheet) · then P6-04, P6-05.
**Human, in parallel with Wave 1**: P6-08, decisions for P6-12 / P6-13, Lao review for P6-07.
**Wave 2** (after P6-08): P6-09 (six parallel sub-tasks) → P6-10 → P6-11. **Wave 3**: P6-14.

## 2. Task briefs

### P6-01 — Env + repo housekeeping (agent)

Why: commit `66eb31c` set the committed `.env.example` default `NEXT_PUBLIC_API_BASE_URL` to the Cloudflare tunnel URL, which is temporary and changes.
- `.env.example`: default back to `http://localhost:3001/api`; keep the UAT URL as a commented line with "tunnel URL changes — ask the backend team". Do not touch `.env.local` (gitignored, user-owned).
- `README.md` "Environment & backend": same wording; explain that `.env.local` overrides `.env.example`.
- `src/config/env.test.ts`: still asserts the localhost default.
- List (do not delete) stale branches in the report: `phase-2-ppa-wip` is superseded by Phase 5 PPA. Deleting branches needs the user's OK (part of P6-14).
- Done when: verification green; `git grep trycloudflare` only matches comments/docs.

### P6-02 — Move generic list helpers out of `features/legal` (agent)

Why: `createListStore`, `createQueryCodec`, `useListUrlSync`, `uploadStaged`, `mapper-utils`, `mock-db` in `src/features/legal/lib/` are generic, and `features/home` already imports from `@/features/legal` for non-legal reasons. P6-05 needs them in more features.
- Move the generic ones to `src/lib/list/` (`create-list-store.ts`, `list-query-codec.ts`, `use-list-url-sync.ts`) and `src/lib/api/mapper-utils.ts`, `src/lib/api/mock/mock-db.ts` (+ their tests). Keep legal-specific UI (`legal-search`, `legal-wizard`, `form-dialog-shell`, `department-select`, `detail-bits`, `section-header`, `staged-files`, `use-record`) where it is unless another feature already duplicates it.
- Update all imports; `features/legal/index.ts` stops re-exporting the moved helpers.
- Update `docs/AGENT_GUIDE.md` §4.6.
- Done when: no file outside `src/features/legal/` imports a generic helper from `@/features/legal`; verification green; no behaviour change.

### P6-03 — Configurable Playwright port (agent)

- `playwright.config.ts`: port from `PLAYWRIGHT_PORT` (default 3100) for both `webServer.port`/`url` and `use.baseURL`; `reuseExistingServer` only when `!process.env.CI`.
- `README.md` + AGENT_GUIDE §7 pitfall row: worktrees set a unique `PLAYWRIGHT_PORT`.
- Done when: `PLAYWRIGHT_PORT=3201 pnpm e2e e2e/auth.spec.ts` passes while nothing listens on 3100.

### P6-04 — e2e + a11y coverage for Phase 5 pages (agent)

Why: `/notifications`, `/support`, `/admin/users`, `/admin/audit-logs`, `/admin/contract-types`, `/admin/departments` and the Home page per role are covered only by unit tests and nav-link checks.
- New `e2e/notifications.spec.ts`: list, source filter, mark one read (bell count decrements), mark all read.
- New `e2e/support.spec.ts`: contact cards, create ticket with image (fixture PNG in `e2e/fixtures/`), status filter; admin updates a ticket status; non-admin cannot see admin controls.
- New `e2e/admin.spec.ts`: admin creates a user via HRM lookup (`EDL-001`), edits role/flags, deletes; non-admin hitting `/admin/*` lands on `/forbidden`; contract type and department create/edit/delete incl. the in-use error message; department sync toast; audit-log details dialog.
- `e2e/rbac.spec.ts`: Home content per role (admin 3 module cards; `gc.user` redirected to `/contracts`; `none.user` per current behaviour — leave a `TODO(P6-12)` comment).
- Attachments: one spec per module uploads a PDF, previews it (dialog visible), deletes it (in the module's own spec file).
- `e2e/responsive-a11y.spec.ts` page list: add notifications, support, the four admin pages, one detail page per module (axe + no horizontal scroll, both themes, both projects).
- `e2e/dod-screenshots.spec.ts`: add the new pages.
- Use a unique `PLAYWRIGHT_PORT` in the worktree. Done when: full `pnpm e2e` green (only documented project skips).

### P6-05 — List consistency for users, admin, support, notifications (agent, after P6-02)

Why: GC/legal/PPA lists keep filters, page and page size in the URL; `/admin/users` (fixed page size 10), `/admin/*`, `/support` tickets and `/notifications` don't.
- Use `src/lib/list/*` (P6-02): URL sync for search, filters, page, page size; page-size selector (10/20/50) via the shared `DataTable` footer.
- `useSearchParams` inside `<Suspense>` (AGENT_GUIDE §7, `cacheComponents`).
- Contract types / departments keep client-side paging (backend returns full lists) but still sync search/filter/page to the URL.
- Done when: reload and back/forward restore list state on all six pages (unit tests per store + one e2e per page in the specs from P6-04).

### P6-06 — Session expiry + security hardening (agent)

Why: the token sits in a JS-readable cookie (Bearer backend), nothing logs out at JWT expiry, and there is no CSP.
- `src/lib/auth/session.ts`: `readTokenExpiry(token): number | null` (decode the JWT payload `exp` without verifying; mock tokens → null). `setSessionToken` caps cookie `max-age` at the token expiry.
- Auth store: schedule `expire()` at `exp` (clear on logout); on app focus, expire if already past. Login page shows `lo.auth.sessionExpired` (`?reason=expired`, existing flow).
- `next.config.ts` `headers()`: CSP (`default-src 'self'`; `connect-src 'self'` + the origin of `NEXT_PUBLIC_API_BASE_URL`; `img-src 'self' blob: data:`; `frame-src 'self' blob:` for the PDF preview; `style-src 'self' 'unsafe-inline'`; fonts per `next/font`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`. Verify the app (incl. PDF/image preview, theme script) still works in `pnpm build && pnpm start` and e2e.
- Audit (report only, fix if trivial): every `externalUrl` render keeps the http/https guard; no secrets in `NEXT_PUBLIC_*`; `scripts/live-smoke.mjs` redacts `token|password|secret`; no `dangerouslySetInnerHTML` with server data.
- `docs/backend/CORS.md`: one paragraph for the backend team — allowed origins, `Authorization` header, methods, `Content-Disposition` exposed for downloads.
- Done when: verification + full e2e green; unit tests for expiry parsing and the timer.

### P6-07 — Lao copy review sheet (agent → human → agent)

1. Agent: generate `docs/i18n/lao-review.md` from `src/lib/i18n/lo.ts` with every key added or changed in Phase 5 (diff against `phase-4a-legal`: `git diff phase-4a-legal -- src/lib/i18n/lo.ts`): table `key | current Lao text | where it appears (component/route) | note`. Mark backend-verbatim enum labels (from `FRONTEND_API_SUMMARY.md`) as "verbatim — do not change unless the backend changes".
2. Human: a native speaker fills a "corrected text" column.
3. Agent: apply corrections to `lo.ts` only, update tests/e2e that assert changed strings, verification green.

### P6-08 — Run the live smoke script (human)

The user runs it with their own credentials (agents must not enter passwords):

```bash
LCMS_API=<backend>/api LCMS_USER=<user> LCMS_PASS=<pass> pnpm smoke:live
```

Run it once as ADMIN and, if possible, once per division user (general contracts, legal, power) so 403s and per-module shapes are captured. Output: `docs/backend/live-shapes.json` (keys and types only, tokens redacted). Commit it or hand it to the controller. Also tell the controller the current backend URL.

### P6-09 — Tighten mappers and mocks to real shapes (agent, after P6-08; six parallel sub-tasks)

For each sub-task: read the relevant part of `docs/backend/live-shapes.json`; tighten the mapper to the real shape (keep tolerance only where the backend is inconsistent, and say where); make the mock handler return exactly the real shape and envelope; add a mapper test fixture copied from the live shape; fix services if the list envelope / `meta` keys differ from `unwrapPage`'s assumptions.

| Sub-task | Files (owner) | Questions the live shapes answer |
|---|---|---|
| a. auth + users | `features/auth/lib/user-mapper.ts`, `features/users/**`, mock `auth.ts`, `users.ts` | login body `user` vs `userProfile`; `/auth/me` envelope; users list envelope; HRM lookup fields |
| b. gc + lookups + history | `features/gc/lib/*mapper*`, `features/lookups/**`, `features/history/**`, mocks `gc.ts`, `lookups.ts`, `history.ts` | list `meta` keys; `byStatus` / `valueByCurrency` / `byContractType` shapes; dropdown item shape; history `changes` |
| c. legal | `features/legal/**/lib/*mapper*`, mock `legal.ts` | documents/cases list and dashboards; `internalId` vs `id`; nested `department` |
| d. ppa + notifications | `features/ppa/lib/*`, `features/notifications/**`, mocks `ppa.ts`, `notifications.ts` | dashboard `byProjectType` grouping for SALE; MW vs kW; notification item fields and `isRead` |
| e. documents | `features/documents/**`, mock `documents.ts` | attachment field names; preview/download `Content-Type` and `Content-Disposition` |
| f. support + admin | `features/support/**`, `features/admin/**`, mocks `support.ts`, `admin.ts` | tickets/contacts shapes; audit-log `oldValues`/`newValues`; departments sync result |

Shared file `src/lib/api/envelope.ts`: only sub-task b may change it; others report needed changes to the controller.
Done when: every sub-task green; controller merges all six, full e2e green in mock mode.

### P6-10 — PATCH semantics for cleared fields (agent ← human, after P6-09)

Today GC `diffPayload` omits cleared fields (a value cannot be cleared), legal sends `null`, PPA sends only changed composed text, users sends changed fields.
- With the user (or the backend team), confirm what `PATCH` accepts to clear an optional field: `null`, `""` or omission (one test edit on a disposable record in UAT, done by the user or via P6-11's live project).
- Implement one rule in a shared helper `src/lib/api/diff-payload.ts` used by GC, legal, PPA, users, admin; unit tests for set / change / clear / unchanged.
- Done when: clearing an optional field in each module's edit dialog persists after reload (mock + live).

### P6-11 — Live-mode e2e project + manual live checklist (agent ← human, after P6-03 and P6-09)

- `playwright.config.ts`: project `live` that runs only when `LCMS_E2E_API`, `LCMS_E2E_USER`, `LCMS_E2E_PASS` are set (skipped otherwise); starts the app with `NEXT_PUBLIC_API_MODE=live` and `NEXT_PUBLIC_API_BASE_URL=$LCMS_E2E_API`. Credentials come only from env (the user sets them); never committed.
- `e2e/live/*.spec.ts`: login; per module list → detail → attachment preview; create → edit → delete one disposable record per module, named `E2E-<timestamp>`, always cleaned up in `afterAll`.
- `docs/backend/live-checklist.md`: manual click-through per role (admin, each division main/editor/viewer) covering every route and permission-gated button, for the user to tick.
- Done when: `pnpm e2e --project=live` passes for the user against UAT (the user runs it and reports), and the mock projects stay green.

### P6-12 — Landing for users without a business module (human decision → agent)

Today `getLandingRoute` sends them to `/support`, and Home (`/`) also shows an empty state linking to `/support`.
Decision needed: (A) keep the redirect to `/support` or (B) land on Home's empty state.
Agent: implement the decision in `src/lib/auth/permissions.ts` + Home, update unit tests and `e2e/rbac.spec.ts` (remove the `TODO(P6-12)`).

### P6-13 — CSV export / print parity (human decision → agent)

Legal documents and cases have CSV export (all pages via `listAll`) and print; general contracts and power contracts do not.
Decision needed: add the same to GC and PPA? If yes: reuse the legal CSV builder pattern + `src/lib/utils/export-csv.ts`, Lao headers in `lo.gc` / `lo.ppa`, print stylesheet hiding chrome, e2e download assertion.

### P6-14 — Finish the branch (human approval → agent)

- Agent prepares: rebase or merge `main` into the branch if `main` moved; full verification + e2e; PR description summarising Phases 5–6, verification table, known gaps.
- Human approves: push, open PR to `main`, merge. Optional after merge: delete obsolete branches (`phase-2-ppa-wip`, `phase-1-foundation`, `phase-3a-gc`, `phase-4a-legal`) — only with the user's OK.

### P6-15 — Legal 4b (deferred, blocked on backend)

Procurement contracts, law library and hearings calendar exist in the original spec (`Frontend_LCMS_Project.md`) but the backend has no endpoints for them. Do nothing until the backend team ships endpoints; then plan it as a new phase using the Phase 5 recipe (AGENT_GUIDE §5.1b).

## 3. Definition of done for Phase 6

- All agent tasks merged; typecheck / lint / unit / build green; `pnpm e2e` green in mock mode; `pnpm e2e --project=live` green against UAT (run by the user).
- Mappers and mocks match `docs/backend/live-shapes.json`.
- Lao review applied.
- Decisions for P6-12 and P6-13 recorded in this file.
- `docs/AGENT_GUIDE.md` and the handoff updated; PR to `main` opened with the user's approval.
