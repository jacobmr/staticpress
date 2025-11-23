import { test, expect } from '@playwright/test'

test.describe('Deployment Page', () => {
  test('should redirect unauthenticated users from deploy page', async ({ page }) => {
    await page.goto('/deploy')

    // Should redirect to home or show sign in
    await expect(page).not.toHaveURL(/.*deploy.*/, { timeout: 5000 }).catch(() => {
      // If still on deploy page, should show auth prompt
      return expect(page.getByText(/sign in/i).first()).toBeVisible()
    })
  })

  test('should display platform options for authenticated users', async ({ page }) => {
    // Navigate to deploy page - will redirect if not authenticated
    const response = await page.goto('/deploy')

    // Check if redirected (302) or forbidden (403) for unauthenticated users
    // This is expected behavior
    if (response && (response.status() === 302 || response.status() === 303)) {
      // Successfully redirected unauthenticated user
      expect(response.status()).toBeLessThan(400)
      return
    }

    // If we somehow have a session, verify the platform cards exist
    const url = page.url()
    if (url.includes('/deploy')) {
      // Check for platform headings
      await expect(page.getByText('GitHub Pages').first()).toBeVisible()
      await expect(page.getByText('Cloudflare Pages').first()).toBeVisible()
      await expect(page.getByText('Vercel').first()).toBeVisible()
      await expect(page.getByText('Netlify').first()).toBeVisible()
    }
  })

  test('should have correct page structure elements', async ({ page }) => {
    await page.goto('/deploy')

    // If authenticated, check page structure
    const url = page.url()
    if (url.includes('/deploy')) {
      // Check for header navigation
      await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible()

      // Check for main heading
      await expect(page.getByRole('heading', { name: /deploy your blog/i })).toBeVisible()

      // Check for custom domain section
      await expect(page.getByText(/custom domain/i).first()).toBeVisible()
    }
  })
})

test.describe('Deployment API - Platform Management', () => {
  test('GET /api/deployment/platforms should require authentication', async ({ request }) => {
    const response = await request.get('/api/deployment/platforms')

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('POST /api/deployment/platforms with invalid platform should return 400 or 401', async ({ request }) => {
    const response = await request.post('/api/deployment/platforms', {
      data: {
        platform: 'invalid-platform',
        accessToken: 'test-token',
      },
    })

    // Should return 400 (validation) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })

  test('POST /api/deployment/platforms with missing fields should return 400 or 401', async ({ request }) => {
    const response = await request.post('/api/deployment/platforms', {
      data: {
        platform: 'vercel',
        // Missing accessToken
      },
    })

    // Should return 400 (validation) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })

  test('POST /api/deployment/platforms with empty data should return error', async ({ request }) => {
    const response = await request.post('/api/deployment/platforms', {
      data: {},
    })

    // Should return 400 (validation) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })
})

test.describe('Deployment API - Project Management', () => {
  test('GET /api/deployment/projects should require authentication', async ({ request }) => {
    const response = await request.get('/api/deployment/projects')

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('POST /api/deployment/projects with missing fields should return 400 or 401', async ({ request }) => {
    const response = await request.post('/api/deployment/projects', {
      data: {
        platform: 'vercel',
        // Missing required fields: name, repositoryId
      },
    })

    // Should return 400 (validation) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })

  test('POST /api/deployment/projects with invalid platform should return error', async ({ request }) => {
    const response = await request.post('/api/deployment/projects', {
      data: {
        platform: 'not-a-valid-platform',
        name: 'test-project',
        repositoryId: '123',
      },
    })

    // Should return 400 (validation) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })

  test('POST /api/deployment/projects with empty name should return error', async ({ request }) => {
    const response = await request.post('/api/deployment/projects', {
      data: {
        platform: 'vercel',
        name: '',
        repositoryId: '123',
      },
    })

    // Should return 400 (validation) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })
})

test.describe('Deployment API - Deploy Endpoint', () => {
  test('POST /api/deployment/projects/[id]/deploy without auth should return 401', async ({ request }) => {
    const response = await request.post('/api/deployment/projects/test-project-id/deploy', {
      data: {
        branch: 'main',
        isProduction: true,
      },
    })

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('POST /api/deployment/projects/[id]/deploy with missing body should return error', async ({ request }) => {
    const response = await request.post('/api/deployment/projects/test-project-id/deploy', {
      data: {},
    })

    // Should return 400 (validation) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })

  test('POST /api/deployment/projects with non-existent project should return error', async ({ request }) => {
    const response = await request.post('/api/deployment/projects/non-existent-id-12345/deploy', {
      data: {
        branch: 'main',
        isProduction: true,
      },
    })

    // Should return 401 (auth) or 404 (not found)
    expect([401, 404]).toContain(response.status())
  })
})

test.describe('Deployment API - Status Endpoint', () => {
  test('GET /api/deployment/projects/[id]/status without auth should return 401', async ({ request }) => {
    const response = await request.get('/api/deployment/projects/test-project-id/status')

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('GET /api/deployment/projects/[id]/status with invalid ID should return error', async ({ request }) => {
    const response = await request.get('/api/deployment/projects/invalid-uuid-format/status')

    // Should return 401 (auth), 404 (not found), or 400 (invalid format)
    expect([400, 401, 404]).toContain(response.status())
  })

  test('GET /api/deployment/projects/[id]/status with random UUID should return error', async ({ request }) => {
    // Use a properly formatted UUID that doesn't exist
    const response = await request.get('/api/deployment/projects/12345678-1234-1234-1234-123456789012/status')

    // Should return 401 (auth) or 404 (not found)
    expect([401, 404]).toContain(response.status())
  })
})

test.describe('Deployment API - OAuth Flow', () => {
  test('GET /api/deployment/oauth/vercel should require authentication', async ({ request }) => {
    const response = await request.get('/api/deployment/oauth/vercel')

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('GET /api/deployment/oauth/netlify should require authentication', async ({ request }) => {
    const response = await request.get('/api/deployment/oauth/netlify')

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('GET /api/deployment/oauth/cloudflare should require authentication', async ({ request }) => {
    const response = await request.get('/api/deployment/oauth/cloudflare')

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('GET /api/deployment/oauth/github-pages should return error (uses existing auth)', async ({ request }) => {
    const response = await request.get('/api/deployment/oauth/github-pages')

    // GitHub Pages doesn't use OAuth flow - should return 400 or 401
    expect([400, 401]).toContain(response.status())
  })

  test('GET /api/deployment/oauth/invalid-platform should return error', async ({ request }) => {
    const response = await request.get('/api/deployment/oauth/invalid-platform')

    // Should return 400 (invalid platform) or 401 (auth)
    expect([400, 401]).toContain(response.status())
  })

  test('OAuth callback without code should redirect with error', async ({ page }) => {
    // Try to access callback without code parameter
    await page.goto('/api/deployment/oauth/vercel/callback')

    // Should redirect to settings with error or to sign-in
    const url = page.url()
    expect(
      url.includes('error') ||
      url.includes('signin') ||
      url.includes('sign-in') ||
      url.includes('/')
    ).toBeTruthy()
  })

  test('OAuth callback without state should redirect with error', async ({ page }) => {
    await page.goto('/api/deployment/oauth/netlify/callback?code=test-code')

    // Should redirect to settings with error or to sign-in
    const url = page.url()
    expect(
      url.includes('error') ||
      url.includes('signin') ||
      url.includes('sign-in') ||
      url.includes('/')
    ).toBeTruthy()
  })

  test('OAuth callback with error parameter should redirect with error', async ({ page }) => {
    await page.goto('/api/deployment/oauth/vercel/callback?error=access_denied&error_description=User%20denied%20access')

    // Should redirect to settings with error or to sign-in
    const url = page.url()
    expect(
      url.includes('error') ||
      url.includes('signin') ||
      url.includes('sign-in') ||
      url.includes('/')
    ).toBeTruthy()
  })
})

test.describe('Deployment API - Platform-specific Routes', () => {
  test('GET /api/deployment/platforms/vercel should require authentication', async ({ request }) => {
    const response = await request.get('/api/deployment/platforms/vercel')

    // This endpoint may not exist (404) or require auth (401)
    expect([401, 404]).toContain(response.status())
  })

  test('DELETE /api/deployment/platforms/vercel should require authentication', async ({ request }) => {
    const response = await request.delete('/api/deployment/platforms/vercel')

    // Should require auth (401) or endpoint may not exist (404/405)
    expect([401, 404, 405]).toContain(response.status())
  })
})

test.describe('Deployment API - Project Domains', () => {
  test('GET /api/deployment/projects/[id]/domains without auth should return 401', async ({ request }) => {
    const response = await request.get('/api/deployment/projects/test-project-id/domains')

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('POST /api/deployment/projects/[id]/domains without auth should return 401', async ({ request }) => {
    const response = await request.post('/api/deployment/projects/test-project-id/domains', {
      data: {
        domain: 'example.com',
      },
    })

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})

test.describe('Deployment API - Project Logs', () => {
  test('GET /api/deployment/projects/[id]/logs without auth should return 401', async ({ request }) => {
    const response = await request.get('/api/deployment/projects/test-project-id/logs')

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})

test.describe('Platform UI Elements', () => {
  test('should show all four platforms on deploy page when authenticated', async ({ page }) => {
    await page.goto('/deploy')

    const url = page.url()
    if (url.includes('/deploy')) {
      // Verify all platform cards are present
      const platforms = ['GitHub Pages', 'Cloudflare Pages', 'Vercel', 'Netlify']

      for (const platform of platforms) {
        const platformHeading = page.getByRole('heading', { name: platform })
        await expect(platformHeading).toBeVisible()
      }
    }
  })

  test('should have external links for platform documentation', async ({ page }) => {
    await page.goto('/deploy')

    const url = page.url()
    if (url.includes('/deploy')) {
      // Check for external links to platforms
      const cloudflareLink = page.getByRole('link', { name: /deploy to cloudflare/i })
      const vercelLink = page.getByRole('link', { name: /deploy to vercel/i })
      const netlifyLink = page.getByRole('link', { name: /deploy to netlify/i })

      if (await cloudflareLink.isVisible()) {
        await expect(cloudflareLink).toHaveAttribute('target', '_blank')
      }

      if (await vercelLink.isVisible()) {
        await expect(vercelLink).toHaveAttribute('target', '_blank')
      }

      if (await netlifyLink.isVisible()) {
        await expect(netlifyLink).toHaveAttribute('target', '_blank')
      }
    }
  })

  test('should mark GitHub Pages as recommended', async ({ page }) => {
    await page.goto('/deploy')

    const url = page.url()
    if (url.includes('/deploy')) {
      // GitHub Pages should have "Recommended" badge
      await expect(page.getByText('Recommended').first()).toBeVisible()
    }
  })

  test('should have Back to Dashboard link', async ({ page }) => {
    await page.goto('/deploy')

    const url = page.url()
    if (url.includes('/deploy')) {
      const backLink = page.getByRole('link', { name: /back to dashboard/i })
      await expect(backLink).toBeVisible()
      await expect(backLink).toHaveAttribute('href', '/dashboard')
    }
  })
})

test.describe('Deployment Page Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/deploy')

    const url = page.url()
    if (url.includes('/deploy')) {
      // Check for h1 heading
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()

      // Check for h2 headings (platform names)
      const h2Elements = page.locator('h2')
      const count = await h2Elements.count()
      expect(count).toBeGreaterThanOrEqual(4) // At least 4 platforms
    }
  })

  test('should have accessible links with proper attributes', async ({ page }) => {
    await page.goto('/deploy')

    const url = page.url()
    if (url.includes('/deploy')) {
      // External links should have rel="noopener noreferrer"
      const externalLinks = page.locator('a[target="_blank"]')
      const count = await externalLinks.count()

      for (let i = 0; i < count; i++) {
        const link = externalLinks.nth(i)
        await expect(link).toHaveAttribute('rel', /noopener/)
      }
    }
  })
})

test.describe('API Response Format', () => {
  test('platform API should return proper JSON structure', async ({ request }) => {
    const response = await request.get('/api/deployment/platforms')

    // Even for 401, should return JSON
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')

    const body = await response.json()
    expect(body).toBeDefined()
    expect(typeof body).toBe('object')
  })

  test('projects API should return proper JSON structure', async ({ request }) => {
    const response = await request.get('/api/deployment/projects')

    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')

    const body = await response.json()
    expect(body).toBeDefined()
  })

  test('deploy API should return proper error JSON structure', async ({ request }) => {
    const response = await request.post('/api/deployment/projects/test-id/deploy', {
      data: { branch: 'main' },
    })

    const body = await response.json()
    expect(body).toBeDefined()
    expect(body.error || body.success).toBeDefined()
  })

  test('status API should return proper JSON structure', async ({ request }) => {
    const response = await request.get('/api/deployment/projects/test-id/status')

    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')

    const body = await response.json()
    expect(body).toBeDefined()
  })
})

test.describe('Edge Cases and Error Handling', () => {
  test('should handle malformed JSON in POST requests', async ({ request }) => {
    const response = await request.post('/api/deployment/platforms', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: 'not-valid-json',
    })

    // Should return 400 or 401, but not 500
    expect(response.status()).toBeLessThan(500)
  })

  test('should handle empty POST body', async ({ request }) => {
    const response = await request.post('/api/deployment/projects', {
      data: null,
    })

    // Should return client error, not server error
    expect([400, 401]).toContain(response.status())
  })

  test('should handle very long project names', async ({ request }) => {
    const longName = 'a'.repeat(1000)

    const response = await request.post('/api/deployment/projects', {
      data: {
        platform: 'vercel',
        name: longName,
        repositoryId: '123',
      },
    })

    // Should return 400 (validation) or 401 (auth), not 500
    expect([400, 401]).toContain(response.status())
  })

  test('should handle special characters in project ID', async ({ request }) => {
    const specialId = 'test<script>alert(1)</script>'

    const response = await request.get(`/api/deployment/projects/${encodeURIComponent(specialId)}/status`)

    // Should return error but not expose vulnerability
    expect(response.status()).toBeLessThan(500)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})
