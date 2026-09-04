import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads and shows the placeholder profile with real Steam data', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText('this is a placeholder profile')).toBeVisible();

    // Stats should render with real (non-zero) numbers, not stay stuck on a loading state
    await expect(page.getByText('Owned Games')).toBeVisible();
    const ownedGamesValue = page
      .locator('.stat-card', { hasText: 'Owned Games' })
      .locator('.stat-value');
    await expect(ownedGamesValue).not.toHaveText('0');
  });

  test('shows at least one recently played game card', async ({ page }) => {
    await page.goto('/dashboard');

    const gameCards = page.locator('app-game-card');
    await expect(gameCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a recently played game navigates to its details page', async ({ page }) => {
    await page.goto('/dashboard');

    const firstCard = page.locator('app-game-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/game\/\d+/);
    await expect(page.locator('.hero h1')).toBeVisible();
  });
});
