# Lao Copy Review Sheet (Phase 5 Backend Integration)

This document lists all Lao localization strings in `src/lib/i18n/lo.ts` that were added or modified in Phase 5 (compared to `phase-4a-legal`).

### Instructions for Native Reviewer
1. Review the **Current Lao Text** in the table below.
2. If the text looks natural and accurate in Lao government/enterprise legal context, leave **Corrected Lao Text** blank.
3. If changes are suggested, enter the corrected Lao phrasing in the **Corrected Lao Text** column.
4. **Note**: Keys marked as **"Backend verbatim ... enum"** correspond directly to backend API enum values and specifications in `FRONTEND_API_SUMMARY.md`. Do not alter these unless the backend contract itself changes.

---

| Key | Current Lao Text | Where it appears (component/route) | Note | Corrected Lao Text |
|---|---|---|---|---|
| `common.appSubtitle` | ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ | `src/app/(auth)/layout.tsx, src/app/(auth)/_brand-panel.tsx, src/components/layout/app-sidebar.tsx` |  |  |
| `common.loading` | ກຳລັງໂຫຼດ... | `src/components/guards/auth-gate.tsx, src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/contract-types/contract-types-view.test.tsx` |  |  |
| `common.close` | ປິດ | `src/components/shared/confirm-dialog.test.tsx, src/components/ui/dialog.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `common.required` | ຈຳເປັນ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `common.home` | ໜ້າຫຼັກ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/app-sidebar.tsx, src/components/layout/breadcrumbs.tsx` |  |  |
| `common.underConstruction` | ໜ້ານີ້ກຳລັງພັດທະນາ | `src/app/(app)/forbidden/page.tsx, src/app/(auth)/layout.tsx` |  |  |
| `common.backHome` | ກັບໄປໜ້າຫຼັກ | `src/app/(app)/forbidden/page.tsx, src/app/not-found.tsx` |  |  |
| `common.retry` | ລອງໃໝ່ | `src/app/error.tsx, src/components/guards/auth-gate.test.tsx, src/components/guards/auth-gate.tsx` |  |  |
| `common.showing` | [Dynamic template function] | `src/components/shared/data-table.test.tsx, src/components/shared/data-table.tsx` |  |  |
| `modules.ppa` | ສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/app/(auth)/_brand-panel.tsx, src/components/layout/app-sidebar.test.tsx, src/lib/constants/modules.ts` |  |  |
| `modules.gc` | ສັນຍາທົ່ວໄປ | `src/app/(auth)/_brand-panel.tsx, src/components/layout/app-sidebar.test.tsx, src/lib/constants/modules.ts` |  |  |
| `modules.legal` | ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ | `src/app/(auth)/_brand-panel.tsx, src/components/layout/app-sidebar.test.tsx, src/lib/constants/modules.ts` |  |  |
| `roles.ADMIN` | ຜູ້ດູແລລະບົບ | `src/features/users/components/user-form-dialog.test.tsx` | Backend verbatim role enum — do not change unless backend changes |  |
| `roles.MAIN_USER` | ຜູ້ໃຊ້ຫຼັກ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/topbar.test.tsx` | Backend verbatim role enum — do not change unless backend changes |  |
| `roles.EDITOR` | ຜູ້ແກ້ໄຂ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/users-view.test.tsx` | Backend verbatim role enum — do not change unless backend changes |  |
| `roles.VIEWER` | ຜູ້ເບິ່ງ | `src/features/users/components/users-view.test.tsx` | Backend verbatim role enum — do not change unless backend changes |  |
| `status.DRAFT` | ຮ່າງ | `src/components/charts/stacked-status-bar.test.tsx, src/lib/constants/status.test.ts, src/lib/constants/status.ts` | Backend verbatim status enum — do not change unless backend changes |  |
| `status.ACTIVE` | ມີຜົນບັງຄັບໃຊ້ | `src/components/charts/stacked-status-bar.test.tsx, src/lib/constants/status.ts` | Backend verbatim status enum — do not change unless backend changes |  |
| `status.EXPIRING_SOON` | ໃກ້ໝົດອາຍຸ | `src/features/ppa/components/ppa-contracts-view.test.tsx, src/lib/constants/status.ts` | Backend verbatim status enum — do not change unless backend changes |  |
| `status.EXPIRED` | ໝົດອາຍຸແລ້ວ | `src/lib/constants/status.ts` | Backend verbatim status enum — do not change unless backend changes |  |
| `status.TERMINATED` | ຍົກເລີກກ່ອນກຳນົດ | `src/lib/constants/status.ts` | Backend verbatim status enum — do not change unless backend changes |  |
| `countdown.daysLeft` | [Dynamic template function] | `src/lib/utils/countdown.ts` |  |  |
| `countdown.today` | ມື້ນີ້ | `src/lib/utils/countdown.ts` |  |  |
| `countdown.overdue` | [Dynamic template function] | `src/lib/utils/countdown.ts` |  |  |
| `date.monthsShort.0` | ມ.ກ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.1` | ກ.ພ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.2` | ມ.ນ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.3` | ເມ.ສ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.4` | ພ.ພ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.5` | ມິ.ຖ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.6` | ກ.ລ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.7` | ສ.ຫ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.8` | ກ.ຍ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.9` | ຕ.ລ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.10` | ພ.ຈ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.monthsShort.11` | ທ.ວ. | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.weekdays.0` | ຈ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.weekdays.1` | ອ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.weekdays.2` | ພ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.weekdays.3` | ພຫ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.weekdays.4` | ສຸ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.weekdays.5` | ເສົາ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `date.weekdays.6` | ອາ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `datePicker.open` | ເລືອກວັນທີ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `datePicker.clear` | ລ້າງວັນທີ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `datePicker.placeholder` | ເລືອກວັນທີ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `datePicker.prevMonth` | ເດືອນກ່ອນ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `datePicker.nextMonth` | ເດືອນຖັດໄປ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `datePicker.today` | ມື້ນີ້ | `src/components/shared/date-picker.tsx, src/features/legal/cases/components/legal-case-form-dialog.test.tsx, src/features/legal/cases/components/legal-case-wizard.test.tsx` |  |  |
| `datePicker.selected` | ເລືອກແລ້ວ | `src/components/shared/date-picker.tsx` |  |  |
| `datePicker.month` | ເດືອນ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `datePicker.year` | ປີ | `src/components/shared/date-picker.test.tsx, src/components/shared/date-picker.tsx` |  |  |
| `currency.LAK` | ກີບ | `src/components/shared/money-input.test.tsx` |  |  |
| `currency.CNY` | ຢວນ | `src/components/shared/money-input.test.tsx, src/components/shared/money-input.tsx` |  |  |
| `currency.THB` | ບາດ | `src/components/shared/money-input.test.tsx, src/components/shared/money-input.tsx` |  |  |
| `money.amount` | ຈຳນວນເງິນ | `src/components/shared/money-input.test.tsx` |  |  |
| `money.currency` | ສະກຸນເງິນ | `src/components/shared/money-input.test.tsx, src/components/shared/money-input.tsx` |  |  |
| `auth.loginTitle` | ເຂົ້າສູ່ລະບົບ | `src/features/auth/components/login-form.tsx` |  |  |
| `auth.username` | ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດພະນັກງານ | `src/features/auth/components/login-form.test.tsx, src/features/auth/components/login-form.tsx` |  |  |
| `auth.password` | ລະຫັດຜ່ານ | `src/features/auth/components/login-form.test.tsx, src/features/auth/components/login-form.tsx` |  |  |
| `auth.remember` | ຈື່ຂ້ອຍໄວ້ | `src/features/auth/components/login-form.tsx` |  |  |
| `auth.forgot` | ລືມລະຫັດຜ່ານ? | `src/features/auth/components/forgot-password-form.test.tsx, src/features/auth/components/forgot-password-form.tsx, src/features/auth/components/login-form.tsx` |  |  |
| `auth.submit` | ເຂົ້າສູ່ລະບົບ | `src/features/auth/components/login-form.test.tsx, src/features/auth/components/login-form.tsx` |  |  |
| `auth.showPassword` | ສະແດງລະຫັດຜ່ານ | `src/features/auth/components/login-form.test.tsx, src/features/auth/components/login-form.tsx` |  |  |
| `auth.hidePassword` | ເຊື່ອງລະຫັດຜ່ານ | `src/features/auth/components/login-form.test.tsx, src/features/auth/components/login-form.tsx` |  |  |
| `auth.logout` | ອອກຈາກລະບົບ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `auth.sessionExpired` | ໝົດເວລາເຂົ້າໃຊ້ ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່ | `src/features/auth/components/login-form.test.tsx, src/features/auth/components/login-form.tsx, src/lib/api/errors.test.ts` |  |  |
| `auth.forgotTitle` | ລືມລະຫັດຜ່ານ | `src/features/auth/components/forgot-password-form.test.tsx, src/features/auth/components/forgot-password-form.tsx` |  |  |
| `auth.backToLogin` | ກັບໄປໜ້າເຂົ້າສູ່ລະບົບ | `src/features/auth/components/forgot-password-form.test.tsx, src/features/auth/components/forgot-password-form.tsx` |  |  |
| `auth.brandHeading` | ບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ ຢ່າງເປັນລະບົບ | `src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.brandIntro` | ລວມສັນຍາພະລັງງານ ສັນຍາທົ່ວໄປ ແລະ ນິຕິກຳ ໄວ້ໃນບ່ອນດຽວ ພ້ອມການແຈ້ງເຕືອນກຳນົດເວລາ | `src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.welcomeSubtitle` | ກະລຸນາປ້ອນຂໍ້ມູນບັນຊີຂອງທ່ານ ເພື່ອເຂົ້າສູ່ລະບົບ | `src/features/auth/components/login-form.tsx` |  |  |
| `auth.systemStatus` | ລະບົບພ້ອມໃຊ້ງານ | `src/app/(auth)/layout.tsx` |  |  |
| `auth.secureConnection` | ລະບົບເຊື່ອມຕໍ່ດ້ວຍການເຂົ້າລະຫັດ SSL 256-bit | `src/app/(auth)/layout.tsx, src/features/auth/components/login-form.tsx` |  |  |
| `auth.footerCopyright` | © 2026 LCMS. ສະຫງວນລິຂະສິດ. ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ | `src/app/(auth)/layout.tsx` |  |  |
| `auth.complianceTag` | ມາດຕະຖານຄວາມປອດໄພລະດັບອົງກອນ | `src/app/(auth)/layout.tsx` |  |  |
| `auth.supportContact` | ຕິດຕໍ່ຝ່າຍສະໜັບສະໜູນ | `src/app/(auth)/layout.tsx, src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.ppaFeatureDesc` | ຕິດຕາມ COD, tariff ແລະ ຜົນຜະລິດພະລັງງານໄຟຟ້າ | `src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.gcFeatureDesc` | ຄຸ້ມຄອງສັນຍາທຸລະກິດ, ຈັດຊື້-ຈັດຈ້າງ ແລະ ພັນທະສັນຍາ | `src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.legalFeatureDesc` | ຄຸ້ມຄອງລະບຽບກົດໝາຍ, ຕິດຕາມຄະດີ ແລະ ການໄຕ່ສວນສານ | `src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.trustBankSecurity` | ຄວາມປອດໄພລະດັບສູງ | `src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.trustSmartAlerts` | ແຈ້ງເຕືອນອັດຕະໂນມັດ 90/30/7 ມື້ | `src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.trustAuditTrail` | ກວດສອບຍ້ອນຫຼັງໄດ້ 100% | `src/app/(auth)/_brand-panel.tsx` |  |  |
| `auth.forgotIntro` | ລະບົບບໍ່ສາມາດຣີເຊັດລະຫັດຜ່ານດ້ວຍຕົນເອງໄດ້ | `src/features/auth/components/forgot-password-form.tsx` |  |  |
| `auth.forgotContactIt` | ກະລຸນາຕິດຕໍ່ ພະແນກ IT / HRM ເພື່ອຕັ້ງລະຫັດຜ່ານໃໝ່ | `src/features/auth/components/forgot-password-form.test.tsx, src/features/auth/components/forgot-password-form.tsx` |  |  |
| `auth.forgotContactLabel` | ຊ່ອງທາງຕິດຕໍ່ | `src/features/auth/components/forgot-password-form.tsx` |  |  |
| `validation.usernameRequired` | ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ | `src/features/auth/components/login-form.test.tsx, src/features/auth/schemas/login.schema.test.ts, src/features/auth/schemas/login.schema.ts` |  |  |
| `validation.passwordRequired` | ກະລຸນາປ້ອນລະຫັດຜ່ານ | `src/features/auth/components/login-form.test.tsx, src/features/auth/schemas/login.schema.test.ts, src/features/auth/schemas/login.schema.ts` |  |  |
| `errors.invalidCredentials` | ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ | `src/features/auth/components/login-form.test.tsx, src/lib/api/errors.test.ts, src/lib/api/errors.ts` |  |  |
| `errors.network` | ບໍ່ສາມາດເຊື່ອມຕໍ່ເຊີບເວີໄດ້ | `src/features/documents/components/document-manager.test.tsx, src/lib/api/errors.test.ts, src/lib/api/errors.ts` |  |  |
| `errors.timeout` | ເຊີບເວີຕອບສະໜອງຊ້າເກີນໄປ ກະລຸນາລອງໃໝ່ | `src/lib/api/errors.test.ts, src/lib/api/errors.ts` |  |  |
| `errors.forbidden` | ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້ | `src/app/(app)/forbidden/page.tsx, src/lib/api/errors.test.ts, src/lib/api/errors.ts` |  |  |
| `errors.notFound` | ບໍ່ພົບຂໍ້ມູນ | `src/lib/api/errors.test.ts, src/lib/api/errors.ts` |  |  |
| `errors.server` | ເກີດຂໍ້ຜິດພາດໃນລະບົບ ກະລຸນາລອງໃໝ່ | `src/features/gc/components/gc-contracts-view.test.tsx, src/features/support/components/support-view.test.tsx, src/lib/api/errors.test.ts` |  |  |
| `errors.unknown` | ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່ | `src/app/error.tsx, src/components/guards/auth-gate.tsx, src/features/admin/use-remote.ts` |  |  |
| `errors.pageNotFound` | ບໍ່ພົບໜ້າທີ່ທ່ານຊອກຫາ | `src/app/not-found.tsx` |  |  |
| `topbar.themeToggle` | ປ່ຽນໂໝດສີ | `src/components/layout/theme-toggle.test.tsx, src/components/layout/theme-toggle.tsx` |  |  |
| `topbar.notifications` | ການແຈ້ງເຕືອນ | `src/components/layout/notification-menu.test.tsx, src/components/layout/notification-menu.tsx, src/features/notifications/components/notifications-view.tsx` |  |  |
| `topbar.userMenu` | ເມນູຜູ້ໃຊ້ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `topbar.unread` | ຍັງບໍ່ໄດ້ອ່ານ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/app-sidebar.tsx, src/components/layout/notification-menu.test.tsx` |  |  |
| `topbar.breadcrumb` | ເສັ້ນທາງນຳທາງ | `src/components/layout/breadcrumbs.tsx` |  |  |
| `topbar.menu` | ເປີດເມນູນຳທາງ | `src/components/layout/app-shell.test.tsx, src/components/layout/topbar.test.tsx, src/components/layout/topbar.tsx` |  |  |
| `topbar.seeAll` | ເບິ່ງທັງໝົດ | `src/components/layout/notification-menu.test.tsx, src/components/layout/notification-menu.tsx` |  |  |
| `topbar.latestNotifications` | ການແຈ້ງເຕືອນຫຼ້າສຸດ | `src/components/layout/notification-menu.tsx` |  |  |
| `notifications.filterLabel` | ແຫຼ່ງການແຈ້ງເຕືອນ | `src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.all` | ທັງໝົດ | `src/features/notifications/components/notifications-view.test.tsx, src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.sourceContracts` | ສັນຍາທົ່ວໄປ | `src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.sourcePower` | ສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/notifications/components/notifications-view.test.tsx, src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.unreadOnly` | ສະເພາະທີ່ຍັງບໍ່ໄດ້ອ່ານ | `src/features/notifications/components/notifications-view.test.tsx, src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.markRead` | ໝາຍວ່າອ່ານແລ້ວ | `src/features/notifications/components/notifications-view.test.tsx, src/features/notifications/components/notifications-view.tsx, src/features/ppa/components/ppa-alerts-view.tsx` |  |  |
| `notifications.markAllRead` | ໝາຍທັງໝົດວ່າອ່ານແລ້ວ | `src/components/layout/notification-menu.test.tsx, src/components/layout/notification-menu.tsx, src/features/notifications/components/notifications-view.test.tsx` |  |  |
| `notifications.read` | ອ່ານແລ້ວ | `src/components/layout/notification-menu.tsx, src/features/notifications/components/notifications-view.test.tsx, src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.unread` | ຍັງບໍ່ໄດ້ອ່ານ | `src/components/layout/notification-menu.test.tsx, src/components/layout/notification-menu.tsx, src/features/notifications/components/notifications-view.test.tsx` |  |  |
| `notifications.expires` | ວັນໝົດອາຍຸ | `src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.empty` | ບໍ່ມີການແຈ້ງເຕືອນ | `src/components/layout/notification-menu.test.tsx, src/components/layout/notification-menu.tsx, src/features/notifications/components/notifications-view.test.tsx` |  |  |
| `notifications.emptyUnread` | ບໍ່ມີການແຈ້ງເຕືອນທີ່ຍັງບໍ່ໄດ້ອ່ານ | `src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.loadError` | ບໍ່ສາມາດໂຫຼດການແຈ້ງເຕືອນໄດ້ | `src/features/notifications/components/notifications-view.tsx` |  |  |
| `notifications.list` | ລາຍການແຈ້ງເຕືອນ | `src/features/notifications/components/notifications-view.tsx` |  |  |
| `home.title` | ສູນກາງບໍລິຫານສັນຍາ | `src/features/home/components/home-view.tsx` |  |  |
| `home.welcomeSubtitle` | ພາບລວມສັນຍາ, ພັນທະ ແລະ ກຳນົດເວລາສຳຄັນທົ່ວອົງກອນ | `src/features/home/components/home-view.tsx` |  |  |
| `home.viewAllAlerts` | ເບິ່ງການແຈ້ງເຕືອນທັງໝົດ | `src/features/home/components/home-view.test.tsx, src/features/home/components/notifications-summary.tsx` |  |  |
| `home.ppaSubtitle` | ສັນຍາຊື້-ຂາຍໄຟຟ້າ & ພະລັງງານ | `src/features/home/components/module-card.tsx` |  |  |
| `home.gcSubtitle` | ສັນຍາທົ່ວໄປ, ການຄ້າ & ຈັດຊື້-ຈັດຈ້າງ | `src/features/gc/components/gc-dashboard-view.tsx, src/features/home/components/module-card.tsx` |  |  |
| `home.legalSubtitle` | ນິຕິກຳ, ລະບຽບການ & ຄະດີຄວາມ | `src/features/home/components/module-card.tsx` |  |  |
| `home.upcomingTitle` | ສັນຍາໃກ້ໝົດອາຍຸ | `src/features/home/components/home-view.tsx` |  |  |
| `home.notificationsTitle` | ການແຈ້ງເຕືອນ | `src/features/home/components/home-view.tsx` |  |  |
| `home.unreadCount` | [Dynamic template function] | `src/features/home/components/notifications-summary.tsx` |  |  |
| `home.noNotifications` | ບໍ່ມີການແຈ້ງເຕືອນ | `src/features/home/components/notifications-summary.tsx` |  |  |
| `home.itemsCount` | [Dynamic template function] | `src/features/home/components/home-view.tsx` |  |  |
| `home.openModule` | ເຂົ້າສູ່ໂມດູນ | `src/features/home/components/home-view.test.tsx, src/features/home/components/module-card.tsx` |  |  |
| `home.noUpcoming` | ບໍ່ມີສັນຍາໃກ້ໝົດອາຍຸ | `src/features/home/components/upcoming-list.tsx` |  |  |
| `home.noUpcomingDesc` | ສັນຍາທັງໝົດຢູ່ໃນກຳນົດເວລາປົກກະຕິ | `src/features/home/components/upcoming-list.tsx` |  |  |
| `home.upcomingLoadError` | ບໍ່ສາມາດໂຫຼດລາຍການສັນຍາໃກ້ໝົດອາຍຸໄດ້ບາງສ່ວນ | `src/features/home/components/home-view.tsx` |  |  |
| `home.moduleLoadError` | ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໂມດູນນີ້ໄດ້ | `src/features/home/components/home-view.test.tsx, src/features/home/components/module-card.tsx` |  |  |
| `home.noModulesTitle` | ຍັງບໍ່ມີສິດເຂົ້າເຖິງໂມດູນໃດ | `src/features/home/components/home-view.test.tsx, src/features/home/components/home-view.tsx` |  |  |
| `home.noModulesDesc` | ບັນຊີຂອງທ່ານຍັງບໍ່ໄດ້ຮັບສິດເຂົ້າໃຊ້ໂມດູນທຸລະກິດ ກະລຸນາຕິດຕໍ່ຝ່າຍສະໜັບສະໜູນ | `src/features/home/components/home-view.tsx` |  |  |
| `home.contactSupport` | ຕິດຕໍ່ຝ່າຍສະໜັບສະໜູນ | `src/features/home/components/home-view.test.tsx, src/features/home/components/home-view.tsx` |  |  |
| `home.stats.total` | ທັງໝົດ | `src/features/home/components/home-view.test.tsx, src/features/home/lib/build-home-view.ts` |  |  |
| `home.stats.active` | ມີຜົນບັງຄັບໃຊ້ | `src/features/home/lib/build-home-view.ts` |  |  |
| `home.stats.expiring` | ໃກ້ໝົດອາຍຸ | `src/features/home/lib/build-home-view.ts` |  |  |
| `home.stats.capacity` | ກຳລັງການຜະລິດ (MW) | `src/features/home/lib/build-home-view.ts` |  |  |
| `home.stats.docsTotal` | ນິຕິກຳທັງໝົດ | `src/features/home/lib/build-home-view.ts` |  |  |
| `home.stats.docsActive` | ນິຕິກຳທີ່ມີຜົນ | `src/features/home/lib/build-home-view.ts` |  |  |
| `home.stats.casesTotal` | ຄະດີທັງໝົດ | `src/features/home/lib/build-home-view.ts` |  |  |
| `home.stats.casesOpen` | ຄະດີທີ່ຍັງດຳເນີນ | `src/features/home/lib/build-home-view.ts` |  |  |
| `support.title` | ຕິດຕໍ່ຝ່າຍສະໜັບສະໜູນ | `src/features/gc/components/support-card.tsx, src/features/support/components/support-view.tsx` |  |  |
| `support.menu` | ຕິດຕໍ່ແຈ້ງບັນຫາ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `support.phone` | ເບີໂທ | `src/features/gc/components/support-card.tsx` |  |  |
| `support.email` | ອີເມວ | `src/features/gc/components/support-card.tsx` |  |  |
| `support.intro` | ຕິດຕໍ່ທີມສະໜັບສະໜູນລະບົບ ເມື່ອພົບບັນຫາໃນການໃຊ້ງານ | `src/features/gc/components/support-card.tsx` |  |  |
| `support.contactsHeading` | ຊ່ອງທາງຕິດຕໍ່ | `src/features/support/components/support-view.tsx` |  |  |
| `support.contactsEmpty` | ຍັງບໍ່ມີຊ່ອງທາງຕິດຕໍ່ | `src/features/support/components/support-view.tsx` |  |  |
| `support.contactsLoadError` | ໂຫຼດຊ່ອງທາງຕິດຕໍ່ບໍ່ສຳເລັດ | `src/features/support/components/support-view.tsx` |  |  |
| `support.ticketsHeading` | ລາຍການແຈ້ງບັນຫາ | `src/features/support/components/support-view.tsx` |  |  |
| `support.ticketsCaption` | ຕາຕະລາງລາຍການແຈ້ງບັນຫາ | `src/features/support/components/support-view.tsx` |  |  |
| `support.ticketsEmpty` | ຍັງບໍ່ມີລາຍການແຈ້ງບັນຫາ | `src/features/support/components/support-view.tsx` |  |  |
| `support.ticketsLoadError` | ໂຫຼດລາຍການແຈ້ງບັນຫາບໍ່ສຳເລັດ | `src/features/support/components/support-view.tsx` |  |  |
| `support.statusFilter` | ກັ່ນຕອງຕາມສະຖານະ | `src/features/support/components/support-view.tsx` |  |  |
| `support.all` | ທັງໝົດ | `src/features/support/components/support-view.tsx` |  |  |
| `support.report` | ແຈ້ງບັນຫາ / ສະເໜີການປັບປຸງ | `src/features/support/components/support-view.test.tsx, src/features/support/components/support-view.tsx, src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.reportDescription` | ອະທິບາຍບັນຫາ ຫຼື ສິ່ງທີ່ຕ້ອງການໃຫ້ປັບປຸງ | `src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.subject` | ຫົວຂໍ້ | `src/features/support/components/support-view.test.tsx, src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.descriptionLabel` | ລາຍລະອຽດ | `src/features/support/components/support-view.test.tsx, src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.priority` | ລະດັບຄວາມສຳຄັນ | `src/features/support/components/support-view.test.tsx, src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.attachment` | ຮູບພາບປະກອບ (ຖ້າມີ) | `src/features/support/components/attachment-dialog.tsx, src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.attachmentRemove` | ລຶບຮູບພາບອອກ | `src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.submit` | ສົ່ງ | `src/features/support/components/support-view.test.tsx, src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.submitting` | ກຳລັງສົ່ງ... | `src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.cancel` | ຍົກເລີກ | `src/features/support/components/contact-form-dialog.tsx, src/features/support/components/ticket-form-dialog.tsx, src/features/support/components/ticket-update-dialog.tsx` |  |  |
| `support.created` | ສົ່ງເລື່ອງແຈ້ງບັນຫາສຳເລັດ | `src/features/support/components/ticket-form-dialog.tsx` |  |  |
| `support.colSubject` | ຫົວຂໍ້ | `src/features/support/components/support-view.tsx` |  |  |
| `support.colPriority` | ຄວາມສຳຄັນ | `src/features/support/components/support-view.tsx` |  |  |
| `support.colStatus` | ສະຖານະ | `src/features/support/components/support-view.test.tsx, src/features/support/components/support-view.tsx, src/features/support/components/ticket-update-dialog.tsx` |  |  |
| `support.colCreated` | ວັນທີແຈ້ງ | `src/features/support/components/support-view.tsx` |  |  |
| `support.colAttachment` | ຮູບພາບ | `src/features/support/components/support-view.tsx` |  |  |
| `support.colActions` | ຈັດການ | `src/features/support/components/support-view.tsx` |  |  |
| `support.viewAttachment` | ເບິ່ງຮູບພາບ | `src/features/support/components/support-view.tsx` |  |  |
| `support.viewAttachmentFor` | [Dynamic template function] | `src/features/support/components/support-view.tsx` |  |  |
| `support.attachmentLoadError` | ເປີດຮູບພາບບໍ່ສຳເລັດ | `src/features/support/components/attachment-dialog.tsx` |  |  |
| `support.attachmentTitle` | ຮູບພາບປະກອບ | `src/features/support/components/attachment-dialog.tsx` |  |  |
| `support.noAttachment` | - | `src/features/support/components/support-view.tsx` |  |  |
| `support.priorities.LOW` | ຕ່ຳ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `support.priorities.MEDIUM` | ປານກາງ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `support.priorities.HIGH` | ສູງ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `support.priorities.URGENT` | ດ່ວນ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `support.statuses.OPEN` | ເປີດໃໝ່ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `support.statuses.IN_PROGRESS` | ກຳລັງດຳເນີນການ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `support.statuses.RESOLVED` | ແກ້ໄຂແລ້ວ | `src/components/layout/topbar.test.tsx, src/components/layout/user-menu.tsx` |  |  |
| `support.statuses.CLOSED` | ປິດແລ້ວ | `src/features/support/components/support-view.test.tsx` |  |  |
| `support.adminNote` | ໝາຍເຫດຈາກຜູ້ດູແລ | `src/features/support/components/support-view.test.tsx, src/features/support/components/support-view.tsx, src/features/support/components/ticket-update-dialog.tsx` |  |  |
| `support.updateTicket` | ອັບເດດ | `src/features/support/components/support-view.test.tsx, src/features/support/components/support-view.tsx` |  |  |
| `support.updateTicketFor` | [Dynamic template function] | `src/features/support/components/support-view.test.tsx, src/features/support/components/support-view.tsx` |  |  |
| `support.updateTitle` | ອັບເດດສະຖານະລາຍການ | `src/features/support/components/ticket-update-dialog.tsx` |  |  |
| `support.updateSaved` | ອັບເດດລາຍການສຳເລັດ | `src/features/support/components/ticket-update-dialog.tsx` |  |  |
| `support.save` | ບັນທຶກ | `src/features/support/components/contact-form-dialog.tsx, src/features/support/components/support-view.test.tsx, src/features/support/components/ticket-update-dialog.tsx` |  |  |
| `support.addContact` | ເພີ່ມຊ່ອງທາງຕິດຕໍ່ | `src/features/support/components/contact-form-dialog.tsx, src/features/support/components/support-view.test.tsx, src/features/support/components/support-view.tsx` |  |  |
| `support.addContactDescription` | ເພີ່ມຊ່ອງທາງສຳລັບຕິດຕໍ່ຝ່າຍສະໜັບສະໜູນ | `src/features/support/components/contact-form-dialog.tsx` |  |  |
| `support.channelName` | ຊື່ຊ່ອງທາງ | `src/features/support/components/contact-form-dialog.tsx` |  |  |
| `support.contactInfo` | ຂໍ້ມູນຕິດຕໍ່ | `src/features/support/components/contact-form-dialog.tsx` |  |  |
| `support.contactDescription` | ຄຳອະທິບາຍ | `src/features/support/components/contact-form-dialog.tsx` |  |  |
| `support.contactSaved` | ເພີ່ມຊ່ອງທາງຕິດຕໍ່ສຳເລັດ | `src/features/support/components/contact-form-dialog.tsx` |  |  |
| `support.deleteContactFor` | [Dynamic template function] | `src/features/support/components/support-view.test.tsx, src/features/support/components/support-view.tsx` |  |  |
| `support.deleteContactTitle` | ລຶບຊ່ອງທາງຕິດຕໍ່ | `src/features/support/components/support-view.tsx` |  |  |
| `support.deleteContactConfirm` | [Dynamic template function] | `src/features/support/components/support-view.tsx` |  |  |
| `support.contactDeleted` | ລຶບຊ່ອງທາງຕິດຕໍ່ສຳເລັດ | `src/features/support/components/support-view.tsx` |  |  |
| `support.errors.subjectRequired` | ກະລຸນາປ້ອນຫົວຂໍ້ | `src/features/support/components/support-view.test.tsx, src/features/support/schemas/support.schema.test.ts, src/features/support/schemas/support.schema.ts` |  |  |
| `support.errors.descriptionRequired` | ກະລຸນາປ້ອນລາຍລະອຽດ | `src/features/support/components/support-view.test.tsx, src/features/support/schemas/support.schema.test.ts, src/features/support/schemas/support.schema.ts` |  |  |
| `support.errors.priorityInvalid` | ລະດັບຄວາມສຳຄັນບໍ່ຖືກຕ້ອງ | `src/features/support/schemas/support.schema.ts` |  |  |
| `support.errors.statusInvalid` | ສະຖານະບໍ່ຖືກຕ້ອງ | `src/features/support/schemas/support.schema.ts` |  |  |
| `support.errors.fileType` | ຮອງຮັບສະເພາະຮູບພາບ PNG, JPG, GIF, WEBP | `src/features/support/schemas/support.schema.ts` |  |  |
| `support.errors.fileSize` | [Dynamic template function] | `src/features/support/schemas/support.schema.ts` |  |  |
| `support.errors.channelNameRequired` | ກະລຸນາປ້ອນຊື່ຊ່ອງທາງ | `src/features/support/schemas/support.schema.ts` |  |  |
| `support.errors.contactInfoRequired` | ກະລຸນາປ້ອນຂໍ້ມູນຕິດຕໍ່ | `src/features/support/schemas/support.schema.ts` |  |  |
| `forbidden.title` | ບໍ່ມີສິດເຂົ້າເຖິງ | `src/app/(app)/forbidden/page.tsx` |  |  |
| `nav.dashboard` | ພາບລວມ | `src/components/layout/app-sidebar.test.tsx, src/config/navigation.ts` |  |  |
| `nav.contracts` | ລາຍການສັນຍາ | `src/components/layout/app-sidebar.test.tsx, src/config/navigation.ts, src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `nav.create` | ສ້າງສັນຍາໃໝ່ | `src/components/layout/app-sidebar.test.tsx, src/config/navigation.ts` |  |  |
| `nav.createLegal` | ສ້າງໃໝ່ | `src/components/layout/app-sidebar.test.tsx, src/config/navigation.ts` |  |  |
| `nav.alerts` | ແຈ້ງເຕືອນ | `src/config/navigation.ts` |  |  |
| `nav.documents` | ເອກະສານ | `src/components/layout/app-sidebar.test.tsx` |  |  |
| `nav.regulations` | ນິຕິກຳ | `src/components/layout/app-sidebar.test.tsx, src/config/navigation.ts` |  |  |
| `nav.cases` | ຄະດີ | `src/components/layout/app-sidebar.test.tsx, src/config/navigation.ts` |  |  |
| `nav.mainMenu` | ເມນູຫຼັກ | `src/components/layout/app-shell.test.tsx, src/components/layout/app-shell.tsx, src/components/layout/app-sidebar.tsx` |  |  |
| `nav.allModules` | ໂມດູນທັງໝົດ | `src/components/layout/app-sidebar.tsx` |  |  |
| `nav.commonSection` | ເມນູທົ່ວໄປ | `src/components/layout/app-sidebar.tsx` |  |  |
| `nav.notifications` | ການແຈ້ງເຕືອນ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/breadcrumbs.tsx, src/config/navigation.ts` |  |  |
| `nav.support` | ຊ່ວຍເຫຼືອ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/breadcrumbs.tsx, src/config/navigation.ts` |  |  |
| `users.title` | ຈັດການຜູ້ໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.add` | ເພີ່ມຜູ້ໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.edit` | ແກ້ໄຂ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.delete` | ລຶບ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.searchLabel` | ຄົ້ນຫາຜູ້ໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.searchPlaceholder` | ຄົ້ນຫາຊື່, ລະຫັດພະນັກງານ ຫຼື ອີເມວ... | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.roleFilter` | ກອງຕາມບົດບາດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.allRoles` | ທຸກບົດບາດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.statusFilter` | ສະຖານະບັນຊີ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.caption` | ລາຍຊື່ຜູ້ໃຊ້ໃນລະບົບ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.emptyTitle` | ບໍ່ພົບຜູ້ໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.emptyDescription` | ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ຕົວກອງ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.loadError` | ບໍ່ສາມາດໂຫຼດລາຍຊື່ຜູ້ໃຊ້ໄດ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.deleted` | ລຶບຜູ້ໃຊ້ສຳເລັດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.deleteTitle` | ລຶບຜູ້ໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.deleteDescription` | [Dynamic template function] | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.active` | ໃຊ້ງານຢູ່ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.inactive` | ປິດໃຊ້ງານ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.statusAll` | ທັງໝົດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.columns.user` | ຜູ້ໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.columns.division` | ພະແນກ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.columns.role` | ບົດບາດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.columns.permissions` | ສິດທິ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.columns.status` | ສະຖານະ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.permissions.canView` | ເບິ່ງ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.permissions.canUpload` | ອັບໂຫຼດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.permissions.canEdit` | ແກ້ໄຂ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.permissions.canDelete` | ລຶບ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.permissions.canDownload` | ດາວໂຫຼດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.permissionNone` | ບໍ່ມີສິດທິ | `src/features/users/lib/user-mapper.test.ts, src/features/users/lib/user-mapper.ts` |  |  |
| `users.permissionAll` | ທຸກສິດທິ | `src/features/users/lib/user-mapper.test.ts, src/features/users/lib/user-mapper.ts` |  |  |
| `users.form.createTitle` | ເພີ່ມຜູ້ໃຊ້ໃໝ່ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.editTitle` | ແກ້ໄຂຜູ້ໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.description` | ໃສ່ລະຫັດພະນັກງານ ແລ້ວກົດຄົ້ນຫາຈາກ HRM ເພື່ອດຶງຂໍ້ມູນອັດຕະໂນມັດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.editDescription` | ປັບບົດບາດ, ພະແນກ ແລະ ສິດທິຂອງຜູ້ໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.employeeCode` | ລະຫັດພະນັກງານ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.hrmLookup` | ຄົ້ນຫາຈາກ HRM | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.hrmLooking` | ກຳລັງຄົ້ນຫາ... | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.hrmFilled` | ດຶງຂໍ້ມູນຈາກ HRM ສຳເລັດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.hrmFailed` | ບໍ່ສາມາດດຶງຂໍ້ມູນຈາກ HRM ໄດ້ ທ່ານສາມາດປ້ອນຂໍ້ມູນດ້ວຍຕົນເອງໄດ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.fullName` | ຊື່ ແລະ ນາມສະກຸນ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.department` | ຫ້ອງການ/ຝ່າຍ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.division` | ພະແນກ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.divisionPlaceholder` | ເລືອກພະແນກ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.divisionNone` | ບໍ່ລະບຸ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.email` | ອີເມວ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.phone` | ເບີໂທລະສັບ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.role` | ບົດບາດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.permissions` | ສິດທິການນຳໃຊ້ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.permissionsImplied` | ບົດບາດນີ້ມີສິດທິທັງໝົດໂດຍອັດຕະໂນມັດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.isActive` | ເປີດໃຊ້ງານບັນຊີ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.requiredHint` | ຊ່ອງທີ່ມີ * ຈຳເປັນຕ້ອງໃສ່ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.cancel` | ຍົກເລີກ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.save` | ບັນທຶກ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.saving` | ກຳລັງບັນທຶກ... | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.created` | ເພີ່ມຜູ້ໃຊ້ສຳເລັດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.updated` | ບັນທຶກການແກ້ໄຂສຳເລັດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.form.duplicate` | ລະຫັດພະນັກງານນີ້ມີໃນລະບົບແລ້ວ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.validation.required` | ກະລຸນາປ້ອນຂໍ້ມູນ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.validation.invalid` | ຂໍ້ມູນບໍ່ຖືກຕ້ອງ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.validation.textMax` | ຂໍ້ຄວາມຍາວເກີນກຳນົດ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.validation.employeeCodeFormat` | ລະຫັດພະນັກງານໃຊ້ໄດ້ສະເພາະຕົວອັກສອນ, ຕົວເລກ, - ແລະ _ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.validation.emailInvalid` | ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.validation.phoneInvalid` | ເບີໂທລະສັບບໍ່ຖືກຕ້ອງ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `users.validation.divisionInvalid` | ກະລຸນາເລືອກພະແນກຈາກລາຍການ | `src/features/users/components/user-form-dialog.test.tsx, src/features/users/components/user-form-dialog.tsx` |  |  |
| `admin.section` | ຜູ້ດູແລລະບົບ | `src/components/layout/app-sidebar.tsx, src/components/layout/breadcrumbs.tsx` |  |  |
| `admin.users` | ຈັດການຜູ້ໃຊ້ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/breadcrumbs.tsx, src/config/navigation.ts` |  |  |
| `admin.auditLogs` | ບັນທຶກການໃຊ້ງານ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/breadcrumbs.tsx, src/config/navigation.ts` |  |  |
| `admin.contractTypes` | ປະເພດສັນຍາ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/breadcrumbs.tsx, src/config/navigation.ts` |  |  |
| `admin.departments` | ພະແນກ | `src/components/layout/app-sidebar.test.tsx, src/components/layout/breadcrumbs.tsx, src/config/navigation.ts` |  |  |
| `auditLogs.caption` | ຕາຕະລາງບັນທຶກການໃຊ້ງານ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.filterAction` | ການດຳເນີນການ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.allActions` | ທຸກການດຳເນີນການ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.filterUser` | ລະຫັດຜູ້ໃຊ້ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.userPlaceholder` | ປ້ອນລະຫັດຜູ້ໃຊ້ (userId) | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.columns.time` | ເວລາ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.columns.user` | ຜູ້ໃຊ້ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.columns.action` | ການດຳເນີນການ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.columns.target` | ລາຍການ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.columns.ip` | ທີ່ຢູ່ IP | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.columns.details` | ລາຍລະອຽດ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.viewDetails` | ເບິ່ງລາຍລະອຽດ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.detailsTitle` | ລາຍລະອຽດການປ່ຽນແປງ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.field` | ຂໍ້ມູນ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.oldValue` | ຄ່າເດີມ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.newValue` | ຄ່າໃໝ່ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.noChanges` | ບໍ່ມີການປ່ຽນແປງຂໍ້ມູນ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.changesCount` | [Dynamic template function] | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.emptyTitle` | ບໍ່ພົບບັນທຶກການໃຊ້ງານ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.emptyDesc` | ລອງປ່ຽນຕົວກອງ ຫຼື ລໍຖ້າການໃຊ້ງານໃໝ່ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `auditLogs.loadError` | ບໍ່ສາມາດໂຫຼດບັນທຶກການໃຊ້ງານໄດ້ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `contractTypes.caption` | ຕາຕະລາງປະເພດສັນຍາ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.searchLabel` | ຄົ້ນຫາປະເພດສັນຍາ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.searchPlaceholder` | ຄົ້ນຫາຊື່ປະເພດສັນຍາ... | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.filterActive` | ສະຖານະການໃຊ້ງານ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.all` | ທັງໝົດ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.active` | ເປີດໃຊ້ງານ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.inactive` | ປິດໃຊ້ງານ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.columns.nameLo` | ຊື່ (ລາວ) | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.columns.nameEn` | ຊື່ (ອັງກິດ) | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.columns.status` | ສະຖານະ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.columns.actions` | ຈັດການ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.add` | ເພີ່ມປະເພດສັນຍາ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.edit` | ແກ້ໄຂ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.delete` | ລຶບ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.editAria` | [Dynamic template function] | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.deleteAria` | [Dynamic template function] | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.createTitle` | ເພີ່ມປະເພດສັນຍາ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.editTitle` | ແກ້ໄຂປະເພດສັນຍາ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.nameLo` | ຊື່ປະເພດສັນຍາ (ລາວ) | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.nameEn` | ຊື່ປະເພດສັນຍາ (ອັງກິດ) | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.isActive` | ເປີດໃຊ້ງານ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.required` | ກະລຸນາປ້ອນຊື່ປະເພດສັນຍາເປັນພາສາລາວ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.save` | ບັນທຶກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.saving` | ກຳລັງບັນທຶກ... | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.cancel` | ຍົກເລີກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.form.saved` | ບັນທຶກປະເພດສັນຍາແລ້ວ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.deleteTitle` | ລຶບປະເພດສັນຍາ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.deleteDesc` | [Dynamic template function] | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.deleted` | ລຶບປະເພດສັນຍາແລ້ວ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.emptyTitle` | ບໍ່ພົບປະເພດສັນຍາ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.emptyDesc` | ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເພີ່ມປະເພດສັນຍາໃໝ່ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `contractTypes.loadError` | ບໍ່ສາມາດໂຫຼດປະເພດສັນຍາໄດ້ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.caption` | ຕາຕະລາງພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.searchLabel` | ຄົ້ນຫາພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.searchPlaceholder` | ຄົ້ນຫາຊື່ ຫຼື ລະຫັດພະແນກ... | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.filterActive` | ສະຖານະການໃຊ້ງານ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.all` | ທັງໝົດ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.active` | ເປີດໃຊ້ງານ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.inactive` | ປິດໃຊ້ງານ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.columns.name` | ຊື່ພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.columns.code` | ລະຫັດ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.columns.status` | ສະຖານະ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.columns.actions` | ຈັດການ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.add` | ເພີ່ມພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.edit` | ແກ້ໄຂ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.delete` | ລຶບ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.editAria` | [Dynamic template function] | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.deleteAria` | [Dynamic template function] | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.sync` | ຊິງຄ໌ຈາກ HRM | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.syncing` | ກຳລັງຊິງຄ໌... | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.syncDone` | ຊິງຄ໌ຂໍ້ມູນພະແນກຈາກ HRM ສຳເລັດ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.syncDoneCounts` | [Dynamic template function] | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.createTitle` | ເພີ່ມພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.editTitle` | ແກ້ໄຂພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.name` | ຊື່ພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.code` | ລະຫັດພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.isActive` | ເປີດໃຊ້ງານ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.required` | ກະລຸນາປ້ອນຊື່ພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.save` | ບັນທຶກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.saving` | ກຳລັງບັນທຶກ... | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.cancel` | ຍົກເລີກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.form.saved` | ບັນທຶກພະແນກແລ້ວ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.deleteTitle` | ລຶບພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.deleteDesc` | [Dynamic template function] | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.deleted` | ລຶບພະແນກແລ້ວ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.emptyTitle` | ບໍ່ພົບພະແນກ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.emptyDesc` | ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເພີ່ມພະແນກໃໝ່ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `departments.loadError` | ບໍ່ສາມາດໂຫຼດພະແນກໄດ້ | `src/features/admin/admin.schema.test.ts, src/features/admin/admin.schema.ts` |  |  |
| `table.prev` | ກ່ອນໜ້າ | `src/components/shared/data-table.test.tsx, src/components/shared/data-table.tsx` |  |  |
| `table.next` | ຕໍ່ໄປ | `src/components/shared/data-table.test.tsx, src/components/shared/data-table.tsx` |  |  |
| `table.density` | ຄວາມໜາແໜ້ນ | `src/components/shared/data-table.test.tsx, src/components/shared/data-table.tsx` |  |  |
| `table.comfortable` | ສະບາຍ | `src/components/shared/data-table.test.tsx, src/components/shared/data-table.tsx` |  |  |
| `table.compact` | ກະທັດຮັດ | `src/components/shared/data-table.test.tsx, src/components/shared/data-table.tsx` |  |  |
| `table.noData` | ບໍ່ພົບຂໍ້ມູນ | `src/features/gc/components/gc-contracts-view.tsx, src/features/legal/cases/components/legal-cases-view.tsx, src/features/legal/documents/components/legal-documents-view.tsx` |  |  |
| `table.actions` | ຈັດການ | `src/features/gc/components/gc-contracts-view.tsx, src/features/legal/cases/components/legal-cases-view.tsx, src/features/legal/documents/components/legal-documents-view.test.tsx` |  |  |
| `table.filterByStatus` | ສະຖານະ | `src/features/gc/components/gc-contracts-view.tsx, src/features/legal/documents/components/legal-documents-view.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `table.filterByEnergy` | ປະເພດພະລັງງານ | `src/components/shared/data-table.test.tsx, src/components/shared/data-table.tsx` |  |  |
| `table.filterByMarket` | ຕະຫຼາດ | `src/components/shared/data-table.test.tsx, src/components/shared/data-table.tsx` |  |  |
| `table.all` | ທັງໝົດ | `src/features/gc/components/gc-contracts-view.tsx, src/features/legal/cases/components/legal-cases-view.tsx, src/features/legal/documents/components/legal-documents-view.tsx` |  |  |
| `table.reset` | ລຶບຕົວກອງ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `confirm.title` | ຢືນຢັນການດຳເນີນການ | `src/components/shared/confirm-dialog.tsx` |  |  |
| `confirm.cancel` | ຍົກເລີກ | `src/components/shared/confirm-dialog.test.tsx, src/components/shared/confirm-dialog.tsx` |  |  |
| `confirm.confirm` | ຢືນຢັນ | `src/components/shared/confirm-dialog.test.tsx, src/components/shared/confirm-dialog.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `confirm.deleteTitle` | ຢືນຢັນການລຶບ | `src/features/documents/components/document-manager.tsx` |  |  |
| `confirm.deleteDesc` | ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້. | `src/features/documents/components/document-manager.tsx` |  |  |
| `dropzone.dragActive` | ວາງໄຟລ໌ລົງບ່ອນນີ້ | `src/components/shared/file-dropzone.tsx` |  |  |
| `dropzone.prompt` | ຄລິກເພື່ອເລືອກໄຟລ໌ ຫຼື ລາກໄຟລ໌ມາໃສ່ບ່ອນນີ້ | `src/components/shared/file-dropzone.test.tsx, src/components/shared/file-dropzone.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `dropzone.hint` | [Dynamic template function] | `src/components/shared/file-dropzone.test.tsx, src/components/shared/file-dropzone.tsx` |  |  |
| `dropzone.uploading` | ກຳລັງອັບໂຫຼດ... | `src/components/shared/file-dropzone.test.tsx, src/components/shared/file-dropzone.tsx` |  |  |
| `dropzone.remove` | ລຶບອອກ | `src/components/shared/file-dropzone.test.tsx, src/components/shared/file-dropzone.tsx` |  |  |
| `dropzone.download` | ດາວໂຫຼດ | `src/components/shared/file-list.test.tsx, src/components/shared/file-list.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `dropzone.empty` | ຍັງບໍ່ມີເອກະສານ | `src/components/shared/file-list.tsx` |  |  |
| `dropzone.fileUploaded` | ອັບໂຫຼດເອກະສານສຳເລັດ | `src/features/documents/components/document-manager.test.tsx, src/features/documents/components/document-manager.tsx` |  |  |
| `dropzone.fileDeleted` | ລຶບເອກະສານສຳເລັດ | `src/features/documents/components/document-manager.tsx` |  |  |
| `dropzone.tooLarge` | [Dynamic template function] | `src/components/shared/file-dropzone.test.tsx, src/components/shared/file-dropzone.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `dropzone.badType` | [Dynamic template function] | `src/components/shared/file-dropzone.test.tsx, src/components/shared/file-dropzone.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `dropzone.downloadFile` | [Dynamic template function] | `src/components/shared/file-list.test.tsx, src/components/shared/file-list.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `dropzone.deleteFile` | [Dynamic template function] | `src/components/shared/file-list.test.tsx, src/components/shared/file-list.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `dropzone.previewFile` | [Dynamic template function] | `src/components/shared/file-list.test.tsx, src/components/shared/file-list.tsx, src/features/documents/components/document-manager.test.tsx` |  |  |
| `documents.loadError` | ບໍ່ສາມາດໂຫຼດເອກະສານໄດ້ | `src/features/documents/components/document-manager.tsx` |  |  |
| `documents.previewTitle` | [Dynamic template function] | `src/features/documents/components/document-manager.tsx` |  |  |
| `documents.previewUnsupported` | ບໍ່ສາມາດສະແດງຕົວຢ່າງໄຟລ໌ປະເພດນີ້ໄດ້ ກະລຸນາດາວໂຫຼດເພື່ອເບິ່ງ | `src/features/documents/components/document-manager.tsx` |  |  |
| `documents.previewLoading` | ກຳລັງໂຫຼດຕົວຢ່າງ... | `src/features/documents/components/document-manager.tsx` |  |  |
| `lookups.loadError` | ບໍ່ສາມາດໂຫຼດລາຍການຕົວເລືອກໄດ້ | `src/lib/i18n/lo.ts` |  |  |
| `lookups.empty` | ບໍ່ມີຕົວເລືອກ | `src/lib/i18n/lo.ts` |  |  |
| `history.title` | ປະຫວັດການແກ້ໄຂ | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-detail-alerts.test.tsx` |  |  |
| `history.empty` | ຍັງບໍ່ມີປະຫວັດການແກ້ໄຂ | `src/features/history/components/history-timeline.test.tsx, src/features/history/components/history-timeline.tsx` |  |  |
| `history.loadError` | ບໍ່ສາມາດໂຫຼດປະຫວັດການແກ້ໄຂໄດ້ | `src/features/history/components/history-timeline.test.tsx, src/features/history/components/history-timeline.tsx` |  |  |
| `history.loadMore` | ໂຫຼດເພີ່ມ | `src/features/history/components/history-timeline.test.tsx, src/features/history/components/history-timeline.tsx` |  |  |
| `history.noValue` | [Dynamic template function] | `src/features/admin/audit-logs/audit-logs-view.tsx, src/features/history/components/history-timeline.tsx` |  |  |
| `history.by` | [Dynamic template function] | `src/features/history/components/history-timeline.tsx` |  |  |
| `history.change` | [Dynamic template function] | `src/features/history/components/history-timeline.tsx` |  |  |
| `history.actions.CREATE_CONTRACT` | ສ້າງສັນຍາ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.UPDATE_CONTRACT` | ແກ້ໄຂສັນຍາ | `src/features/history/components/history-timeline.test.tsx` |  |  |
| `history.actions.DELETE_CONTRACT` | ລຶບສັນຍາ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.UPLOAD_ATTACHMENT` | ອັບໂຫຼດເອກະສານແນບ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.DOWNLOAD_ATTACHMENT` | ດາວໂຫຼດເອກະສານແນບ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.DELETE_ATTACHMENT` | ລຶບເອກະສານແນບ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.USER_PERMISSION_CHANGE` | ປ່ຽນສິດຜູ້ໃຊ້ | `src/features/admin/audit-logs/audit-logs-view.test.tsx` |  |  |
| `history.actions.CREATE_LEGAL_DOCUMENT` | ສ້າງນິຕິກຳ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.UPDATE_LEGAL_DOCUMENT` | ແກ້ໄຂນິຕິກຳ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.DELETE_LEGAL_DOCUMENT` | ລຶບນິຕິກຳ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.CREATE_LEGAL_CASE` | ສ້າງຄະດີ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.UPDATE_LEGAL_CASE` | ແກ້ໄຂຄະດີ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.DELETE_LEGAL_CASE` | ລຶບຄະດີ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.CREATE_POWER_CONTRACT` | ສ້າງສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.UPDATE_POWER_CONTRACT` | ແກ້ໄຂສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.DELETE_POWER_CONTRACT` | ລຶບສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.UPLOAD_POWER_ATTACHMENT` | ອັບໂຫຼດເອກະສານແນບ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.DOWNLOAD_POWER_ATTACHMENT` | ດາວໂຫຼດເອກະສານແນບ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `history.actions.DELETE_POWER_ATTACHMENT` | ລຶບເອກະສານແນບ | `src/features/admin/audit-logs/audit-logs-view.test.tsx, src/features/admin/audit-logs/audit-logs-view.tsx` |  |  |
| `charts.items` | ລາຍການ | `src/components/charts/monthly-bars.test.tsx, src/components/charts/monthly-bars.tsx` |  |  |
| `stepper.step` | [Dynamic template function] | `src/components/shared/stepper.test.tsx, src/components/shared/stepper.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `stepper.completed` | ສຳເລັດແລ້ວ | `src/components/shared/stepper.test.tsx, src/components/shared/stepper.tsx` |  |  |
| `stepper.nav` | ຄວາມຄືບໜ້າ | `src/components/shared/stepper.test.tsx, src/components/shared/stepper.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `stepper.stepName` | [Dynamic template function] | `src/components/shared/stepper.test.tsx, src/components/shared/stepper.tsx` |  |  |
| `timeline.status.done` | ສຳເລັດແລ້ວ | `src/components/shared/timeline.test.tsx` |  |  |
| `timeline.status.current` | ປັດຈຸບັນ | `src/components/shared/timeline.test.tsx` |  |  |
| `timeline.status.future` | ຈະມາເຖິງ | `src/components/shared/timeline.test.tsx` |  |  |
| `ppa.title` | ສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-contracts-view.test.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.subtitle` | ບໍລິຫານສັນຍາຊື້ໄຟຟ້າ ແລະ ສັນຍາຂາຍໄຟຟ້າ, ກຳລັງຕິດຕັ້ງ, ລາຄາ ແລະ ວັນໝົດອາຍຸ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.types.PURCHASE` | ສັນຍາຊື້ໄຟຟ້າ | `src/features/ppa/components/ppa-contract-form-fields.test.tsx, src/features/ppa/components/ppa-dashboard-view.tsx, src/features/ppa/components/ppa-wizard-view.test.tsx` | Backend verbatim power contract type enum — do not change unless backend changes |  |
| `ppa.types.SALE` | ສັນຍາຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-contract-form-fields.test.tsx, src/features/ppa/components/ppa-contracts-view.test.tsx, src/features/ppa/components/ppa-dashboard-view.tsx` | Backend verbatim power contract type enum — do not change unless backend changes |  |
| `ppa.fields.contractType` | ປະເພດສັນຍາ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.fields.contractNumber` | ເລກທີສັນຍາ | `src/features/ppa/components/ppa-contracts-view.tsx, src/features/ppa/components/ppa-wizard-view.test.tsx` |  |  |
| `ppa.fields.projectName` | ຊື່ໂຄງການ | `src/features/ppa/components/ppa-contracts-view.tsx, src/features/ppa/components/ppa-wizard-view.test.tsx` |  |  |
| `ppa.fields.projectTypeOrCustomer` | ປະເພດໂຄງການ / ລູກຄ້າ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.fields.projectType` | ປະເພດໂຄງການ | `src/features/ppa/components/ppa-contract-form-fields.test.tsx, src/features/ppa/components/ppa-contract-form-fields.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.fields.customer` | ຊື່ລູກຄ້າ ຫຼື ໂຄງການ | `src/features/ppa/components/ppa-contract-form-fields.test.tsx, src/features/ppa/components/ppa-contract-form-fields.tsx, src/features/ppa/components/ppa-wizard-view.test.tsx` |  |  |
| `ppa.fields.durationText` | ອາຍຸສັນຍາ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.durationMonths` | ອາຍຸສັນຍາ (ເດືອນ) | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.signedDate` | ວັນທີເຊັນສັນຍາ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.effectiveDate` | ວັນທີມີຜົນບັງຄັບໃຊ້ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.expirationDate` | ວັນທີສິ້ນສຸດສັນຍາ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contracts-view.test.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.fields.installedCapacity` | ກຳລັງຕິດຕັ້ງ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.fields.capacityValue` | ຄ່າກຳລັງຕິດຕັ້ງ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.capacityUnit` | ຫົວໜ່ວຍ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.projectLocation` | ທີ່ຕັ້ງໂຄງການ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.tariff` | ລາຄາໄຟຟ້າ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.fields.tariffValue` | ຄ່າລາຄາໄຟຟ້າ (ຕໍ່ kWh) | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.tariffCurrency` | ສະກຸນເງິນ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.additionalDetails` | ລາຍລະອຽດເພີ່ມເຕີມ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.notifyDaysBefore` | ແຈ້ງເຕືອນລ່ວງໜ້າ (ມື້) | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.fields.status` | ສະຖານະ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.caption` | ລາຍການສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.searchLabel` | ຄົ້ນຫາສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.searchPlaceholder` | ຄົ້ນຫາເລກທີສັນຍາ ຫຼື ຊື່ໂຄງການ... | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.typeFilter` | ປະເພດສັນຍາ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.statusFilter` | ສະຖານະ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.list.projectFilter` | ປະເພດໂຄງການ / ລູກຄ້າ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.projectFilterPlaceholder` | ປະເພດໂຄງການ ຫຼື ຊື່ລູກຄ້າ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.allProjects` | ທຸກປະເພດໂຄງການ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.list.create` | ສ້າງສັນຍາດ່ວນ | `src/features/ppa/components/ppa-contracts-view.test.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.openWizard` | ສ້າງສັນຍາແບບລະອຽດ | `src/features/ppa/components/ppa-contracts-view.test.tsx, src/features/ppa/components/ppa-contracts-view.tsx, src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.list.edit` | ແກ້ໄຂ | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-contracts-view.test.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.delete` | ລຶບ | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-contracts-view.test.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.view` | ເບິ່ງລາຍລະອຽດ | `src/features/ppa/components/ppa-contracts-view.test.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.deleted` | ລຶບສັນຍາສຳເລັດແລ້ວ | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.totalItems` | ລາຍການ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.pageSize` | ຈຳນວນຕໍ່ໜ້າ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.resetFilters` | ລຶບຕົວກອງ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.emptyHint` | ລອງປ່ຽນ ຫຼື ລຶບຕົວກອງ | `src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.deleteTitle` | ຢືນຢັນການລຶບສັນຍາ | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.list.deleteDesc` | [Dynamic template function] | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-contracts-view.tsx` |  |  |
| `ppa.form.createTitle` | ສ້າງສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-contract-form-dialog.tsx` |  |  |
| `ppa.form.editTitle` | ແກ້ໄຂສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-contract-form-dialog.tsx` |  |  |
| `ppa.form.requiredHint` | ຊ່ອງທີ່ມີ * ຈຳເປັນຕ້ອງປ້ອນ | `src/features/ppa/components/ppa-contract-form-dialog.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.form.save` | ບັນທຶກ | `src/features/ppa/components/ppa-contract-form-dialog.tsx` |  |  |
| `ppa.form.saving` | ກຳລັງບັນທຶກ... | `src/features/ppa/components/ppa-contract-form-dialog.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.form.cancel` | ຍົກເລີກ | `src/features/ppa/components/ppa-contract-form-dialog.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.form.saved` | ບັນທຶກສັນຍາສຳເລັດແລ້ວ | `src/features/ppa/components/ppa-contract-form-dialog.tsx` |  |  |
| `ppa.form.sectionGeneral` | ຂໍ້ມູນພື້ນຖານ | `src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.form.sectionDates` | ກຳນົດເວລາ | `src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.form.sectionTech` | ກຳລັງຕິດຕັ້ງ ແລະ ລາຄາ | `src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.form.sectionNotes` | ໝາຍເຫດ | `src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.form.select` | ເລືອກ... | `src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.form.projectTypeHint` | ເລືອກຈາກ 5 ປະເພດໂຄງການ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.form.customerHint` | ປ້ອນຊື່ລູກຄ້າ ຫຼື ຊື່ໂຄງການ | `src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.form.projectTypesLoading` | ກຳລັງໂຫຼດປະເພດໂຄງການ... | `src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.form.projectTypesError` | ບໍ່ສາມາດໂຫຼດປະເພດໂຄງການໄດ້ | `src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.wizard.title` | ສ້າງສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-wizard-view.test.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.step1` | ຂໍ້ມູນພື້ນຖານ | `src/features/ppa/components/ppa-wizard-view.test.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.step2` | ກຳນົດເວລາ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.step3` | ກຳລັງຕິດຕັ້ງ & ລາຄາ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.step4` | ເອກະສານ & ກວດສອບ | `src/features/ppa/components/ppa-wizard-view.test.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.next` | ຕໍ່ໄປ | `src/features/ppa/components/ppa-wizard-view.test.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.back` | ຍ້ອນກັບ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.submit` | ສຳເລັດການສ້າງ | `src/features/ppa/components/ppa-wizard-view.test.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.summary` | ສະຫຼຸບຂໍ້ມູນສັນຍາ | `src/features/ppa/components/ppa-wizard-view.test.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.progress` | ຄວາມຄືບໜ້າ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.progressText` | [Dynamic template function] | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.review` | ກວດສອບກ່ອນບັນທຶກ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.edit` | ແກ້ໄຂ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.editSection` | [Dynamic template function] | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.noFiles` | ບໍ່ມີເອກະສານ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.stagedHint` | ເອກະສານຈະຖືກອັບໂຫຼດຫຼັງບັນທຶກສັນຍາ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.uploadFailed` | [Dynamic template function] | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.wizard.created` | ສ້າງສັນຍາສຳເລັດແລ້ວ | `src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.detail.backToList` | ກັບໄປລາຍການສັນຍາ | `src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.detail.info` | ຂໍ້ມູນສັນຍາ | `src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.detail.documents` | ເອກະສານແນບ | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-detail-alerts.test.tsx, src/features/ppa/components/ppa-wizard-view.tsx` |  |  |
| `ppa.detail.notFound` | ບໍ່ພົບສັນຍາ | `src/features/ppa/components/ppa-contract-detail-view.tsx, src/features/ppa/components/ppa-detail-alerts.test.tsx` |  |  |
| `ppa.detail.loadError` | ບໍ່ສາມາດໂຫຼດສັນຍາໄດ້ | `src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.dashboard.title` | ພາບລວມສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.subtitle` | ສະຫຼຸບຈຳນວນສັນຍາ, ກຳລັງຕິດຕັ້ງ ແລະ ສັນຍາທີ່ໃກ້ໝົດອາຍຸ | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.loadError` | ບໍ່ສາມາດໂຫຼດຂໍ້ມູນພາບລວມໄດ້ | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.kpiTotal` | ສັນຍາທັງໝົດ | `src/features/ppa/components/ppa-dashboard-view.test.tsx, src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.kpiCapacity` | ກຳລັງຕິດຕັ້ງລວມ (MW) | `src/features/ppa/components/ppa-dashboard-view.test.tsx, src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.kpiExpiring` | ໃກ້ໝົດອາຍຸ | `src/features/ppa/components/ppa-dashboard-view.test.tsx, src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.kpiPurchase` | ສັນຍາຊື້ໄຟຟ້າ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.dashboard.kpiSale` | ສັນຍາຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.dashboard.purchaseVsSale` | ສັນຍາຊື້ ທຽບກັບ ສັນຍາຂາຍ | `src/features/ppa/components/ppa-dashboard-view.test.tsx, src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.byStatus` | ສະຖານະສັນຍາ | `src/features/ppa/components/ppa-dashboard-view.test.tsx, src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.byStatusDesc` | ການແບ່ງກຸ່ມສັນຍາຕາມສະຖານະ | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.byProjectType` | ກຳລັງຕິດຕັ້ງແຍກຕາມປະເພດໂຄງການ (MW) | `src/features/ppa/components/ppa-dashboard-view.test.tsx, src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.byProjectTypeDesc` | ຈຳນວນສັນຍາ ແລະ ກຳລັງຕິດຕັ້ງຂອງແຕ່ລະປະເພດ | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.expiringList` | ສັນຍາໃກ້ໝົດອາຍຸ | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.expiringListDesc` | ລາຍການທີ່ຕ້ອງຕິດຕາມ | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.noExpiring` | ບໍ່ມີສັນຍາໃກ້ໝົດອາຍຸ | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.dashboard.contractsCount` | [Dynamic template function] | `src/features/ppa/components/ppa-dashboard-view.tsx` |  |  |
| `ppa.alerts.title` | ການແຈ້ງເຕືອນສັນຍາຊື້-ຂາຍໄຟຟ້າ | `src/features/ppa/components/ppa-alerts-view.tsx` |  |  |
| `ppa.alerts.expiringSoon` | ສັນຍາໃກ້ໝົດອາຍຸ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-detail-alerts.test.tsx` |  |  |
| `ppa.alerts.expired` | ສັນຍາໝົດອາຍຸແລ້ວ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-detail-alerts.test.tsx` |  |  |
| `ppa.alerts.notifications` | ການແຈ້ງເຕືອນຈາກລະບົບ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-detail-alerts.test.tsx` |  |  |
| `ppa.alerts.emptyExpiring` | ບໍ່ມີສັນຍາໃກ້ໝົດອາຍຸ | `src/features/ppa/components/ppa-alerts-view.tsx` |  |  |
| `ppa.alerts.emptyExpired` | ບໍ່ມີສັນຍາໝົດອາຍຸ | `src/features/ppa/components/ppa-alerts-view.tsx` |  |  |
| `ppa.alerts.emptyNotifications` | ບໍ່ມີການແຈ້ງເຕືອນ | `src/features/ppa/components/ppa-alerts-view.tsx` |  |  |
| `ppa.alerts.loadError` | ບໍ່ສາມາດໂຫຼດລາຍການສັນຍາໄດ້ | `src/features/ppa/components/ppa-alerts-view.tsx` |  |  |
| `ppa.validation.contractTypeRequired` | ກະລຸນາເລືອກປະເພດສັນຍາ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.validation.projectNameRequired` | ກະລຸນາປ້ອນຊື່ໂຄງການ | `src/features/ppa/components/ppa-wizard-view.test.tsx` |  |  |
| `ppa.validation.projectTypeOrCustomerRequired` | ກະລຸນາປ້ອນ ຫຼື ເລືອກປະເພດໂຄງການ / ລູກຄ້າ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.validation.projectTypeNotInList` | ກະລຸນາເລືອກປະເພດໂຄງການຈາກລາຍການ | `src/features/ppa/components/ppa-contract-form-fields.test.tsx, src/features/ppa/components/ppa-contract-form-fields.tsx` |  |  |
| `ppa.validation.dateInvalid` | ວັນທີບໍ່ຖືກຕ້ອງ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.validation.numberInvalid` | ກະລຸນາປ້ອນຕົວເລກທີ່ຖືກຕ້ອງ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.validation.durationMonthsInvalid` | ຈຳນວນເດືອນຕ້ອງເປັນຈຳນວນເຕັມ ແລະ ບໍ່ຕິດລົບ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.validation.capacityNegative` | ກຳລັງຕິດຕັ້ງຕ້ອງບໍ່ຕິດລົບ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.validation.tariffNegative` | ລາຄາໄຟຟ້າຕ້ອງບໍ່ຕິດລົບ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.validation.notifyInvalid` | ຈຳນວນມື້ແຈ້ງເຕືອນຕ້ອງເປັນຈຳນວນເຕັມ ແລະ ບໍ່ຕິດລົບ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.validation.expirationBeforeEffective` | ວັນທີສິ້ນສຸດຕ້ອງບໍ່ກ່ອນວັນທີມີຜົນບັງຄັບໃຊ້ | `src/features/ppa/components/ppa-alerts-view.tsx, src/features/ppa/components/ppa-contract-detail-view.tsx` |  |  |
| `ppa.errors.duplicateNo` | ເລກທີສັນຍານີ້ມີໃນລະບົບແລ້ວ | `src/features/ppa/components/ppa-form-support.ts` |  |  |
| `gc.types.om_service` | ສັນຍາ ບໍລິການ O&M | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.equipment_lease` | ສັນຍາ ເຊົ່າອຸປະກອນພາກສະຖານີ-ສາຍສົ່ງ | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.land_lease` | ສັນຍາ ເຊົ່າພື້ນທີ່ດິນ | `src/features/gc/components/gc-contract-form-dialog.test.tsx, src/features/gc/components/gc-contracts-view.test.tsx, src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.epc` | ສັນຍາ ຮັບເໝົາກໍ່ສ້າງ (EPC) | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.pole_attachment` | ສັນຍາ ບໍລິການເກາະຫ້ອຍ | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.bill_collection` | ສັນຍາບໍລິການ ຮັບຊຳລະຄ່າກະແສໄຟຟ້າ | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.opgw_lease` | ສັນຍາ ບໍລິການເຊົ່າສາຍ OPGW | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.current_deposit` | ສັນຍາ ບໍລິການເງິນຝາກກະແສລາຍວັນ | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.edl_app_payment` | ສັນຍາບໍລິການນຳໃຊ້ຜະລິດຕະພັນຊຳລະເງິນ ຂອງ ທະນາຄານ ໃນ EDL App | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.cooperation` | ສັນຍາຮ່ວມມື ແລະ ສັນຍາຮ່ວມທຸລະກິດ | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.shareholding` | ສັນຍາຮ່ວມຫຸ້ນ | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.pta` | ສັນຍາບໍລິການຜ່ານສາຍສົ່ງ (PTA) | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.moa` | ບົດບັນທຶກຂໍ້ຕົກລົງ (MOA) | `src/features/gc/components/gc-wizard-view.test.tsx, src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.types.other_assigned` | ສັນຍາອື່ນໆ ທີ່ຖືກມອບໝາຍໂດຍກົງ | `src/features/lookups/mocks/lookups.mock.ts` | Backend verbatim GC contract type — do not change unless backend changes |  |
| `gc.fields.title` | ຊື່ສັນຍາ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.fields.contractTypeId` | ປະເພດສັນຍາ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.fields.contractNumber` | ເລກທີສັນຍາ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.fields.durationText` | ອາຍຸສັນຍາ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.durationMonths` | ອາຍຸສັນຍາ (ເດືອນ) | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.signedDate` | ມື້ລົງລາຍເຊັນ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.fields.effectiveDate` | ມື້ມີຜົນບັງຄັບໃຊ້ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.fields.expirationDate` | ມື້ສິ້ນສຸດ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.fields.contractValue` | ມູນຄ່າສັນຍາ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.fields.currency` | ສະກຸນເງິນ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.equityOrCapitalContribution` | ສັດສ່ວນຫຸ້ນ ຫຼື ຈຳນວນເງິນປະກອບທຶນ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.sharePercentage` | ເປີເຊັນຫຸ້ນ (%) | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.implementer` | ຜູ້ຈັດຕັ້ງປະຕິບັດ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.additionalDetails` | ລາຍລະອຽດເພີ່ມເຕີມ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.notifyDaysBefore` | ແຈ້ງເຕືອນລ່ວງໜ້າ (ມື້) | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.documents` | ເອກະສານແນບ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.fields.status` | ສະຖານະ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.fields.createdAt` | ວັນທີສ້າງ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.fields.updatedAt` | ແກ້ໄຂລ່າສຸດ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.wizard.step1` | ຂໍ້ມູນທົ່ວໄປ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.step2` | ວັນທີ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.step3` | ມູນຄ່າ ແລະ ຫຸ້ນ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.step4` | ເອກະສານ ແລະ ກວດສອບ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.title` | ສ້າງສັນຍາທົ່ວໄປ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.next` | ຕໍ່ໄປ | `src/features/gc/components/gc-wizard-view.test.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.back` | ຍ້ອນກັບ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.submit` | ສ້າງສັນຍາ | `src/features/gc/components/gc-wizard-view.test.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.summary` | ສະຫຼຸບຂໍ້ມູນສັນຍາ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.progress` | ຄວາມຄືບໜ້າການປ້ອນຂໍ້ມູນ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.progressText` | [Dynamic template function] | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.review` | ກວດສອບຂໍ້ມູນ | `src/features/gc/components/gc-wizard-view.test.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.edit` | ແກ້ໄຂ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.editSection` | [Dynamic template function] | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.stagedHint` | ເອກະສານຈະຖືກອັບໂຫຼດຫຼັງຈາກສ້າງສັນຍາສຳເລັດ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.noFiles` | ບໍ່ມີເອກະສານແນບ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.created` | ສ້າງສັນຍາສຳເລັດແລ້ວ | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.wizard.uploadFailed` | [Dynamic template function] | `src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.validation.required` | ກະລຸນາປ້ອນຂໍ້ມູນນີ້ | `src/features/gc/components/gc-contract-form-dialog.test.tsx, src/features/gc/schemas/gc.schema.test.ts` |  |  |
| `gc.validation.titleMax` | ຊື່ສັນຍາຕ້ອງບໍ່ເກີນ 300 ຕົວອັກສອນ | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.validation.notesMax` | ລາຍລະອຽດຕ້ອງບໍ່ເກີນ 2000 ຕົວອັກສອນ | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.validation.endAfterEffective` | ມື້ສິ້ນສຸດຕ້ອງບໍ່ກ່ອນມື້ມີຜົນບັງຄັບໃຊ້ | `src/features/gc/components/gc-contract-form-dialog.test.tsx, src/features/gc/schemas/gc.schema.test.ts` |  |  |
| `gc.validation.percentRange` | ເປີເຊັນຕ້ອງຢູ່ລະຫວ່າງ 0 ຫາ 100 | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.validation.currency` | ສະກຸນເງິນບໍ່ຖືກຕ້ອງ | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.validation.dateInvalid` | ວັນທີບໍ່ຖືກຕ້ອງ | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.validation.invalid` | ຂໍ້ມູນບໍ່ຖືກຕ້ອງ | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.validation.integer` | ຕ້ອງເປັນຈຳນວນເຕັມ | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.validation.nonNegative` | ຕ້ອງບໍ່ຕ່ຳກວ່າ 0 | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.errors.duplicateNo` | ເລກທີສັນຍານີ້ມີຢູ່ແລ້ວ | `src/features/gc/components/gc-contract-form-dialog.test.tsx, src/features/gc/components/gc-server-errors.ts` |  |  |
| `gc.form.createTitle` | ເພີ່ມສັນຍາທົ່ວໄປ | `src/features/gc/components/gc-contract-form-dialog.tsx` |  |  |
| `gc.form.editTitle` | ແກ້ໄຂສັນຍາທົ່ວໄປ | `src/features/gc/components/gc-contract-form-dialog.tsx` |  |  |
| `gc.form.save` | ບັນທຶກ | `src/features/gc/components/gc-contract-form-dialog.test.tsx, src/features/gc/components/gc-contract-form-dialog.tsx` |  |  |
| `gc.form.saving` | ກຳລັງບັນທຶກ... | `src/features/gc/components/gc-contract-form-dialog.test.tsx, src/features/gc/components/gc-contract-form-dialog.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.form.cancel` | ຍົກເລີກ | `src/features/gc/components/gc-contract-form-dialog.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.form.saved` | ບັນທຶກສັນຍາສຳເລັດແລ້ວ | `src/features/gc/components/gc-contract-form-dialog.tsx` |  |  |
| `gc.form.noChanges` | ບໍ່ມີການປ່ຽນແປງ | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.form.requiredHint` | ຊ່ອງທີ່ມີເຄື່ອງໝາຍ * ແມ່ນຕ້ອງປ້ອນ | `src/features/gc/components/gc-contract-form-dialog.tsx, src/features/gc/components/gc-wizard-view.tsx` |  |  |
| `gc.form.selectType` | ເລືອກປະເພດສັນຍາ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.typesLoadFailed` | ໂຫຼດປະເພດສັນຍາບໍ່ສຳເລັດ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.sectionGeneral` | 1. ຂໍ້ມູນທົ່ວໄປ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.sectionGeneralDesc` | ລາຍລະອຽດພື້ນຖານຂອງສັນຍາ ແລະ ເລກທີ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.sectionDates` | 2. ກຳນົດເວລາ ແລະ ອາຍຸສັນຍາ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.sectionDatesDesc` | ວັນທີລົງລາຍເຊັນ, ວັນທີເລີ່ມມີຜົນ ແລະ ວັນທີສິ້ນສຸດ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.sectionMoney` | 3. ມູນຄ່າສັນຍາ ແລະ ຮຸ້ນສ່ວນ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.sectionMoneyDesc` | ມູນຄ່າລວມ, ສະກຸນເງິນ ແລະ ສັດສ່ວນຮຸ້ນປະກອບທຶນ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.sectionNotes` | 4. ຜູ້ຈັດຕັ້ງ ແລະ ແຈ້ງເຕືອນ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.form.sectionNotesDesc` | ຜູ້ຈັດຕັ້ງປະຕິບັດ, ລາຍລະອຽດ ແລະ ການແຈ້ງເຕືອນລ່ວງໜ້າ | `src/features/gc/components/gc-contract-form-fields.tsx` |  |  |
| `gc.list.title` | ລາຍການສັນຍາທົ່ວໄປ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.tsx, src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.list.searchLabel` | ຄົ້ນຫາສັນຍາ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.searchPlaceholder` | ຄົ້ນຫາຊື່ສັນຍາ ຫຼື ເລກທີ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.typeFilter` | ປະເພດສັນຍາ | `src/features/gc/components/gc-contracts-view.test.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.allTypes` | ທຸກປະເພດ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.create` | ສ້າງສັນຍາ | `src/features/gc/components/gc-contracts-view.test.tsx, src/features/gc/components/gc-contracts-view.tsx, src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.list.openWizard` | ເປີດຟອມເຕັມ | `src/features/gc/components/gc-contracts-view.test.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.view` | ເບິ່ງ | `src/features/gc/components/gc-contracts-view.test.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.edit` | ແກ້ໄຂ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.test.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.delete` | ລຶບ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.test.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.deleted` | ລຶບສັນຍາສຳເລັດແລ້ວ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.test.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.deleteTitle` | ລຶບສັນຍາ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.deleteDesc` | [Dynamic template function] | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.caption` | ຕາຕະລາງລາຍການສັນຍາທົ່ວໄປ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.emptyHint` | ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.pageSize` | ຈຳນວນຕໍ່ໜ້າ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.resetFilters` | ລຶບຕົວກອງ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.totalItems` | ລາຍການ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.numberAndTitle` | ເລກທີ / ຊື່ສັນຍາ | `src/features/gc/components/gc-contracts-view.tsx` |  |  |
| `gc.list.export` | ສົ່ງອອກ CSV | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.dashboard.kpiTotal` | ສັນຍາທັງໝົດ | `src/features/gc/components/gc-dashboard-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.dashboard.kpiExpiring` | ໃກ້ໝົດອາຍຸ | `src/features/gc/components/gc-dashboard-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.dashboard.kpiExpired` | ໝົດອາຍຸແລ້ວ | `src/features/gc/components/gc-dashboard-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.dashboard.overview` | ພາບລວມສະຖານະສັນຍາ | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.dashboard.overviewHint` | ຄລິກໃສ່ກາດເພື່ອເບິ່ງລາຍການສັນຍາ | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.dashboard.valueSection` | ມູນຄ່າລວມຕາມສະກຸນເງິນ | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.dashboard.valueHint` | ຍອດມູນຄ່າຕົວຈິງໂດຍບໍ່ມີການແປງຄ່າ | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.dashboard.valueTotal` | [Dynamic template function] | `src/features/gc/components/gc-dashboard-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.dashboard.contractsCount` | [Dynamic template function] | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.dashboard.byType` | ສັນຍາແຍກຕາມປະເພດ | `src/features/gc/components/gc-dashboard-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.dashboard.byTypeHint` | ຈຳນວນສັນຍາແຍກຕາມແຕ່ລະປະເພດສັນຍາ | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.dashboard.typesCount` | [Dynamic template function] | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.dashboard.byStatus` | ສະຖານະສັນຍາ | `src/features/gc/components/gc-dashboard-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.dashboard.byStatusHint` | ສັດສ່ວນສະຖານະສັນຍາທັງໝົດ | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.dashboard.emptyRegister` | ຍັງບໍ່ມີສັນຍາໃນລະບົບ | `src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.detail.info` | ຂໍ້ມູນສັນຍາ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.detail.notFound` | ບໍ່ພົບສັນຍານີ້ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.detail.backToList` | ກັບໄປລາຍການສັນຍາ | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.detail.history` | ປະຫວັດການແກ້ໄຂ | `src/features/gc/components/gc-contract-detail-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.detail.notifyDays` | [Dynamic template function] | `src/features/gc/components/gc-contract-detail-view.tsx` |  |  |
| `gc.alerts.title` | ແຈ້ງເຕືອນສັນຍາ | `src/features/gc/components/gc-alerts-view.tsx, src/features/gc/components/gc-dashboard-view.tsx` |  |  |
| `gc.alerts.expiringSection` | ສັນຍາໃກ້ໝົດອາຍຸ | `src/features/gc/components/gc-alerts-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.alerts.expiredSection` | ສັນຍາທີ່ໝົດອາຍຸແລ້ວ | `src/features/gc/components/gc-alerts-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.alerts.notificationsSection` | ການແຈ້ງເຕືອນ | `src/features/gc/components/gc-alerts-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.alerts.markRead` | ໝາຍວ່າອ່ານແລ້ວ | `src/features/gc/components/gc-alerts-view.tsx, src/features/gc/components/gc-detail-dashboard-alerts.test.tsx` |  |  |
| `gc.alerts.allRead` | ອ່ານແຈ້ງເຕືອນທັງໝົດແລ້ວ | `src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.alerts.empty` | ບໍ່ມີແຈ້ງເຕືອນສັນຍາ | `src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.alerts.due` | ກຳນົດ | `src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `gc.alerts.loadFailed` | ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ | `src/features/admin/contract-types/contract-types-view.test.tsx, src/features/gc/components/gc-alerts-view.tsx` |  |  |
| `legal.docTypes.REGULATION` | ລະບຽບການ / ກົດລະບຽບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docTypes.PROVISION` | ຂໍ້ກຳນົດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docTypes.AGREEMENT` | ຂໍ້ຕົກລົງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docTypes.NOTIFICATION` | ແຈ້ງການ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docTypes.INSTRUCTION` | ຄໍາແນະນໍາ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docTypes.PROPOSAL` | ໜັງສືສະເໜີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docTypes.CONTRACT` | ສັນຍາ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docTypes.MANUAL` | ປຶ້ມຄູ່ມື | `src/features/legal/dashboard/components/legal-dashboard-view.test.tsx, src/features/legal/documents/components/legal-documents-view.test.tsx, src/features/legal/documents/lib/legal-documents-csv.test.ts` |  |  |
| `legal.docTypes.OTHER` | ອື່ນໆ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docStatus.ACTIVE` | ຍັງນໍາໃຊ້ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.docStatus.INACTIVE` | ຍົກເລີກ / ບໍ່ໄດ້ໃຊ້ | `src/features/legal/documents/components/legal-documents-view.test.tsx, src/features/legal/documents/lib/legal-documents-csv.test.ts` |  |  |
| `legal.caseTypes.COMMERCIAL` | ການຄ້າ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.caseTypes.CIVIL` | ຄະດີແພ່ງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.caseTypes.CRIMINAL` | ຄະດີອາຍາ | `src/features/legal/cases/components/legal-cases-view.test.tsx, src/features/legal/cases/lib/legal-cases-csv.test.ts` |  |  |
| `legal.caseTypes.ADMINISTRATIVE` | ບໍລິຫານ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.caseTypes.OTHER` | ອື່ນໆ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.disputeStatus.FIRST_INSTANCE` | ສານຂັ້ນຕົ້ນ | `src/features/legal/cases/components/legal-case-detail-view.test.tsx, src/features/legal/cases/components/legal-case-detail-view.tsx` |  |  |
| `legal.disputeStatus.APPEAL` | ສານຂັ້ນອຸທອນ | `src/features/legal/cases/components/legal-case-detail-view.test.tsx, src/features/legal/cases/components/legal-case-detail-view.tsx, src/features/legal/dashboard/components/legal-dashboard-view.test.tsx` |  |  |
| `legal.disputeStatus.SUPREME` | ຂັ້ນລົບລ້າງ | `src/features/legal/cases/components/legal-case-detail-view.test.tsx, src/features/legal/cases/components/legal-case-detail-view.tsx, src/features/legal/cases/components/legal-cases-view.test.tsx` |  |  |
| `legal.disputeStatus.CLOSED` | ຈົບຄະດີ | `src/features/legal/cases/components/legal-case-detail-view.tsx` |  |  |
| `legal.disputeStatus.RESOLVED` | ສໍາເລັດ | `src/features/legal/cases/components/legal-case-detail-view.test.tsx, src/features/legal/cases/components/legal-case-detail-view.tsx` |  |  |
| `legal.fields.docTitle` | ຊື່ນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.docType` | ປະເພດນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.issueYear` | ປີອອກນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.docNumberDate` | ເລກທີ ແລະ ວັນທີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.status` | ສະຖານະ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.responsiblePerson` | ຜູ້ຮັບຜິດຊອບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.department` | ຫ້ອງການ/ຝ່າຍ | `src/features/legal/lib/department-select.tsx` |  |  |
| `legal.fields.purpose` | ຈຸດປະສົງ / ເນື້ອໃນ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.externalUrl` | ລິ້ງພາຍນອກ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.documents` | ເອກະສານແນບ | `src/features/legal/lib/legal-wizard.tsx, src/features/legal/lib/staged-files.tsx` |  |  |
| `legal.fields.createdAt` | ວັນທີສ້າງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.updatedAt` | ແກ້ໄຂລ່າສຸດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.caseCode` | ລະຫັດຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.defendant` | ຈຳເລີຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.allegation` | ຂໍ້ກ່າວຫາ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.departmentAction` | ການດຳເນີນງານຂອງພາກສ່ວນກ່ຽວຂ້ອງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.caseType` | ປະເພດຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.disputeStatus` | ຂັ້ນສານ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.damage` | ມູນຄ່າເສຍຫາຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.fine` | ມູນຄ່າປັບໄໝ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.totalDue` | ລວມຍອດທີ່ຕ້ອງຊຳລະ | `src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.recovered` | ມູນຄ່າທີ່ເກັບໄດ້ຄືນ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.date` | ວັນທີເລີ່ມຕົ້ນຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.disputeProgress` | ຄວາມຄືບໜ້າຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.fields.lak` | ກີບ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx` |  |  |
| `legal.fields.usd` | ໂດລາ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx` |  |  |
| `legal.fields.noDepartment` | ບໍ່ລະບຸ | `src/features/legal/lib/department-select.tsx` |  |  |
| `legal.fields.departmentsFailed` | ໂຫຼດລາຍຊື່ຫ້ອງການ/ຝ່າຍບໍ່ສຳເລັດ | `src/features/legal/lib/department-select.tsx` |  |  |
| `legal.validation.required` | ກະລຸນາປ້ອນຂໍ້ມູນນີ້ | `src/features/legal/cases/components/legal-case-form-dialog.test.tsx, src/features/legal/cases/components/legal-case-wizard.test.tsx, src/features/legal/documents/components/legal-document-form-dialog.test.tsx` |  |  |
| `legal.validation.invalid` | ຂໍ້ມູນບໍ່ຖືກຕ້ອງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.validation.titleMax` | ຊື່ນິຕິກຳຕ້ອງບໍ່ເກີນ 300 ຕົວອັກສອນ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.validation.textMax` | ຂໍ້ມູນຍາວເກີນກຳນົດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.validation.purposeMax` | ເນື້ອໃນຕ້ອງບໍ່ເກີນ 2000 ຕົວອັກສອນ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.validation.urlInvalid` | ລິ້ງຕ້ອງເລີ່ມຕົ້ນດ້ວຍ http:// ຫຼື https:// | `src/features/legal/documents/components/legal-document-form-dialog.test.tsx` |  |  |
| `legal.validation.yearRange` | ປີຕ້ອງເປັນຕົວເລກລະຫວ່າງ 1900 ຫາ 2100 | `src/features/legal/documents/components/legal-document-form-dialog.test.tsx` |  |  |
| `legal.validation.amountNonNegative` | ຈຳນວນເງິນຕ້ອງບໍ່ຕ່ຳກວ່າ 0 | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.validation.dateInvalid` | ວັນທີບໍ່ຖືກຕ້ອງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.validation.caseCodeDuplicate` | ລະຫັດຄະດີນີ້ມີຢູ່ແລ້ວ | `src/features/legal/cases/components/legal-case-form-dialog.test.tsx, src/features/legal/cases/components/legal-case-wizard.test.tsx, src/features/legal/cases/lib/legal-case-server-errors.test.ts` |  |  |
| `legal.wizard.title` | ເພີ່ມຂໍ້ມູນວຽກງານນິຕິກຳ | `src/features/legal/components/legal-new-view.test.tsx, src/features/legal/components/legal-new-view.tsx` |  |  |
| `legal.wizard.description` | ເລືອກປະເພດຂໍ້ມູນທີ່ຕ້ອງການສ້າງ | `src/features/legal/components/legal-new-view.tsx` |  |  |
| `legal.wizard.chooseRegulation` | ນິຕິກຳ | `src/features/legal/components/legal-new-view.test.tsx, src/features/legal/components/legal-new-view.tsx` |  |  |
| `legal.wizard.chooseRegulationDesc` | ສ້າງຂໍ້ມູນນິຕິກຳ, ຂໍ້ຕົກລົງ, ຂໍ້ກຳນົດ, ແຈ້ງການ ຫຼື ລະບຽບການໃໝ່ | `src/features/legal/components/legal-new-view.tsx` |  |  |
| `legal.wizard.chooseCase` | ຄະດີ | `src/features/legal/components/legal-new-view.test.tsx, src/features/legal/components/legal-new-view.tsx` |  |  |
| `legal.wizard.chooseCaseDesc` | ສ້າງຂໍ້ມູນສຳນວນຄະດີ ແລະ ຕິດຕາມຂັ້ນຕອນການດຳເນີນຄະດີໃໝ່ | `src/features/legal/components/legal-new-view.tsx` |  |  |
| `legal.wizard.next` | ຕໍ່ໄປ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.back` | ຍ້ອນກັບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.progress` | ຄວາມຄືບໜ້າການປ້ອນຂໍ້ມູນ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.progressText` | [Dynamic template function] | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.review` | ກວດສອບຂໍ້ມູນ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.edit` | ແກ້ໄຂ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.editSection` | [Dynamic template function] | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.stagedHint` | ເອກະສານຈະຖືກອັບໂຫຼດຫຼັງຈາກສ້າງສຳເລັດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.noFiles` | ບໍ່ມີເອກະສານແນບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.noLinks` | ບໍ່ມີລິ້ງພາຍນອກ | `src/features/legal/cases/components/legal-case-wizard.tsx, src/features/legal/documents/components/legal-document-wizard.tsx` |  |  |
| `legal.wizard.uploadFailed` | [Dynamic template function] | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.regulations.title` | ສ້າງນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.regulations.step1` | ຂໍ້ມູນທົ່ວໄປ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.regulations.step2` | ຄວາມຮັບຜິດຊອບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.regulations.step3` | ເອກະສານ ແລະ ກວດສອບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.regulations.submit` | ສ້າງນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.regulations.summary` | ສະຫຼຸບຂໍ້ມູນນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.regulations.created` | ສ້າງນິຕິກຳສຳເລັດແລ້ວ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.cases.title` | ສ້າງຄະດີ | `src/features/legal/components/legal-new-view.test.tsx` |  |  |
| `legal.wizard.cases.step1` | ຂໍ້ມູນຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.cases.step2` | ມູນຄ່າ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.cases.step3` | ຄວາມຄືບໜ້າ ແລະ ກວດສອບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.cases.submit` | ສ້າງຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.cases.summary` | ສະຫຼຸບຂໍ້ມູນຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.wizard.cases.created` | ສ້າງຄະດີສຳເລັດແລ້ວ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.title` | ພາບລວມວຽກງານນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.new` | ເພີ່ມໃໝ່ | `src/features/legal/dashboard/components/legal-dashboard-view.test.tsx` |  |  |
| `legal.dashboard.regulationsSection` | ນິຕິກຳ | `src/features/legal/dashboard/components/legal-dashboard-view.test.tsx` |  |  |
| `legal.dashboard.casesSection` | ຄະດີ | `src/features/legal/dashboard/components/legal-dashboard-view.test.tsx` |  |  |
| `legal.dashboard.viewAllRegulations` | ເບິ່ງລາຍການນິຕິກຳທັງໝົດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.viewAllCases` | ເບິ່ງລາຍການຄະດີທັງໝົດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.regulations.total` | ນິຕິກຳທັງໝົດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.regulations.active` | ຍັງນໍາໃຊ້ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.regulations.inactive` | ຍົກເລີກ / ບໍ່ໄດ້ໃຊ້ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.regulations.byType` | ຕາມປະເພດນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.regulations.byDepartment` | ຕາມຫ້ອງການ/ຝ່າຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.total` | ຄະດີທັງໝົດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.byStatus` | ຕາມຂັ້ນສານ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.damageLak` | ມູນຄ່າເສຍຫາຍ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.damageUsd` | ມູນຄ່າເສຍຫາຍ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.fineLak` | ມູນຄ່າປັບໄໝ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.fineUsd` | ມູນຄ່າປັບໄໝ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.totalDueLak` | ຍອດທີ່ຕ້ອງຊຳລະ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.totalDueUsd` | ຍອດທີ່ຕ້ອງຊຳລະ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.recoveredLak` | ເກັບຄືນໄດ້ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.recoveredUsd` | ເກັບຄືນໄດ້ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.moneyComparisonLak` | ປຽບທຽບມູນຄ່າ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.dashboard.cases.moneyComparisonUsd` | ປຽບທຽບມູນຄ່າ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.title` | ນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.searchLabel` | ຄົ້ນຫານິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.searchPlaceholder` | ຄົ້ນຫາຊື່ນິຕິກຳ, ເລກທີ ຫຼື ຜູ້ຮັບຜິດຊອບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.typeFilter` | ປະເພດນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.allTypes` | ທຸກປະເພດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.yearFilter` | ປີອອກນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.allYears` | ທຸກປີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.departmentFilter` | ຫ້ອງການ/ຝ່າຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.allDepartments` | ທຸກຫ້ອງການ/ຝ່າຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.delete` | ລຶບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.deleted` | ລຶບນິຕິກຳສຳເລັດແລ້ວ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.deleteTitle` | ລຶບນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.deleteDesc` | [Dynamic template function] | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.caption` | ຕາຕະລາງລາຍການນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.emptyHint` | ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.pageSize` | ຈຳນວນຕໍ່ໜ້າ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.resetFilters` | ລຶບຕົວກອງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.totalItems` | ລາຍການ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.exportCsv` | ສົ່ງອອກ CSV | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.exporting` | ກຳລັງສົ່ງອອກ... | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.print` | ພິມ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.add` | ເພີ່ມນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.list.edit` | ແກ້ໄຂ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.form.createTitle` | ເພີ່ມນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.form.editTitle` | ແກ້ໄຂນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.form.save` | ບັນທຶກ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.form.saving` | ກຳລັງບັນທຶກ... | `src/features/legal/lib/legal-wizard.tsx` |  |  |
| `legal.regulations.form.cancel` | ຍົກເລີກ | `src/features/legal/lib/legal-wizard.tsx` |  |  |
| `legal.regulations.form.saved` | ບັນທຶກນິຕິກຳສຳເລັດແລ້ວ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.form.requiredHint` | ຊ່ອງທີ່ມີເຄື່ອງໝາຍ * ແມ່ນຕ້ອງປ້ອນ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.form.urlPlaceholder` | https:// | `src/features/legal/cases/components/legal-case-form-fields.tsx, src/features/legal/documents/components/legal-document-form-fields.tsx` |  |  |
| `legal.regulations.form.stagedHint` | ເອກະສານຈະຖືກອັບໂຫຼດຫຼັງຈາກສ້າງນິຕິກຳສຳເລັດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.form.uploadFailed` | [Dynamic template function] | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.detail.backToList` | ກັບໄປລາຍການນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.detail.notFound` | ບໍ່ພົບນິຕິກຳນີ້ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.detail.info` | ຂໍ້ມູນນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.detail.link` | ລິ້ງພາຍນອກ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.detail.noLink` | ບໍ່ມີລິ້ງພາຍນອກ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.filePrefix` | EDL_Legal_Documents_ | `src/features/legal/documents/components/legal-documents-view.tsx` |  |  |
| `legal.regulations.csv.headers.0` | ຊື່ນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.headers.1` | ເລກທີ ແລະ ວັນທີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.headers.2` | ປະເພດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.headers.3` | ປີອອກນິຕິກຳ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.headers.4` | ຫ້ອງການ/ຝ່າຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.headers.5` | ຜູ້ຮັບຜິດຊອບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.headers.6` | ສະຖານະ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.headers.7` | ຈຸດປະສົງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.regulations.csv.headers.8` | ລິ້ງພາຍນອກ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.title` | ຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.searchLabel` | ຄົ້ນຫາຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.searchPlaceholder` | ຄົ້ນຫາລະຫັດຄະດີ, ຈຳເລີຍ ຫຼື ຂໍ້ກ່າວຫາ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.typeFilter` | ປະເພດຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.allTypes` | ທຸກປະເພດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.departmentFilter` | ຫ້ອງການ/ຝ່າຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.allDepartments` | ທຸກຫ້ອງການ/ຝ່າຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.startDate` | ຕັ້ງແຕ່ວັນທີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.endDate` | ເຖິງວັນທີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.totalDue` | ຍອດທີ່ຕ້ອງຊຳລະ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.recovered` | ເກັບຄືນໄດ້ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.delete` | ລຶບ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.deleted` | ລຶບຄະດີສຳເລັດແລ້ວ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.deleteTitle` | ລຶບຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.deleteDesc` | [Dynamic template function] | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.caption` | ຕາຕະລາງລາຍການຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.emptyHint` | ລອງປ່ຽນຕົວກອງ ຫຼື ຄຳຄົ້ນຫາ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.pageSize` | ຈຳນວນຕໍ່ໜ້າ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.resetFilters` | ລຶບຕົວກອງ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.totalItems` | ລາຍການ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.exportCsv` | ສົ່ງອອກ CSV | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.exporting` | ກຳລັງສົ່ງອອກ... | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.print` | ພິມ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.add` | ເພີ່ມຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.list.edit` | ແກ້ໄຂ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.createTitle` | ເພີ່ມຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.editTitle` | ແກ້ໄຂຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.save` | ບັນທຶກ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.saving` | ກຳລັງບັນທຶກ... | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.cancel` | ຍົກເລີກ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.saved` | ບັນທຶກຄະດີສຳເລັດແລ້ວ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.requiredHint` | ຊ່ອງທີ່ມີເຄື່ອງໝາຍ * ແມ່ນຕ້ອງປ້ອນ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.amountsSection` | ມູນຄ່າ ແລະ ຄ່າປັບໄໝ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.stagedHint` | ເອກະສານຈະຖືກອັບໂຫຼດຫຼັງຈາກສ້າງຄະດີສຳເລັດ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.form.uploadFailed` | [Dynamic template function] | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.detail.backToList` | ກັບໄປລາຍການຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.detail.notFound` | ບໍ່ພົບຄະດີນີ້ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.detail.info` | ຂໍ້ມູນຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.detail.amounts` | ມູນຄ່າ ແລະ ຄ່າປັບໄໝ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.detail.category` | ລາຍການ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.detail.stageStepper` | ຂັ້ນຕອນການດຳເນີນຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.detail.link` | ລິ້ງພາຍນອກ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.0` | ລະຫັດຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.1` | ຈຳເລີຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.2` | ຂໍ້ກ່າວຫາ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.3` | ຫ້ອງການ/ຝ່າຍ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.4` | ປະເພດຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.5` | ຂັ້ນສານ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.6` | ມູນຄ່າເສຍຫາຍ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.7` | ມູນຄ່າເສຍຫາຍ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.8` | ມູນຄ່າປັບໄໝ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.9` | ມູນຄ່າປັບໄໝ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.10` | ລວມຍອດທີ່ຕ້ອງຊຳລະ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.11` | ລວມຍອດທີ່ຕ້ອງຊຳລະ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.12` | ມູນຄ່າທີ່ເກັບໄດ້ຄືນ (LAK) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.13` | ມູນຄ່າທີ່ເກັບໄດ້ຄືນ (USD) | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.14` | ວັນທີເລີ່ມຕົ້ນຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
| `legal.cases.csv.headers.15` | ຄວາມຄືບໜ້າຄະດີ | `src/features/legal/cases/components/amount-pair-field.tsx, src/features/legal/cases/components/legal-case-detail-view.test.tsx` |  |  |
