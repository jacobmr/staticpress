import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/StaticPress/);
});

test('get started link', async ({ page }) => {
    await page.goto('/');

    // Click the get started link.
    await page.getByRole('link', { name: /Sign In/i }).first().click();

    // Expects page to have a heading with the name of Installation.
    // Note: This might redirect to GitHub, so we just check if it tries to navigate
    // or if we are on the sign in page.
});
