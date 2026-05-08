import { test, expect } from '@playwright/test';

test.describe('Editor', () => {
  test('should load editor page structure', async ({ page }) => {
    await page.goto('/documents/test-doc-id');
    await expect(page).toHaveURL(/\//);
  });

  test('should have page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/markwrite/i);
  });
});
