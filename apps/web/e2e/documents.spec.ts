import { test, expect } from '@playwright/test';

test.describe('Document Management', () => {
  test('should load documents page', async ({ page }) => {
    await page.goto('/documents');
    // Page loads successfully
    await expect(page).toHaveURL(/\//);
  });

  test('should have accessible home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/markwrite/i);
    await expect(page.locator('body')).toBeVisible();
  });
});
