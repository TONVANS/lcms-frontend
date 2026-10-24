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
| 4a Legal: regulations + cases (the two systems the Legal team uses today) | `…-lcms-phase4a-legal.md` | after Phase 3 | scope set from the team's web app, 2026-10-24 |
| 4b Legal: procurement, law library, hearings calendar | `…-lcms-phase4b-legal.md` | after 4a, and only once stakeholders confirm the scope (§4 Q8) | — |
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

**Phase 4 — Legal.**
- **Source requirements:** the Legal team's Google Apps Script web app, reviewed 2026-10-24.
  - It belongs to ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal and Dispute Resolution Division).
  - Its hub page links to two separate apps, each backed by its own Google Sheet:
    - **ລະບົບຄຸ້ມຄອງບັນດານິຕິກຳ ຟຟລ** (EDL regulations register);
    - **ລະບົບຄຸ້ມຄອງ ແລະ ຕິດຕາມຄະດີ** (case tracking).
  - Phase 4a rebuilds exactly those two. Procurement, law library and hearings are in the spec but not in the team's data, so they move to 4b.
- **Spec change:** the 4a design spec replaces the `Regulation` and `LegalCase` drafts in `Frontend_LCMS_Project.md §6`, the same way Phase 3a replaced `GeneralContract`.

**4a routes:**
- `/legal`: dashboard.
- `/legal/regulations`: list with a modal form.
- `/legal/regulations/[id]`: detail with attached files.
- `/legal/cases`: list with a modal form.
- `/legal/cases/[id]`: detail.
- `/legal/new`: wizard. The first step chooses ນິຕິກຳ or ຄະດີ.
- Remove the procurement, laws and hearings entries from `navigation.ts` until 4b ships, rather than linking to empty pages.

**4a data model.** The team's field names are in brackets, so the mock and import mappings stay traceable.

`Regulation` (ນິຕິກຳ):

| Field | Lao label | Type | Req. | Notes / change from the team's app |
|---|---|---|---|---|
| `title` [docName] | ຊື່ນິຕິກຳ | string | ✓ | |
| `type` [doctype] | ປະເພດນິຕິກຳ | `'decision' \| 'provision' \| 'notice' \| 'rule' \| 'instruction' \| 'other'` | ✓ | ຂໍ້ຕົກລົງ / ຂໍ້ກຳນົດ / ແຈ້ງການ / ລະບຽບການ / ຄຳແນະນຳ / ອື່ນໆ. The team allows free text, so `other` comes with `typeOther?: string` (Q9) |
| `number` [docId, part 1] | ເລກທີ | string | ✓ | e.g. `351/ຟຟລ.ຝບຊ`. The team stores number and date in one text cell; we split them |
| `issuedDate` [docId, part 2] | ລົງວັນທີ | `ISODate` | ✓ | date picker |
| `year` [docyear] | ປີນຳໃຊ້ | number | — | the form suggests the year of `issuedDate` |
| `purpose` [userfor] | ຈຸດປະສົງ / ເນື້ອໃນ | string | — | ≤ 2000 chars |
| `responsible` [responsible] | ຜູ້ຮັບຜິດຊອບ | string | — | free text for now; later a `/lookups/users` picker |
| `departmentId` [depname] | ຫ້ອງການ/ຝ່າຍ/ສະຖາບັນ | lookup | ✓ | seed the mock lookup with the team's 12 units: ຫ້ອງການ ຟຟລ, ຝ່າຍບຸກຄະລາກອນ, ຝ່າຍກົດໝາຍ-ສັນຍາ, ຝ່າຍກວດກາ, ຝ່າຍບັນຊີ, ຝ່າຍ ICT, ສະຖາບັນ ຟຟລ, ຝ່າຍທຸລະກິດ ແລະ ແຜນການ, the 3 regional grid divisions (ເໜືອ/ກາງ/ໃຕ້), ຄະນະຄຸ້ມຄອງໂຄງການ |
| `status` [status] | ສະຖານະ | `'in_force' \| 'repealed'` | ✓ | ຍັງນຳໃຊ້ / ຍົກເລີກ. The draft's `amended` is dropped unless Q10 says otherwise |
| `documents` [linkDoc1 + uploads] | ເອກະສານ | `DocumentFile[]` | — | several files, via `features/documents` |
| `externalLinks` [linkDoc1] | ລິ້ງ Google Drive | `string[]` (URLs) | — | the team can paste Drive URLs instead of uploading. Today they sit in one cell split by newline or `;`, which the import splits into this array |

- **Dropped from the draft:** `issuedBy` and `effectiveDate`. They are not in the team's data (Q10).

`LegalCase` (ຄະດີ):

| Field | Lao label | Type | Req. | Notes / change from the team's app |
|---|---|---|---|---|
| `caseNo` [id] | ລະຫັດຄະດີ | string | server | generated by the server; read-only in the form |
| `defendant` [defendant] | ຈຳເລີຍ | string | ✓ | |
| `allegation` [party] | ຂໍ້ກ່າວຫາ | string | ✓ | the team's key `party` does not match its label; we rename it |
| `handlingUnit` [branch] | ພາກສ່ວນດຳເນີນ | string | ✓ | free text, as the team has it |
| `caseType` [caseType] | ປະເພດຄະດີ | `'civil' \| 'criminal' \| 'commercial' \| 'other'` | ✓ | ຄະດີແພ່ງ / ຄະດີອາຍາ / ການຄ້າ / ອື່ນໆ |
| `stage` [status] | ສະຖານະຄະດີ | `'first_instance' \| 'appeal' \| 'cassation' \| 'completed' \| 'closed'` | ✓ | ສານຂັ້ນຕົ້ນ / ສານຂັ້ນອຸທອນ / ຂັ້ນລົບລ້າງ / ສໍາເລັດ / ຈົບຄະດີ. This **replaces** the draft `CaseStage` (`filed`, `mediation`, `supreme` are not in the team's data). `completed` and `closed` both count as finished (Q11) |
| `damage` [damageLak/Usd] | ມູນຄ່າເສຍຫາຍ | `DualAmount` | — | |
| `fine` [fineLak/Usd] | ມູນຄ່າປັບໄໝ | `DualAmount` | — | |
| `recovered` [recLak/Usd] | ມູນຄ່າທີ່ເກັບໄດ້ຄືນ | `DualAmount` | — | |
| `disputeDate` [lastDate] | ວດປ ເກີດຂໍ້ຂັດແຍ່ງ | `ISODate` | — | the team labels this date differently in two places (Q12) |
| `progress` [progress] | ຄວາມຄືບໜ້າຄະດີ | string | — | ≤ 2000 chars. Overwritten on edit, as in the team's app; a progress history is Q13 |

- **`DualAmount`:** `{ lak?: number; usd?: number }`.
  - A case carries LAK and USD **at the same time**, so the single-currency `Money` does not fit.
  - The **total** (ລວມທັງໝົດ) is `damage + fine` per currency. It is derived, not stored; the team's app stores it as a column.
  - No currency conversion.
- **Dropped from the draft:** `title`, `counterparty`, `ourRole`, `court`, `lawyer`, `claimAmount`, `nextHearing`. Hearings come back in 4b if Q8 confirms them.

**4a screens:**
- **Dashboard `/legal`:** two sections.
  - Regulations section:
    - `KpiCard`s: total, in force, repealed, departments.
    - Count by type (donut, or `StackedStatusBar`).
    - Count by department (`BarList`).
  - Cases section:
    - `KpiCard`s: total, in progress (not finished), finished, damage + fine in LAK, damage + fine in USD, recovered LAK / USD.
    - Count by stage.
    - Damage / fine / recovered bars, shown separately for LAK and USD.
  - The Home legal card reads its totals from these same mocks.
- **Lists:** use the existing `DataTable` with URL-synced filters and "ສະແດງ X ຈາກ Y" + pagination.
  - Regulations: search over title, number and responsible; filters for type, department and status; file chips per row.
  - Cases: search over caseNo, defendant, allegation, handling unit, stage and progress; filters for case type and stage; LAK / USD money columns that collapse at narrow widths.
- **Forms:** one zod schema per entity, shared by the modal and the `/legal/new` wizard.
  - Regulation form: `FileDropzone` for multiple files plus an "add Drive link" input.
  - Case form: grouped money inputs (damage, fine, recovered × LAK, USD) using `MoneyInput`.
- **Case detail:**
  - stage `Stepper`: ຂັ້ນຕົ້ນ → ອຸທອນ → ລົບລ້າງ → ສໍາເລັດ / ຈົບ;
  - money breakdown with the derived totals;
  - progress note.
- **Export:** both lists export the filtered rows to CSV (UTF-8 BOM, Lao headers), matching what the team has today. The case list also gets a print stylesheet.
  - Add this as a new shared util, `lib/utils/export-csv.ts`, since none exists yet.
  - Gate export behind the `download` permission, like GC file downloads.
- **Permissions:** same RBAC as GC.
  - Delete is allowed only with the `delete` permission, behind `ConfirmDialog`.
  - The team's case app has no delete; the regulations app does.
- **Mocks:**
  - ≥ 25 regulations, covering every type, both statuses, all 12 units, and rows with files, links, or neither.
  - ≥ 20 cases, covering every stage and case type, LAK-only, USD-only and mixed amounts, and recovered = 0 or partial.
  - Shape them on the team's real rows, anonymised (Q14).
- **Design:** gold CTA (`--gold-gradient`) for Legal primary actions; violet litigation accent on case screens; badge tones from Design.md §2.5. Legal finished = emerald and in progress = amber, matching the team's colours.
- **Not in 4a:**
  - deadline alerts (the team tracks none);
  - attachments on cases (Q13);
  - importing the team's Google Sheets (Phase 5 / Q14).

**Phase 4b — procurement, law library, hearings** (only after Q8):
- `/legal/procurement`, `/legal/laws`, `/legal/hearings`.
- `MiniCalendar` (Mon-first, Lao weekdays, Design.md "Calendar" spec).
- Hearings linked to cases, with `CountdownBadge` "hearing this week".
- Add their nav entries back.

**Phase 5 — Backend integration**: follow `Frontend_LCMS_Project.md §11` checklist verbatim.

**Phase 6** — Admin users/roles/departments, notifications center, global search, hardening (error boundaries, perf budget), e2e for every route in light + dark at 360px and 1280px.

## 4. Open questions to raise with stakeholders (do not block Phase 1)

1. Token strategy (httpOnly cookie vs bearer) — Phase 1 builds the cookie flow per spec §4.
2. `daysLeft` source: server or client? Phase 1 computes client-side from `dueDate` in local calendar days (Asia/Vientiane assumed).
3. Lao copy review by a native speaker — every string lives in `src/lib/i18n/lo.ts`, so review is one file.
4. Status label for `terminated` (not in Design.md §2.5) — Phase 1 uses `ຍົກເລີກ` with the Draft (slate) tone.
5. Real logo assets for `public/brand/`.

Legal module (raise before the Phase 4a spec is written):

6. Module name: should the Legal module's Lao name follow the division name, ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ, instead of the current `ນິຕິກຳ, ຈັດຊື້-ຈັດຈ້າງ ແລະ ຄະດີ`? Procurement is not part of what the team sent.
7. Access: who may create, edit and delete regulations and cases, and who may export? Map each to the existing viewer / editor / main roles.
8. Are procurement contracts, the law library and the hearings calendar still wanted? If not, drop 4b.
9. Regulation type: is the fixed list of 5 types plus "ອື່ນໆ" enough, or does the team need free-text types?
10. Regulation status: is ຍັງນຳໃຊ້ / ຍົກເລີກ enough, or do they also need ປັບປຸງ (amended)? Are `issuedBy` and `effectiveDate` needed at all?
11. Case stages: what is the difference between ສໍາເລັດ and ຈົບຄະດີ? Their app's code also handles ສືບສວນ (investigation) and "ກຳລັງດຳເນີນ". Are those old values still in the Sheet, and should they become stages?
12. Case date: is it the date the dispute arose (ວດປ ເກີດຂໍ້ຂັດແຍ່ງ, as the table says) or the date the case started (ວດປ ເລີ່ມຕົ້ນຄະດີ, as the form says)?
13. Cases: should progress keep a dated history rather than one overwritten note, and do cases need file attachments?
14. Data: can the team share an anonymised export of both Sheets for mock data, and do they want their existing rows imported at go-live?
