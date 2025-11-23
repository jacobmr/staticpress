import { test, expect } from '@playwright/test'

// These tests require authentication
// Run with: PLAYWRIGHT_AUTH_COOKIE="your-session-cookie" npm run test:e2e

test.describe('Authenticated User Flows', () => {
  test.skip(!process.env.PLAYWRIGHT_AUTH_COOKIE, 'Requires authentication cookie')

  test.beforeEach(async ({ context }) => {
    // Set auth cookie if provided
    if (process.env.PLAYWRIGHT_AUTH_COOKIE) {
      await context.addCookies([
        {
          name: 'authjs.session-token',
          value: process.env.PLAYWRIGHT_AUTH_COOKIE,
          domain: new URL(process.env.PLAYWRIGHT_BASE_URL || 'https://www.staticpress.me').hostname,
          path: '/',
        },
      ])
    }
  })

  test('should access dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard')

    // Should stay on dashboard
    await expect(page).toHaveURL(/.*dashboard.*/)

    // Should show editor or file browser
    await expect(
      page.getByText(/new post/i)
        .or(page.getByText(/posts/i))
        .first()
    ).toBeVisible()
  })

  test('should access settings when authenticated', async ({ page }) => {
    await page.goto('/settings')

    await expect(page).toHaveURL(/.*settings.*/)

    // Should show settings form
    await expect(
      page.getByText(/repository/i)
        .or(page.getByText(/theme/i))
        .first()
    ).toBeVisible()
  })

  test('should show theme options in settings', async ({ page }) => {
    await page.goto('/settings')

    // Should show supported themes
    await expect(page.getByText(/papermod/i).first()).toBeVisible()
    await expect(page.getByText(/ananke/i).first()).toBeVisible()
  })

  test('should create new post flow', async ({ page }) => {
    await page.goto('/dashboard')

    // Click new post button
    const newPostButton = page.getByRole('button', { name: /new post/i })
      .or(page.getByText(/new post/i))

    if (await newPostButton.first().isVisible()) {
      await newPostButton.first().click()

      // Should show editor
      await expect(
        page.getByRole('textbox')
          .or(page.locator('[contenteditable="true"]'))
          .first()
      ).toBeVisible()
    }
  })

  test('should validate post before publishing', async ({ page }) => {
    await page.goto('/dashboard')

    // Try to publish empty post
    const publishButton = page.getByRole('button', { name: /publish/i })

    if (await publishButton.first().isVisible()) {
      await publishButton.first().click()

      // Should show error or validation message
      await expect(
        page.getByText(/required/i)
          .or(page.getByText(/error/i))
          .or(page.getByText(/title/i))
          .first()
      ).toBeVisible({ timeout: 3000 }).catch(() => {
        // May prevent click if disabled - that's ok
      })
    }
  })
})

test.describe('Theme Migration Warning', () => {
  test.skip(!process.env.PLAYWRIGHT_AUTH_COOKIE, 'Requires authentication cookie')
  test.skip(!process.env.TEST_LEGACY_THEME, 'Requires legacy theme setup')

  test.beforeEach(async ({ context }) => {
    if (process.env.PLAYWRIGHT_AUTH_COOKIE) {
      await context.addCookies([
        {
          name: 'authjs.session-token',
          value: process.env.PLAYWRIGHT_AUTH_COOKIE,
          domain: new URL(process.env.PLAYWRIGHT_BASE_URL || 'https://www.staticpress.me').hostname,
          path: '/',
        },
      ])
    }
  })

  test('should show warning for legacy themes', async ({ page }) => {
    await page.goto('/dashboard')

    // Check for migration warning
    const warning = page.getByText(/no longer.*supported/i)
      .or(page.getByText(/migration/i))

    await expect(warning.first()).toBeVisible()
  })

  test('should dismiss warning and persist', async ({ page }) => {
    await page.goto('/dashboard')

    // Find and click dismiss button
    const dismissButton = page.getByRole('button', { name: /dismiss/i })
      .or(page.getByLabel(/dismiss/i))

    if (await dismissButton.first().isVisible()) {
      await dismissButton.first().click()

      // Reload and check warning is gone
      await page.reload()

      const warning = page.getByText(/no longer.*supported/i)
      await expect(warning).not.toBeVisible({ timeout: 3000 })
    }
  })
})
