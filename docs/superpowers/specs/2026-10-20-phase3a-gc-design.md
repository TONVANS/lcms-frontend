# Phase 3a — General Contract (GC) Module Design

**Status:** For review · **Date:** 2026-10-20 · **Branch:** `phase-3a-gc` (based on `phase-2-ppa-wip` 6beeff9)
**Source requirements:** `ລະບົບຈັດເກັບຂໍ້ມູນ ພະແນກສັນຍາທົ່ວໄປ.xlsx` (GC department, sheet "ລະບົບຈັດເກັບສັນຍາ ຂອງ ພສທ"), plus the decisions agreed in chat on 2026-10-20.
**Binding specs:** `Design.md`, `Frontend_LCMS_Project.md`, `docs/AGENT_GUIDE.md`. Where this document changes them, it says so explicitly (§9).

## 1. Goal and scope

Deliver the General Contract module (`/contracts/**`) for the GC department (ພະແນກສັນຍາທົ່ວໄປ). It covers:

- the contract register;
- attached contract files;
- role-based permissions;
- the expiry alerts the team asked for;
- a dashboard.

It runs on mock data, and live mode works later without feature-code changes.

**Phase 3a covers:** data model, list, detail, create/edit (modal + wizard), delete, file attachments, permission enforcement, alerts, dashboard, and the support-contact channel.

**Phase 3b (separate spec, later):** the Admin page for adding and removing users and assigning module roles.

**Not in scope:**
- early termination / cancellation status;
- currency conversion;
- audit history;
- backend integration (Phase 5).

### Team requirements → where they land

| # | Team requirement (xlsx G6–G12) | Phase |
|---|---|---|
| 1 | Alert before contract end (60 days) | 3a — §5 |
| 2 | Add / remove user accounts | 3b |
| 3 | Grant some users upload / edit / delete | 3a enforcement (§4); 3b assignment UI |
| 4 | Restrict some users to view-only | 3a enforcement; 3b assignment UI |
| 5 | Restrict download to Admin or the department's main user | 3a — §4 |
| 6 | Contact channel for reporting problems | 3a — §6.6 |
| 7 | Dashboard | 3a — §6.1 |

## 2. Data model

### 2.1 `GeneralContract` (replaces the draft in Frontend_LCMS_Project.md §6)

| Field | Lao label | Type | Required | Rules |
|---|---|---|---|---|
| `id` | — | `ID` | server | |
| `title` | ຊື່ສັນຍາ | string | ✓ | trimmed, 1–300 chars |
| `type` | ປະເພດສັນຍາ | `GcContractType` (14 keys, §2.2) | ✓ | |
| `contractNo` | ເລກທີ | string | ✓ | unique; uniqueness enforced by the server (mock returns 409 → field error) |
| `counterparty` | ຄູ່ສັນຍາ | string | — | added by agreement; not in the xlsx |
| `termText` | ອາຍຸສັນຍາ | string | — | free text, as the team asked. The form offers a suggestion computed from effective→end (e.g. "5 ປີ 3 ເດືອນ") that the user can accept or edit |
| `signedDate` | ມື້ລົງລາຍເຊັນ | `ISODate` | ✓ | date picker |
| `effectiveDate` | ມື້ມີຜົນບັງຄັບໃຊ້ | `ISODate` | ✓ | date picker |
| `endDate` | ມື້ສິ້ນສຸດ | `ISODate` | — | date picker. Must be > `effectiveDate`. Empty means open-ended: no alerts, never expires |
| `value` | ມູນຄ່າ | `Money` with currency `LAK` \| `USD` \| `CNY` | — | amount > 0 |
| `equity` | ສັດສ່ວນຫຸ້ນ ຫຼື ຈຳນວນເງິນປະກອບທຶນ | `{ kind: 'percent'; percent: number }` \| `{ kind: 'amount'; money: Money }` | — | percent 0 < p ≤ 100; amount > 0 |
| `implementer` | ຜູ້ຈັດຕັ້ງປະຕິບັດ | string | — | |
| `notes` | ລາຍລະອຽດເພີ່ມເຕີມ | string | — | ≤ 2000 chars |
| `documents` | ເອກະສານແນບ | `DocumentFile[]` | — | §2.4 |
| `createdAt`, `updatedAt`, `createdBy` | — | server | | display only |

`status` is **not stored**. It is derived (§2.3).

### 2.2 Contract types (`GcContractType`)

The keys are English; the labels come from the xlsx and live in `lo.gc.types`:

| Key | Lao label |
|---|---|
| `om_service` | ສັນຍາ ບໍລິການ O&M |
| `equipment_lease` | ສັນຍາ ເຊົ່າອຸປະກອນພາກສະຖານີ-ສາຍສົ່ງ |
| `land_lease` | ສັນຍາ ເຊົ່າພື້ນທີ່ດິນ |
| `epc` | ສັນຍາ ຮັບເໝົາກໍ່ສ້າງ (EPC) |
| `pole_attachment` | ສັນຍາ ບໍລິການເກາະຫ້ອຍ |
| `bill_collection` | ສັນຍາບໍລິການ ຮັບຊຳລະຄ່າກະແສໄຟຟ້າ |
| `opgw_lease` | ສັນຍາ ບໍລິການເຊົ່າສາຍ OPGW |
| `current_deposit` | ສັນຍາ ບໍລິການເງິນຝາກກະແສລາຍວັນ |
| `edl_app_payment` | ສັນຍາບໍລິການນຳໃຊ້ຜະລິດຕະພັນຊຳລະເງິນ ຂອງ ທະນາຄານ ໃນ EDL App |
| `cooperation` | ສັນຍາຮ່ວມມື ແລະ ສັນຍາຮ່ວມທຸລະກິດ |
| `shareholding` | ສັນຍາຮ່ວມຫຸ້ນ |
| `pta` | ສັນຍາບໍລິການຜ່ານສາຍສົ່ງ (PTA) |
| `moa` | ບົດບັນທຶກຂໍ້ຕົກລົງ (MOA) |
| `other_assigned` | ສັນຍາອື່ນໆ ທີ່ຖືກມອບໝາຍໂດຍກົງ |

The xlsx has `ໂດຍຕົງ`, which looks like a typo for `ໂດຍກົງ`; flagged for native-speaker review.

### 2.3 Derived status

`deriveGcStatus(c, today): GcStatus` is a pure function shared by the client and the mock server.

| Status | Rule | Lao label | Tone |
|---|---|---|---|
| `pending` | today < effectiveDate | ລໍຖ້າມີຜົນ | blue |
| `active` | effective ≤ today and (no endDate or daysLeft(endDate) > 60) | ມີຜົນບັງຄັບໃຊ້ | emerald |
| `expiring` | 0 ≤ daysLeft(endDate) ≤ 60 | ໃກ້ໝົດອາຍຸ | amber |
| `expired` | daysLeft(endDate) < 0 | ໝົດອາຍຸ | rose |

`pending` is new. The shared `ContractStatus` union stays as it is; GC uses its own `GcStatus` union, mapped to the existing tones and badge component.

### 2.4 Attached files

- Many files per contract (the main contract plus annexes).
- Accepted types: PDF, DOC/DOCX, JPG/PNG. Maximum `NEXT_PUBLIC_MAX_UPLOAD_MB` (50) per file.
- Everyone with `view` sees the file list: name, size, uploader, date.
- Download needs the `download` permission (§4).
- Files are uploaded through the shared documents feature with `entityType: 'gc'`.
- In mock mode, files live in memory (object URLs) until the page reloads.

## 3. Shared type changes (affect all modules)

1. `Money.currency` adds `'CNY'`. The GC form offers exactly LAK, USD and CNY, labelled ກີບ, USD, ຢວນ. Other modules keep their own currency lists.
2. `Permission` adds `'download'`.
3. A new `ModuleRole = 'viewer' | 'editor' | 'main'` and `ROLE_PERMISSIONS`:

   | Role | Lao | view | create (incl. upload) | edit | delete | download |
   |---|---|---|---|---|---|---|
   | viewer | ດູຢ່າງດຽວ | ✓ | | | | |
   | editor | ຜູ້ແກ້ໄຂ | ✓ | ✓ | ✓ | ✓ | |
   | main | User ຫຼັກ | ✓ | ✓ | ✓ | ✓ | ✓ |

4. `User` gains `moduleRoles: Partial<Record<ModuleKey, ModuleRole>>`, which replaces the optional `permissions` field.
   - `modules` stays as the access list.
   - A module that is in `modules` but has no role means `viewer`.
   - Admin has every permission in every module and is the only role that can manage users (3b).
5. `hasPermission(u, m, p)` is reimplemented on top of `moduleRoles` and `ROLE_PERMISSIONS`. Its signature is unchanged.

## 4. Permission enforcement (Design.md §11: hidden, not disabled)

- A `<Can module permission>` component, plus a `useCan(module, permission)` hook, hides controls the user cannot use.
  - Create button and wizard route: `create`
  - Edit: `edit`
  - Delete: `delete`
  - Upload zone: `create`
  - Download buttons: `download`
- **Routes:** opening `/contracts/new` without `create` redirects to `/forbidden`.
- **Server truth in mock mode:** the mock handlers check the session user's permissions and return **403** on violation, for both mutations and the download endpoint. The UI shows `lo.errors.forbidden` if a hidden action is ever reached.
- **Mock users added:**
  - `gc.viewer`: viewer
  - `gc.editor`: editor
  - `gc.user`: main
  - `multi.user`: ppa viewer, gc editor
  - `admin`: unchanged (all permissions)

## 5. Alerts

- Windows for GC are **60 / 30 / 7 days before endDate, plus the end day**: `GC_ALERT_DAYS = [60, 30, 7, 0]`.
- The mock server generates one alert per contract per crossed window, from each contract's `endDate`. `dueDate = endDate`; the title is the contract title.
- Open-ended contracts generate none.
- Badges keep the Design.md §2.6 colours (≤7 rose, 8–30 amber, 31–90 blue). The 60-day threshold drives the `expiring` status (§2.3) and the alert list.
- The bell, the Home upcoming list and the buckets already consume `Alert`. They pick up GC alerts with no change.
- `/contracts/alerts` lists GC alerts grouped by window (overdue/today, ≤7, ≤30, ≤60), with mark-as-read. A row links to the contract detail page.

## 6. Screens

All screens follow Design.md §5/§6 and must have skeleton, empty, error and forbidden states. All data is fetched on the client (AGENT_GUIDE §6.1 gate 7).

### 6.1 Dashboard `/contracts`

- **KPI row:**
  - total contracts
  - active
  - expiring (≤60 days) — warning variant
  - expired — danger variant
- **Value totals per currency** (LAK, USD, CNY): three KPI tiles, no conversion. Only contracts that have a value are counted.
- **Charts:**
  - contracts by type: horizontal BarList, GC accent gradient `#4F46E5→#8B9CFF`;
  - status distribution: stacked bar, status colours only.
- **Upcoming expirations:** the next 90 days, with countdown badges; rows link to the detail page.
- **Support card** (§6.6).

### 6.2 List `/contracts/list`

- **DataTable columns:**
  - ເລກທີ (links to the detail page)
  - ຊື່ສັນຍາ
  - ປະເພດ
  - ຄູ່ສັນຍາ
  - ມື້ສິ້ນສຸດ
  - ມູນຄ່າ
  - ສະຖານະ (badge)
  - countdown
  - actions (icon buttons, permission-gated)
- **Filters**, synced to the URL:
  - search `q` over title, contractNo and counterparty
  - type
  - status chips
- **Sorting:** endDate (default ascending), signedDate, title.
- **Pagination:** 10 / 20 / 50 per page. The footer reads "ສະແດງ X ຈາກ Y".
- **Create** (`create` permission): a modal form for quick entry, plus a link to the full wizard.
- **Delete:** a ConfirmDialog, then a toast.

### 6.3 Detail `/contracts/[id]`

- **Header:** eyebrow `GC`, serif title, status badge, countdown. Actions: Edit and Delete, both permission-gated.
- **Info grid:** every field from §2.1, with money and percent formatted.
- **Timeline of key dates:** signed → effective → alert windows → end.
- **Documents panel:** file list. Download needs `download`; the upload dropzone needs `create`.
- A 404 shows an EmptyState with a link back to the list.

### 6.4 Create / Edit

- One zod schema, `gc.schema.ts`, is shared by the modal and the wizard. Messages are in Lao, and server `fieldErrors` (including the 409 for a duplicate contractNo) map onto fields.
- **Wizard `/contracts/new`**, 4 steps, with a live summary aside:
  1. ຂໍ້ມູນທົ່ວໄປ: title, type, contractNo, counterparty, implementer
  2. ວັນທີ: signed, effective, end, term suggestion
  3. ມູນຄ່າ ແລະ ຫຸ້ນ: value, equity
  4. ເອກະສານ ແລະ ກວດສອບ: files, notes, review
- **Edit** reuses the modal, prefilled.

### 6.5 Alerts `/contracts/alerts` — see §5.

### 6.6 Support contact (team requirement 6)

- `src/config/support.ts` holds the contact channels: phone, email, and optionally an internal chat link. Until real values are supplied, it uses sample values: phone `+856 21 000 000`, email `support@lcms.example` (the user's instruction on 2026-10-20). Replacing them is a one-file change.
- The channels appear in two places:
  - a "ຕິດຕໍ່ແຈ້ງບັນຫາ" item in the user menu, which opens a small dialog with the channels;
  - a support card on the GC dashboard.

## 7. Architecture

- `src/features/gc/`, following AGENT_GUIDE §5.1:
  - `types.ts`
  - `schemas/gc.schema.ts`
  - `lib/derive-status.ts`
  - `api/gc.service.ts`
  - `mocks/gc.mock.ts`: about 40 contracts covering all 14 types, all 4 statuses and all 3 currencies; dates relative to today
  - `store/gc-list.store.ts`: generation counter, URL sync, registered in the logout-reset registry
  - `components/*`
  - `index.ts`
- Endpoints, from the spec §5 table:
  - `GET/POST /contracts`
  - `GET/PATCH/DELETE /contracts/:id`
  - `GET /contracts/dashboard`
  - documents through `features/documents`
- Route files under `src/app/(app)/contracts/` stay thin. Navigation highlights `/contracts/[id]` under the list item (AGENT_GUIDE gate 6).
- **Reused shared pieces** (taken from 6beeff9 and fixed in Part 0, §10): DataTable, FilterChips, ConfirmDialog, Stepper, Timeline, FileDropzone/FileList, the BarList and StackedStatusBar charts, the documents feature, `logout-registry` and `useMounted`.
- **New shared pieces:**
  - `DatePicker`: a Popover with the shadcn Calendar, Monday-first, Lao months and weekdays, `dd/mm/yyyy` display;
  - `MoneyInput`: amount plus a currency select;
  - `Can` / `useCan`.

## 8. Testing

- **Unit:**
  - `deriveGcStatus` boundaries: 61/60/0/−1 days, pending, open-ended
  - schema rules: date order, percent bounds, required fields
  - `ROLE_PERMISSIONS` and `hasPermission`
  - alert generation (60/30/7/0, open-ended → none)
  - the store's generation counter and URL sync
  - `DatePicker` and `MoneyInput`
  - `Can` hiding
- **Component:**
  - the list hides actions per role
  - the form maps the 409 to the contractNo field
  - the wizard step validation
- **E2E** (desktop and mobile):
  - `gc.viewer` sees no create, edit, delete or download controls, and `/contracts/new` sends them to `/forbidden`
  - `gc.editor` creates a contract through the modal and finds it in the list (search), edits it, deletes it, and has no download
  - `gc.user` downloads a file
  - the alerts page shows a contract that is 60 days from its end
  - axe and no-horizontal-scroll checks on all four GC routes, in both themes
- **Definition of Done:** Frontend_LCMS_Project.md §12, in full.

## 9. Changes to existing specs

1. Frontend_LCMS_Project.md §6:
   - `GeneralContract.category` (6 values) → `type` (14 values)
   - `value` becomes optional
   - adds `termText`, `signedDate`, `effectiveDate`, `equity`, `implementer`, `notes`
   - removes `departmentId`, `autoRenew` and the stored `status`
2. `Money.currency` adds `CNY`.
3. `Permission` adds `download`; `ModuleRole` and `User.moduleRoles` are new; `User.permissions` is removed.
4. Design.md §2.6 alert schedule: GC uses 60/30/7/0 instead of the 90/30/7 default.
5. GC status set as in §2.3, including the new `pending` status.

## 10. Dependency on the PPA WIP (decided)

Uncommitted Phase 2 PPA work was found and preserved as `phase-2-ppa-wip` (6beeff9). The review is in `docs/superpowers/specs/2026-10-20-ppa-wip-review.md`. Its verdict: **build on it, after fixes**.

**What this means for 3a:**

- `phase-3a-gc` branches from 6beeff9.
- **Part 0** of the 3a plan fixes the shared pieces GC reuses: review §1 items 1–17. It also corrects the WIP plan doc (item 18).
- Part 0 runs before any GC feature task.
- The PPA feature code is **not** used as a template. GC follows AGENT_GUIDE §5.2 instead:
  - URL-synced filters;
  - filtering and pagination done on the server;
  - a generation counter;
  - registration in the logout-reset registry.
- Lao literals inside the PPA views are left for the Phase 2 rework, once the PPA team confirms its requirements.

**Rulings:**

- **Documents endpoint shape.** Keep the existing generic form, `GET /documents?entityType=gc&entityId=…`, plus `POST /documents` and `GET /documents/:id/download`. It already serves every module. The difference from the spec's `GET /:entity/:id/documents` is recorded for the backend checklist. *Cost if wrong:* `endpoints.ts` changes when the backend arrives.
- **`instant = false` and `experimental.instantInsights`** (from the WIP). Remove them in Part 0. They only opt out of dev-time validation, and nothing reviewed depends on them. *Cost if wrong:* the dev overlay shows instant-navigation warnings again.

## 11. Open items for the GC team (do not block 3a)

- Real support contact details (§6.6).
- Native-speaker review of the new Lao strings and of the xlsx typos noted in §2.2.
- ~~Open-ended contracts by type~~ — decided 2026-10-20: allowed for **every** type.
