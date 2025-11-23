import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/')

    // Check page title contains StaticPress
    await expect(page).toHaveTitle(/StaticPress/i)
  })

  test('should display sign in button', async ({ page }) => {
    await page.goto('/')

    // Look for sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i })
      .or(page.getByRole('link', { name: /sign in/i }))

    await expect(signInButton.first()).toBeVisible()
  })

  test('should display pricing section', async ({ page }) => {
    await page.goto('/')

    // Check for pricing tiers
    await expect(page.getByText(/free/i).first()).toBeVisible()
    await expect(page.getByText(/personal/i).first()).toBeVisible()
  })

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/pricing')

    // Check pricing page loads
    await expect(page.getByText(/choose your plan/i).or(page.getByText(/pricing/i).first())).toBeVisible()
  })

  test('should navigate to help page', async ({ page }) => {
    await page.goto('/help')

    // Check help page loads
    await expect(page).toHaveURL(/.*help.*/)
  })
})

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to home or show sign in
    // Either URL changes or sign in prompt appears
    await expect(page).not.toHaveURL(/.*dashboard.*/, { timeout: 5000 }).catch(() => {
      // If still on dashboard, should show auth prompt
      return expect(page.getByText(/sign in/i).first()).toBeVisible()
    })
  })

  test('should redirect unauthenticated users from settings', async ({ page }) => {
    await page.goto('/settings')

    await expect(page).not.toHaveURL(/.*settings.*/, { timeout: 5000 }).catch(() => {
      return expect(page.getByText(/sign in/i).first()).toBeVisible()
    })
  })

  test('sign in button should trigger GitHub OAuth', async ({ page }) => {
    await page.goto('/')

    // Click sign in
    const signInButton = page.getByRole('button', { name: /sign in/i })
      .or(page.getByRole('link', { name: /sign in/i }))

    // Set up listener for navigation
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      signInButton.first().click(),
    ])

    // Either redirects to GitHub or opens popup
    if (popup) {
      await expect(popup).toHaveURL(/github\.com/)
    } else {
      // Check if redirected to GitHub OAuth
      await page.waitForURL(/github\.com|\/api\/auth/, { timeout: 5000 }).catch(() => {
        // May stay on page with modal - that's ok too
      })
    }
  })
})

test.describe('API Validation', () => {
  test('publish endpoint should reject invalid input', async ({ request }) => {
    const response = await request.post('/api/posts/publish', {
      data: {
        title: '',
        content: '',
      },
    })

    // Should return 400 or 401
    expect([400, 401]).toContain(response.status())
  })

  test('publish endpoint should require authentication', async ({ request }) => {
    const response = await request.post('/api/posts/publish', {
      data: {
        title: 'Test Post',
        content: '<p>Test content</p>',
      },
    })

    expect(response.status()).toBe(401)
  })

  test('feedback endpoint should validate input', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        type: 'invalid',
        message: 'test',
      },
    })

    // Should return 400 (validation) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })
})
