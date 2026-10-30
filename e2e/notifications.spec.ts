import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test.describe('notifications', () => {
  test('lists notifications, filters by source, and marks read', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/notifications');

    // Notification list is visible
    const list = page.getByRole('list', { name: lo.notifications.list });
    await expect(list).toBeVisible();
    const items = list.getByRole('listitem');
    await expect(items.first()).toBeVisible();

    // Source filtering group
    const filterGroup = page.getByRole('group', { name: lo.notifications.filterLabel });
    const powerFilter = filterGroup.getByRole('button', { name: lo.notifications.sourcePower, exact: true });
    await powerFilter.click();
    await expect(page).toHaveURL(/source=power/);
    await expect(powerFilter).toHaveAttribute('aria-pressed', 'true');

    // Switch back to all
    const allFilter = filterGroup.getByRole('button', { name: lo.notifications.all, exact: true });
    await allFilter.click();
    await expect(page).toHaveURL(/\/notifications(?:\?.*)?$/);

    // Filter by unread
    const unreadCheckbox = page.getByRole('checkbox', { name: lo.notifications.unreadOnly });
    await unreadCheckbox.check();
    await expect(page).toHaveURL(/unread=true/);
    await unreadCheckbox.uncheck();

    // Mark one notification as read
    const markButtons = page.getByRole('button', { name: new RegExp(lo.notifications.markRead) });
    const initialCount = await markButtons.count();
    if (initialCount > 0) {
      await markButtons.first().click();
      await expect(markButtons).toHaveCount(initialCount - 1);
    }

    // Mark all as read
    const markAllBtn = page.getByRole('button', { name: lo.notifications.markAllRead, exact: true });
    if (await markAllBtn.isEnabled()) {
      await markAllBtn.click();
      await expect(markAllBtn).toBeDisabled();
    }
  });
});
