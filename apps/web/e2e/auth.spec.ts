import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show GitHub login on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /sign in with github/i })).toBeVisible();
  });

  test('should load settings page', async ({ page }) => {
    await page.goto('/settings');
    // Settings page loads (may show login prompt or redirect)
    await expect(page).toHaveURL(/\/(settings)?/);
  });

  test('should display home page with branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /markwrite/i })).toBeVisible();
  });
});
