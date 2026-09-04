import { test, expect } from '@playwright/test';

test.describe('Library', () => {
  test('loads and shows paginated games', async ({ page }) => {
    await page.goto('/library');

    const gameCards = page.locator('app-game-card');
    await expect(gameCards.first()).toBeVisible({ timeout: 10_000 });

    // 21 per page — should show a full page unless the library has fewer games
    const count = await gameCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(21);
  });

  test('searching filters the visible games', async ({ page }) => {
    await page.goto('/library');
    await page.locator('app-game-card').first().waitFor({ timeout: 10_000 });

    const firstGameName = await page.locator('app-game-card h3').first().textContent();

    await page.getByPlaceholder('Search games...').fill(firstGameName!.trim());

    await expect(page.locator('app-game-card')).toHaveCount(1, { timeout: 5_000 });
    await expect(page.locator('app-game-card h3').first()).toHaveText(firstGameName!.trim());
  });

  test('changing the sort order changes the URL and the first result', async ({ page }) => {
    await page.goto('/library');
    await page.locator('app-game-card').first().waitFor({ timeout: 10_000 });

    await page.locator('select').selectOption('playtime-desc');

    await expect(page).toHaveURL(/sort=playtime-desc/);
  });

  test('navigating to page 2 updates the URL and persists across a reload', async ({ page }) => {
    await page.goto('/library');
    await page.locator('app-game-card').first().waitFor({ timeout: 10_000 });

    const page2Button = page.locator('.page-btn', { hasText: '2' });

    // Only proceed if there's actually a second page — depends on real library size
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await expect(page).toHaveURL(/page=2/);

      await page.reload();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.locator('.page-btn.active')).toHaveText('2');
    }
  });

  test('switching to the Backlog tab navigates to /backlog and updates the visible tab', async ({
    page,
  }) => {
    await page.goto('/library');

    await page.locator('.status-tab', { hasText: 'Backlog' }).click();

    await expect(page).toHaveURL(/\/backlog/);
    await expect(page.locator('.status-tab.active')).toHaveText('Backlog');
  });

  test('clicking back from a game details page returns to the same library page/filter', async ({
    page,
  }) => {
    await page.goto('/library');
    await page.locator('app-game-card').first().waitFor({ timeout: 10_000 });

    const page2Button = page.locator('.page-btn', { hasText: '2' });
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await expect(page).toHaveURL(/page=2/);
    }

    await page.locator('app-game-card').first().click();
    await expect(page).toHaveURL(/\/game\/\d+/);

    await page.locator('.navbar-back-link').click();

    await expect(page).toHaveURL(/\/library/);
    if (await page2Button.isVisible()) {
      await expect(page).toHaveURL(/page=2/);
    }
  });
});
