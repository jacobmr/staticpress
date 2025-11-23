# PRD: StaticPress Codebase Improvements & Bug Fixes

**Version:** 1.0
**Date:** 2025-11-23
**Author:** Claude Code Review
**Status:** Draft

---

## Executive Summary

This PRD outlines critical improvements and bug fixes for StaticPress, prioritizing issues that affect core functionality. The most significant issue is the theme management system, which currently breaks featured images across all themes. Additional improvements include security hardening, code quality, and developer experience enhancements.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Non-Goals](#goals--non-goals)
3. [Success Metrics](#success-metrics)
4. [Epic 1: Theme System Simplification](#epic-1-theme-system-simplification)
5. [Epic 2: Critical Bug Fixes](#epic-2-critical-bug-fixes)
6. [Epic 3: Input Validation & Security](#epic-3-input-validation--security)
7. [Epic 4: Code Quality & Observability](#epic-4-code-quality--observability)
8. [Epic 5: Testing Infrastructure](#epic-5-testing-infrastructure)
9. [Architecture Considerations](#architecture-considerations)
10. [Implementation Order & Dependencies](#implementation-order--dependencies)
11. [Risks & Mitigations](#risks--mitigations)

---

## Problem Statement

StaticPress has several critical issues affecting user experience:

1. **Featured images are broken** - The frontmatter field `featureimage` is not recognized by any Hugo theme
2. **Theme switching creates broken sites** - Each theme requires different config/frontmatter structures
3. **No input validation** - API endpoints accept unvalidated input
4. **Debug logging in production** - Sensitive content logged to server
5. **No test coverage** - Zero automated tests
6. **Fragile YAML parsing** - Custom parser breaks on common YAML patterns

---

## Goals & Non-Goals

### Goals
- Fix all broken functionality (featured images, theme configs)
- Simplify theme management to reduce maintenance burden
- Add security hardening through input validation
- Establish testing infrastructure for future development
- Improve observability with proper logging and monitoring

### Non-Goals
- Adding new features beyond fixes
- Supporting additional Hugo themes (simplifying to fewer)
- Migrating to a different database or auth system
- Mobile app development

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Featured images working | 0% | 100% |
| API endpoints with validation | 0% | 100% |
| Test coverage | 0% | 60%+ |
| Production console.logs | 15+ | 0 |
| Themes fully supported | 0/6 | 2/2 |

---

## Epic 1: Theme System Simplification

### Background

The current theme system attempts to support 6 different Hugo themes but fails to account for their different requirements. Each theme uses different:
- Frontmatter fields for featured images
- Config parameter structures
- Author information formats

### Decision: Reduce to Two Supported Themes

**Recommended themes:** PaperMod and Ananke

**Rationale:**
- Most popular and well-maintained
- Good documentation
- Different aesthetics (modern vs classic)
- Manageable maintenance burden

### Story 1.1: Create Theme Profile System

**Description:** Create a type-safe theme profile system that encapsulates all theme-specific behavior.

**Technical Specification:**

Create `lib/theme-profiles.ts`:

```typescript
export interface ThemeProfile {
  id: string
  name: string
  repo: string

  // Frontmatter configuration
  frontmatter: {
    featuredImageField: string | null  // e.g., 'featured_image', 'cover.image'
    featuredImageIsNested: boolean     // true for PaperMod's cover.image
    authorField: string | null         // e.g., 'author', 'authors'
    summaryField: string | null        // e.g., 'summary', 'description'
    additionalFields?: Record<string, unknown>
  }

  // Config requirements
  config: {
    paramsTemplate: string  // TOML template for [params] section
    requiredSections: string[]  // e.g., ['markup.goldmark.renderer']
  }

  // Functions
  generateFrontmatter: (data: PostData) => string
  validateConfig: (config: string) => ValidationResult
  getDefaultConfig: () => string
}

export interface PostData {
  title: string
  date: string
  draft: boolean
  content: string
  featuredImage?: string
  tags?: string[]
  categories?: string[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

**Files to create:**
- `lib/theme-profiles.ts` - Core interface and types
- `lib/theme-profiles/papermod.ts` - PaperMod implementation
- `lib/theme-profiles/ananke.ts` - Ananke implementation
- `lib/theme-profiles/index.ts` - Exports and registry

**Acceptance Criteria:**
- [ ] ThemeProfile interface defined with full type safety
- [ ] PaperMod profile correctly generates frontmatter with `cover.image`
- [ ] Ananke profile correctly generates frontmatter with `featured_image`
- [ ] Both profiles include default config templates
- [ ] Unit tests for both profile implementations

---

### Story 1.2: Implement PaperMod Theme Profile

**Description:** Create complete PaperMod theme profile with correct frontmatter and config.

**Technical Details:**

PaperMod frontmatter structure:
```yaml
---
title: "Post Title"
date: 2024-01-15T10:00:00Z
draft: false
cover:
  image: "/images/featured.jpg"
  alt: "Alt text"
  caption: "Caption"
tags: ["tag1", "tag2"]
categories: ["category1"]
---
```

PaperMod config requirements:
```toml
[params]
  defaultTheme = "auto"
  ShowReadingTime = true
  ShowShareButtons = true
  ShowPostNavLinks = true
  ShowBreadCrumbs = true
  ShowCodeCopyButtons = true

[params.cover]
  hidden = false
  hiddenInList = false
  hiddenInSingle = false
```

**Implementation in `lib/theme-profiles/papermod.ts`:**

```typescript
import { ThemeProfile, PostData } from '../theme-profiles'

export const papermodProfile: ThemeProfile = {
  id: 'papermod',
  name: 'PaperMod',
  repo: 'https://github.com/adityatelange/hugo-PaperMod.git',

  frontmatter: {
    featuredImageField: 'cover.image',
    featuredImageIsNested: true,
    authorField: 'author',
    summaryField: 'summary',
  },

  config: {
    paramsTemplate: `[params]
  defaultTheme = "auto"
  ShowReadingTime = true
  ShowShareButtons = false
  ShowPostNavLinks = true
  ShowBreadCrumbs = true
  ShowCodeCopyButtons = true

[params.cover]
  hidden = false
  hiddenInList = false
  hiddenInSingle = false`,
    requiredSections: ['markup.goldmark.renderer'],
  },

  generateFrontmatter: (data: PostData): string => {
    const lines = ['---']
    lines.push(`title: "${escapeYaml(data.title)}"`)
    lines.push(`date: ${data.date}`)
    lines.push(`draft: ${data.draft}`)

    if (data.featuredImage) {
      lines.push('cover:')
      lines.push(`  image: "${data.featuredImage}"`)
      lines.push(`  alt: "${escapeYaml(data.title)}"`)
      lines.push('  hidden: false')
    }

    if (data.tags?.length) {
      lines.push('tags:')
      data.tags.forEach(tag => lines.push(`  - "${escapeYaml(tag)}"`))
    }

    if (data.categories?.length) {
      lines.push('categories:')
      data.categories.forEach(cat => lines.push(`  - "${escapeYaml(cat)}"`))
    }

    lines.push('---')
    return lines.join('\n')
  },

  validateConfig: (config: string) => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!config.includes('[params]')) {
      errors.push('Missing [params] section')
    }
    if (!config.includes('unsafe = true')) {
      warnings.push('Goldmark unsafe rendering not enabled - images may not display')
    }

    return { valid: errors.length === 0, errors, warnings }
  },

  getDefaultConfig: () => `baseURL = "https://example.org/"
languageCode = "en-us"
title = "My Blog"
theme = "PaperMod"

[params]
  defaultTheme = "auto"
  ShowReadingTime = true
  ShowShareButtons = false
  ShowPostNavLinks = true
  ShowBreadCrumbs = true
  ShowCodeCopyButtons = true

[params.cover]
  hidden = false
  hiddenInList = false
  hiddenInSingle = false

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"')
}
```

**Acceptance Criteria:**
- [ ] Frontmatter generates correctly with nested `cover.image`
- [ ] Config validation catches missing required sections
- [ ] Default config includes all PaperMod requirements
- [ ] Unit tests pass for all profile methods

---

### Story 1.3: Implement Ananke Theme Profile

**Description:** Create complete Ananke theme profile with correct frontmatter and config.

**Technical Details:**

Ananke frontmatter structure:
```yaml
---
title: "Post Title"
date: 2024-01-15T10:00:00Z
draft: false
featured_image: "/images/featured.jpg"
tags: ["tag1", "tag2"]
---
```

Ananke config requirements:
```toml
[params]
  author = "Author Name"
  show_reading_time = false
  mainSections = ["posts"]

[params.ananke]
  version = "3.0"
```

**Implementation in `lib/theme-profiles/ananke.ts`:**

```typescript
import { ThemeProfile, PostData } from '../theme-profiles'

export const anankeProfile: ThemeProfile = {
  id: 'ananke',
  name: 'Ananke',
  repo: 'https://github.com/theNewDynamic/gohugo-theme-ananke.git',

  frontmatter: {
    featuredImageField: 'featured_image',
    featuredImageIsNested: false,
    authorField: null,  // Ananke uses global author
    summaryField: 'description',
  },

  config: {
    paramsTemplate: `[params]
  author = "StaticPress User"
  show_reading_time = false
  mainSections = ["posts"]`,
    requiredSections: ['markup.goldmark.renderer'],
  },

  generateFrontmatter: (data: PostData): string => {
    const lines = ['---']
    lines.push(`title: "${escapeYaml(data.title)}"`)
    lines.push(`date: ${data.date}`)
    lines.push(`draft: ${data.draft}`)

    if (data.featuredImage) {
      lines.push(`featured_image: "${data.featuredImage}"`)
    }

    if (data.tags?.length) {
      lines.push('tags:')
      data.tags.forEach(tag => lines.push(`  - "${escapeYaml(tag)}"`))
    }

    lines.push('---')
    return lines.join('\n')
  },

  validateConfig: (config: string) => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!config.includes('[params]')) {
      errors.push('Missing [params] section')
    }
    // Ananke-specific: warn if nested author exists
    if (config.includes('[params.author]')) {
      errors.push('Ananke requires simple author string, not nested [params.author]')
    }
    if (!config.includes('unsafe = true')) {
      warnings.push('Goldmark unsafe rendering not enabled')
    }

    return { valid: errors.length === 0, errors, warnings }
  },

  getDefaultConfig: () => `baseURL = "https://example.org/"
languageCode = "en-us"
title = "My Blog"
theme = "ananke"

[params]
  author = "StaticPress User"
  show_reading_time = false
  mainSections = ["posts"]

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
}
```

**Acceptance Criteria:**
- [ ] Frontmatter generates with flat `featured_image` field
- [ ] Config validation catches nested author error
- [ ] Default config matches Ananke requirements
- [ ] Unit tests pass for all profile methods

---

### Story 1.4: Update Publish API to Use Theme Profiles

**Description:** Modify the publish API to generate theme-specific frontmatter using the profile system.

**Files to modify:**
- `app/api/posts/publish/route.ts`

**Technical Changes:**

```typescript
// Before (current code)
const frontmatterData = {
  title,
  date: new Date().toISOString(),
  draft,
  ...(featureImageUrl && { featureimage: featureImageUrl }),  // WRONG FIELD
}
frontmatter = generateFrontmatter(frontmatterData)

// After (using theme profiles)
import { getThemeProfile } from '@/lib/theme-profiles'

// Inside POST handler:
const themeProfile = getThemeProfile(repoConfig.theme || 'papermod')

const postData: PostData = {
  title,
  date: new Date().toISOString(),
  draft,
  content: markdownContent,
  featuredImage: featureImageUrl || undefined,
}

frontmatter = themeProfile.generateFrontmatter(postData)
```

**Acceptance Criteria:**
- [ ] Publish API uses theme profile for frontmatter generation
- [ ] Correct frontmatter field used based on theme
- [ ] Existing posts continue to work (backward compatibility)
- [ ] Integration test verifies PaperMod frontmatter structure
- [ ] Integration test verifies Ananke frontmatter structure

---

### Story 1.5: Update Config Fix API to Use Theme Profiles

**Description:** Replace hardcoded theme-specific logic with profile-based configuration.

**Files to modify:**
- `app/api/settings/fix-config/route.ts`

**Technical Changes:**

```typescript
import { getThemeProfile } from '@/lib/theme-profiles'

// Replace hardcoded theme detection with:
const themeMatch = hugoConfigContent.match(/theme\s*=\s*["']([^"']+)["']/)
const themeId = themeMatch?.[1] || 'papermod'
const themeProfile = getThemeProfile(themeId)

// Use profile validation
const validation = themeProfile.validateConfig(hugoConfigContent)
if (!validation.valid) {
  // Apply fixes based on profile requirements
}

// Use profile's params template when adding missing params
if (!hugoConfigContent.includes('[params]')) {
  hugoConfigContent += '\n' + themeProfile.config.paramsTemplate
}
```

**Acceptance Criteria:**
- [ ] Config fix uses theme profile validation
- [ ] Correct params template applied per theme
- [ ] Removes hardcoded isPoisonTheme/isAnankeTheme checks
- [ ] Unit tests for config fixing logic

---

### Story 1.6: Update Theme Selection UI

**Description:** Limit theme selection to PaperMod and Ananke only.

**Files to modify:**
- `lib/themes.ts` - Remove unsupported themes
- `app/settings/page.tsx` - Update theme selector if present
- `app/setup/page.tsx` - Update theme selector if present

**Changes to `lib/themes.ts`:**

```typescript
export const HUGO_THEMES: HugoTheme[] = [
  {
    id: 'papermod',
    name: 'PaperMod',
    description: 'Modern, fast, and feature-rich. Ideal for blogs and portfolios.',
    repo: 'https://github.com/adityatelange/hugo-PaperMod.git',
    preview: '/images/themes/papermod-preview.png',
  },
  {
    id: 'ananke',
    name: 'Ananke',
    description: 'Clean and simple. Official Hugo starter theme with great defaults.',
    repo: 'https://github.com/theNewDynamic/gohugo-theme-ananke.git',
    preview: '/images/themes/ananke-preview.png',
  },
]

export const DEFAULT_THEME_ID = 'papermod'
```

**Migration for existing users:**
- Users with Terminal, Coder, Poison, or Risotto themes should be notified
- Provide option to switch to supported theme
- Do NOT auto-migrate (could break their site)

**Acceptance Criteria:**
- [ ] Only PaperMod and Ananke shown in theme selector
- [ ] DEFAULT_THEME_ID updated to 'papermod'
- [ ] Existing users with unsupported themes see warning
- [ ] Theme preview images added to public folder

---

### Story 1.7: Add Theme Migration Warning for Existing Users

**Description:** Show warning to users with unsupported themes and guide them to migrate.

**Files to create:**
- `components/theme-migration-warning.tsx`

**Files to modify:**
- `app/dashboard/page.tsx` - Show warning if theme unsupported
- `app/settings/page.tsx` - Show migration guidance

**Component:**

```typescript
'use client'

import { AlertTriangle } from 'lucide-react'

interface ThemeMigrationWarningProps {
  currentTheme: string
  onDismiss?: () => void
}

export function ThemeMigrationWarning({ currentTheme, onDismiss }: ThemeMigrationWarningProps) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
            Theme No Longer Supported
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Your current theme ({currentTheme}) is no longer fully supported.
            Featured images and some settings may not work correctly.
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
            We recommend switching to <strong>PaperMod</strong> or <strong>Ananke</strong>
            in Settings for the best experience.
          </p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-yellow-600 hover:text-yellow-800">
            ×
          </button>
        )}
      </div>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Warning shown on dashboard for unsupported themes
- [ ] Warning dismissable (stored in localStorage)
- [ ] Settings page shows migration guidance
- [ ] Links to switch theme work correctly

---

## Epic 2: Critical Bug Fixes

### Story 2.1: Replace Custom YAML Parser with js-yaml

**Description:** The current custom YAML parser in `lib/hugo.ts` breaks on nested objects, multi-line strings, and comments. Replace with battle-tested `js-yaml` library.

**Technical Details:**

Current parser issues:
- Cannot parse nested objects like `cover.image: "/path"`
- Breaks on multi-line strings with `|` or `>`
- Ignores YAML comments
- Doesn't handle arrays of objects

**Dependencies to add:**
```bash
npm install js-yaml
npm install -D @types/js-yaml
```

**Files to modify:**
- `lib/hugo.ts` - Replace `parseHugoPost` function

**New implementation:**

```typescript
import yaml from 'js-yaml'

export function parseHugoPost(fileContent: string): {
  frontmatter: Record<string, unknown>
  content: string
} {
  // Match YAML frontmatter between --- delimiters
  const yamlMatch = fileContent.match(/^---\n([\s\S]*?)\n---/)

  if (!yamlMatch) {
    return { frontmatter: {}, content: fileContent }
  }

  try {
    const frontmatter = yaml.load(yamlMatch[1]) as Record<string, unknown>
    const content = fileContent.slice(yamlMatch[0].length).trim()
    return { frontmatter: frontmatter || {}, content }
  } catch (error) {
    console.error('Failed to parse YAML frontmatter:', error)
    return { frontmatter: {}, content: fileContent }
  }
}
```

**Acceptance Criteria:**
- [ ] js-yaml package installed
- [ ] parseHugoPost uses js-yaml
- [ ] Correctly parses nested objects (cover.image)
- [ ] Correctly parses multi-line strings
- [ ] Correctly parses arrays of objects
- [ ] Handles malformed YAML gracefully
- [ ] Unit tests for various YAML structures
- [ ] Existing functionality not broken

---

### Story 2.2: Remove Debug Console.log Statements

**Description:** Remove all debug logging that exposes sensitive content in production.

**Files to modify:**
- `app/api/posts/publish/route.ts` - Lines 53, 102

**Changes:**

```typescript
// REMOVE these lines:
console.log('Generated Markdown:', markdownContent)  // Line 53
console.log('Final file content to save:', fileContent)  // Line 102
```

**Additional cleanup - search and remove:**
- Any `console.log` that outputs user content
- Any `console.log` that outputs tokens or credentials
- Keep `console.error` for actual errors (but sanitize content)

**Acceptance Criteria:**
- [ ] No console.log with user content in production code
- [ ] Grep for console.log returns only appropriate logging
- [ ] API routes don't log request bodies

---

### Story 2.3: Fix Webhook Metadata Validation

**Description:** Add validation for Stripe webhook metadata to prevent crashes on malformed data.

**Files to modify:**
- `app/api/stripe/webhook/route.ts`

**Technical Changes:**

```typescript
// Add validation helper
function validateWebhookMetadata(metadata: Record<string, string> | null): {
  userId: number | null
  tier: string | null
} {
  if (!metadata) return { userId: null, tier: null }

  const userId = metadata.user_id ? parseInt(metadata.user_id, 10) : null
  if (userId !== null && isNaN(userId)) {
    console.error('Invalid user_id in webhook metadata:', metadata.user_id)
    return { userId: null, tier: metadata.tier || null }
  }

  return { userId, tier: metadata.tier || null }
}

// Use in handlers:
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, tier } = validateWebhookMetadata(session.metadata)

  if (!userId || !tier) {
    console.error('Missing or invalid metadata in checkout session:', session.id)
    return  // Don't throw - webhook should return 200
  }

  // ... rest of handler
}
```

**Acceptance Criteria:**
- [ ] All webhook handlers validate metadata before use
- [ ] Invalid userId doesn't crash with parseInt
- [ ] Missing metadata logged but doesn't throw
- [ ] Webhook always returns 200 (Stripe best practice)

---

### Story 2.4: Fix Cache Key Collision

**Description:** Update cache key format to prevent collisions when repo names contain special characters.

**Files to modify:**
- `lib/cache.ts`
- All files that construct cache keys

**Technical Changes:**

```typescript
// Create a safe cache key generator
export function createCacheKey(type: string, ...parts: string[]): string {
  const safeParts = parts.map(part =>
    encodeURIComponent(part).replace(/[.]/g, '%2E')
  )
  return `${type}:${safeParts.join(':')}`
}

// Usage:
const cacheKey = createCacheKey('posts', owner, repo, tier)
// Result: "posts:owner%3Aname:repo%3Aname:free"
```

**Acceptance Criteria:**
- [ ] Cache keys are URL-encoded
- [ ] Special characters in repo names don't cause collisions
- [ ] Existing cache entries invalidated on deploy
- [ ] Unit tests for edge cases

---

## Epic 3: Input Validation & Security

### Story 3.1: Add Zod for Schema Validation

**Description:** Install Zod and create schemas for all API inputs.

**Dependencies:**
```bash
npm install zod
```

**Files to create:**
- `lib/validation/schemas.ts` - All API input schemas
- `lib/validation/index.ts` - Exports and helpers

**Core schemas:**

```typescript
import { z } from 'zod'

// Post publish schema
export const publishPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(100000),  // ~100KB limit
  path: z.string().optional(),
  draft: z.boolean().default(false),
})

// Repository connect schema
export const connectRepoSchema = z.object({
  owner: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-]+$/),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_.]+$/),
  contentPath: z.string().max(500).default('content/posts'),
  engine: z.enum(['hugo', 'krems']).default('hugo'),
  theme: z.string().optional(),
})

// Image upload schema
export const uploadImageSchema = z.object({
  filename: z.string().min(1).max(255).regex(/^[a-zA-Z0-9-_.]+$/),
  content: z.string().min(1),  // Base64
  contentType: z.string().regex(/^image\/(jpeg|png|gif|webp)$/),
})

// Feedback schema
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general']),
  message: z.string().min(10).max(5000),
})

// Analytics event schema
export const analyticsEventSchema = z.object({
  event: z.string().min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
})
```

**Validation helper:**

```typescript
import { NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
    }
    return {
      error: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Zod installed
- [ ] Schemas defined for all API inputs
- [ ] validateRequest helper works with all schemas
- [ ] Type inference works (T from schema)

---

### Story 3.2: Apply Validation to All API Routes

**Description:** Update all API routes to use Zod validation.

**Files to modify:**
- `app/api/posts/publish/route.ts`
- `app/api/posts/delete/route.ts`
- `app/api/repos/connect/route.ts`
- `app/api/repos/create/route.ts`
- `app/api/repos/theme/route.ts`
- `app/api/images/upload/route.ts`
- `app/api/feedback/route.ts`
- `app/api/analytics/log-event/route.ts`
- `app/api/settings/favicon/route.ts`

**Example transformation:**

```typescript
// Before
export async function POST(request: Request) {
  const { title, content, path, draft = false } = await request.json()

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }
  // ...
}

// After
import { validateRequest, publishPostSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const validation = await validateRequest(request, publishPostSchema)
  if ('error' in validation) return validation.error

  const { title, content, path, draft } = validation.data
  // ...
}
```

**Acceptance Criteria:**
- [ ] All POST/PUT/PATCH routes use Zod validation
- [ ] Validation errors return 400 with details
- [ ] No manual validation code (if/else checks)
- [ ] Type safety maintained throughout handlers

---

### Story 3.3: Add Per-User Rate Limiting

**Description:** Current rate limiting is IP-based only. Add per-user rate limiting for authenticated routes.

**Files to modify:**
- `lib/cache.ts` - Add user rate limit function
- API routes that should have user limits

**Technical Implementation:**

```typescript
// In lib/cache.ts
export function userRateLimitCheck(
  userId: number,
  action: string,
  limit: number,
  windowSeconds: number
): boolean {
  const key = `ratelimit:user:${userId}:${action}`
  return rateLimitCheck(key, limit, windowSeconds)
}

// Rate limit configuration
export const RATE_LIMITS = {
  publish: { limit: 30, window: 3600 },      // 30 posts/hour
  imageUpload: { limit: 50, window: 3600 },  // 50 images/hour
  themeChange: { limit: 10, window: 3600 },  // 10 changes/hour
  configFix: { limit: 20, window: 3600 },    // 20 fixes/hour
}
```

**Usage in API routes:**

```typescript
import { userRateLimitCheck, RATE_LIMITS } from '@/lib/cache'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { limit, window } = RATE_LIMITS.publish
  if (!userRateLimitCheck(parseInt(session.user.id), 'publish', limit, window)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
  }

  // ... rest of handler
}
```

**Acceptance Criteria:**
- [ ] userRateLimitCheck function implemented
- [ ] Publish route has user rate limit
- [ ] Image upload has user rate limit
- [ ] Theme change has user rate limit
- [ ] Rate limit errors return 429 with clear message
- [ ] Limits are configurable via RATE_LIMITS object

---

## Epic 4: Code Quality & Observability

### Story 4.1: Create Logging Service

**Description:** Replace console.log/error with a proper logging service that can be configured for different environments.

**Files to create:**
- `lib/logger.ts`

**Implementation:**

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: number
  action?: string
  [key: string]: unknown
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    }

    // In production, this could send to external service
    // For now, structured JSON logging
    if (level === 'error') {
      console.error(JSON.stringify(logEntry))
    } else if (this.isDev || level === 'warn') {
      console.log(JSON.stringify(logEntry))
    }

    // TODO: Add Sentry integration here
    // if (level === 'error' && !this.isDev) {
    //   Sentry.captureException(new Error(message), { extra: context })
    // }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }
}

export const logger = new Logger()
```

**Acceptance Criteria:**
- [ ] Logger service created with all levels
- [ ] Structured JSON output in production
- [ ] Context support for userId, action, etc.
- [ ] Debug logs only in development
- [ ] Ready for Sentry integration (commented placeholder)

---

### Story 4.2: Replace Console Statements with Logger

**Description:** Update all files to use the new logger service.

**Files to modify:**
- All files in `app/api/` that use console.log/error
- All files in `lib/` that use console.log/error
- All files in `components/` that use console.log/error (client-side logging)

**Example transformation:**

```typescript
// Before
console.error('Error publishing post:', error)

// After
import { logger } from '@/lib/logger'

logger.error('Failed to publish post', {
  userId: user.id,
  action: 'publish',
  error: error instanceof Error ? error.message : 'Unknown error',
})
```

**Acceptance Criteria:**
- [ ] No console.log in production code (except logger internals)
- [ ] console.error replaced with logger.error
- [ ] All log calls include relevant context
- [ ] Sensitive data (tokens, full content) not logged

---

### Story 4.3: Prepare Sentry Integration

**Description:** Set up Sentry for error monitoring (implementation optional, but prepare the integration).

**Files to create:**
- `lib/sentry.ts` - Sentry initialization
- `sentry.client.config.ts` - Client config
- `sentry.server.config.ts` - Server config

**Dependencies (when ready to enable):**
```bash
npm install @sentry/nextjs
```

**Basic setup in `lib/sentry.ts`:**

```typescript
import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,

      // Don't send PII
      beforeSend(event) {
        // Scrub sensitive data
        if (event.request?.data) {
          delete event.request.data
        }
        return event
      },
    })
  }
}

export { Sentry }
```

**Acceptance Criteria:**
- [ ] Sentry config files created
- [ ] Integration with logger service
- [ ] PII scrubbing configured
- [ ] Environment variable documented
- [ ] Works when DSN not configured (no errors)

---

## Epic 5: Testing Infrastructure

### Story 5.1: Set Up Testing Framework

**Description:** Install and configure Vitest for unit and integration testing.

**Dependencies:**
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Files to create:**
- `vitest.config.ts`
- `vitest.setup.ts`

**vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', '.next/', 'coverage/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**vitest.setup.ts:**

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
```

**Add to package.json:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Acceptance Criteria:**
- [ ] Vitest installed and configured
- [ ] Path aliases work (@/)
- [ ] React components can be tested
- [ ] Coverage reporting works
- [ ] npm test runs successfully (even with no tests)

---

### Story 5.2: Add Unit Tests for Theme Profiles

**Description:** Create comprehensive tests for the theme profile system.

**Files to create:**
- `lib/theme-profiles/__tests__/papermod.test.ts`
- `lib/theme-profiles/__tests__/ananke.test.ts`
- `lib/theme-profiles/__tests__/index.test.ts`

**Example test file:**

```typescript
import { describe, it, expect } from 'vitest'
import { papermodProfile } from '../papermod'

describe('PaperMod Theme Profile', () => {
  describe('generateFrontmatter', () => {
    it('generates correct frontmatter with featured image', () => {
      const data = {
        title: 'Test Post',
        date: '2024-01-15T10:00:00Z',
        draft: false,
        content: 'Test content',
        featuredImage: '/images/test.jpg',
      }

      const result = papermodProfile.generateFrontmatter(data)

      expect(result).toContain('title: "Test Post"')
      expect(result).toContain('cover:')
      expect(result).toContain('  image: "/images/test.jpg"')
      expect(result).toContain('draft: false')
    })

    it('escapes quotes in title', () => {
      const data = {
        title: 'Test "Quoted" Post',
        date: '2024-01-15T10:00:00Z',
        draft: false,
        content: 'Test content',
      }

      const result = papermodProfile.generateFrontmatter(data)

      expect(result).toContain('title: "Test \\"Quoted\\" Post"')
    })

    it('generates frontmatter without featured image', () => {
      const data = {
        title: 'Test Post',
        date: '2024-01-15T10:00:00Z',
        draft: true,
        content: 'Test content',
      }

      const result = papermodProfile.generateFrontmatter(data)

      expect(result).not.toContain('cover:')
      expect(result).toContain('draft: true')
    })
  })

  describe('validateConfig', () => {
    it('returns valid for correct config', () => {
      const config = `
[params]
  defaultTheme = "auto"

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
      const result = papermodProfile.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error for missing params', () => {
      const config = `
baseURL = "https://example.org/"
`
      const result = papermodProfile.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing [params] section')
    })
  })
})
```

**Acceptance Criteria:**
- [ ] Tests for PaperMod frontmatter generation
- [ ] Tests for Ananke frontmatter generation
- [ ] Tests for config validation
- [ ] Tests for edge cases (quotes, special chars)
- [ ] 100% coverage for theme profile modules

---

### Story 5.3: Add Unit Tests for Validation Schemas

**Description:** Test all Zod schemas to ensure they validate correctly.

**Files to create:**
- `lib/validation/__tests__/schemas.test.ts`

**Example tests:**

```typescript
import { describe, it, expect } from 'vitest'
import { publishPostSchema, connectRepoSchema } from '../schemas'

describe('publishPostSchema', () => {
  it('accepts valid post data', () => {
    const data = {
      title: 'Test Post',
      content: '<p>Hello world</p>',
      draft: false,
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const data = {
      title: '',
      content: '<p>Hello world</p>',
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('rejects content over limit', () => {
    const data = {
      title: 'Test',
      content: 'x'.repeat(100001),
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('defaults draft to false', () => {
    const data = {
      title: 'Test',
      content: 'Content',
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.draft).toBe(false)
    }
  })
})

describe('connectRepoSchema', () => {
  it('rejects invalid repo name characters', () => {
    const data = {
      owner: 'valid-owner',
      repo: 'invalid repo name!',
    }

    const result = connectRepoSchema.safeParse(data)

    expect(result.success).toBe(false)
  })
})
```

**Acceptance Criteria:**
- [ ] Tests for all schema valid cases
- [ ] Tests for all schema invalid cases
- [ ] Tests for default values
- [ ] Tests for edge cases (max length, special chars)

---

### Story 5.4: Add Integration Tests for Critical API Routes

**Description:** Create integration tests for the most critical API routes.

**Files to create:**
- `app/api/posts/publish/__tests__/route.test.ts`
- `app/api/repos/connect/__tests__/route.test.ts`

**Note:** These require mocking auth, database, and GitHub API.

**Example structure:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/cookies', () => ({
  getRepoConfig: vi.fn(),
}))

vi.mock('@/lib/github', () => ({
  GitHubClient: vi.fn().mockImplementation(() => ({
    createOrUpdateFile: vi.fn().mockResolvedValue({ content: { sha: 'abc123' } }),
    getFileContent: vi.fn().mockResolvedValue(null),
    getRepoContents: vi.fn().mockResolvedValue([]),
  })),
}))

describe('POST /api/posts/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue(null)

    const request = new Request('http://localhost/api/posts/publish', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: 'Content' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: '123' },
      accessToken: 'token',
    })

    const request = new Request('http://localhost/api/posts/publish', {
      method: 'POST',
      body: JSON.stringify({ title: '', content: '' }),  // Invalid
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
```

**Acceptance Criteria:**
- [ ] Tests for publish route authentication
- [ ] Tests for publish route validation
- [ ] Tests for connect route
- [ ] Mocks properly isolate tests
- [ ] Tests run in CI

---

## Architecture Considerations

### 1. Theme Profile Registry Pattern

The theme profile system uses a registry pattern for extensibility:

```typescript
// lib/theme-profiles/index.ts
import { papermodProfile } from './papermod'
import { anankeProfile } from './ananke'

const profileRegistry = new Map<string, ThemeProfile>([
  ['papermod', papermodProfile],
  ['ananke', anankeProfile],
])

export function getThemeProfile(id: string): ThemeProfile {
  const profile = profileRegistry.get(id)
  if (!profile) {
    // Fall back to PaperMod for unknown themes
    console.warn(`Unknown theme: ${id}, falling back to PaperMod`)
    return papermodProfile
  }
  return profile
}

export function getSupportedThemes(): string[] {
  return Array.from(profileRegistry.keys())
}
```

**Benefits:**
- Easy to add new themes later
- Type-safe profile lookup
- Centralized fallback behavior

### 2. Validation Layer Architecture

```
Request → Zod Validation → Business Logic → Response
              ↓
         400 Error (if invalid)
```

The validation layer:
- Runs before any business logic
- Returns early with structured errors
- Provides TypeScript type inference
- Centralizes all validation rules

### 3. Logging Architecture

```
Code → Logger → Structured JSON → Console/Sentry
         ↓
    Context enrichment (userId, action, timestamp)
```

Future enhancement: Send to log aggregation service (DataDog, LogRocket).

### 4. Cache Key Namespacing

```
{type}:{encoded-params}

posts:owner%2Frepo:free
ratelimit:ip:192.168.1.1:publish
ratelimit:user:123:publish
webhook:evt_123456
```

This prevents collisions and makes debugging easier.

### 5. Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| API Routes | Return appropriate HTTP status, log error |
| Database | Throw on critical, return null on not-found |
| GitHub API | Throw on critical, return null on not-found |
| Webhooks | Always return 200, log error internally |

---

## Implementation Order & Dependencies

### Phase 1: Foundation (Week 1)
**No dependencies, can parallelize**

1. Story 5.1: Set Up Testing Framework
2. Story 3.1: Add Zod for Schema Validation
3. Story 4.1: Create Logging Service
4. Story 2.1: Replace Custom YAML Parser

### Phase 2: Theme System (Week 2)
**Depends on: Testing Framework**

1. Story 1.1: Create Theme Profile System
2. Story 1.2: Implement PaperMod Theme Profile
3. Story 1.3: Implement Ananke Theme Profile
4. Story 5.2: Add Unit Tests for Theme Profiles

### Phase 3: Integration (Week 3)
**Depends on: Theme Profiles, Zod**

1. Story 1.4: Update Publish API to Use Theme Profiles
2. Story 1.5: Update Config Fix API to Use Theme Profiles
3. Story 3.2: Apply Validation to All API Routes
4. Story 1.6: Update Theme Selection UI

### Phase 4: Polish & Security (Week 4)
**Depends on: Integration complete**

1. Story 1.7: Add Theme Migration Warning
2. Story 2.2: Remove Debug Console.log Statements
3. Story 4.2: Replace Console Statements with Logger
4. Story 2.3: Fix Webhook Metadata Validation
5. Story 2.4: Fix Cache Key Collision
6. Story 3.3: Add Per-User Rate Limiting

### Phase 5: Testing & Monitoring (Week 5)
**Depends on: All code changes complete**

1. Story 5.3: Add Unit Tests for Validation Schemas
2. Story 5.4: Add Integration Tests for Critical API Routes
3. Story 4.3: Prepare Sentry Integration

---

## Risks & Mitigations

### Risk 1: Breaking Existing User Sites
**Probability:** Medium | **Impact:** High

**Mitigation:**
- Theme migration is opt-in, not automatic
- Show warning for unsupported themes
- Maintain backward compatibility for existing frontmatter
- Provide rollback instructions in documentation

### Risk 2: js-yaml Parsing Differences
**Probability:** Low | **Impact:** Medium

**Mitigation:**
- Comprehensive test suite for YAML parsing
- Test with real-world Hugo posts
- Keep old parser code (commented) for reference
- Gradual rollout with monitoring

### Risk 3: Rate Limiting Too Aggressive
**Probability:** Medium | **Impact:** Low

**Mitigation:**
- Start with generous limits
- Monitor 429 responses
- Add admin override capability
- Make limits configurable

### Risk 4: Test Suite Slows Development
**Probability:** Low | **Impact:** Low

**Mitigation:**
- Fast test runner (Vitest)
- Parallel test execution
- Only require tests for new code
- Skip slow integration tests in watch mode

---

## Appendix A: File Inventory

### New Files to Create
- `lib/theme-profiles.ts`
- `lib/theme-profiles/papermod.ts`
- `lib/theme-profiles/ananke.ts`
- `lib/theme-profiles/index.ts`
- `lib/validation/schemas.ts`
- `lib/validation/index.ts`
- `lib/logger.ts`
- `lib/sentry.ts`
- `components/theme-migration-warning.tsx`
- `vitest.config.ts`
- `vitest.setup.ts`
- `lib/theme-profiles/__tests__/papermod.test.ts`
- `lib/theme-profiles/__tests__/ananke.test.ts`
- `lib/validation/__tests__/schemas.test.ts`
- `app/api/posts/publish/__tests__/route.test.ts`

### Files to Modify
- `lib/themes.ts`
- `lib/hugo.ts`
- `lib/cache.ts`
- `app/api/posts/publish/route.ts`
- `app/api/posts/delete/route.ts`
- `app/api/repos/connect/route.ts`
- `app/api/repos/create/route.ts`
- `app/api/repos/theme/route.ts`
- `app/api/settings/fix-config/route.ts`
- `app/api/images/upload/route.ts`
- `app/api/feedback/route.ts`
- `app/api/analytics/log-event/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/settings/page.tsx`
- `app/dashboard/page.tsx`
- `package.json`

### Dependencies to Add
- `zod`
- `js-yaml` + `@types/js-yaml`
- `vitest`
- `@vitejs/plugin-react`
- `jsdom`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@sentry/nextjs` (optional)

---

## Appendix B: Environment Variables

### New Variables
```
# Optional - Sentry error monitoring
NEXT_PUBLIC_SENTRY_DSN=

# Optional - Custom rate limits (defaults in code)
RATE_LIMIT_PUBLISH=30
RATE_LIMIT_WINDOW=3600
```

---

## Appendix C: Acceptance Testing Checklist

### Theme System
- [ ] Create new post with PaperMod theme → featured image displays
- [ ] Create new post with Ananke theme → featured image displays
- [ ] Switch from unsupported theme → warning displayed
- [ ] Config fix on PaperMod → correct params added
- [ ] Config fix on Ananke → correct params added

### Validation
- [ ] Publish post with empty title → 400 error with details
- [ ] Publish post with 200KB content → 400 error
- [ ] Connect repo with invalid characters → 400 error
- [ ] All error messages are user-friendly

### Security
- [ ] Exceed publish rate limit → 429 error
- [ ] Webhook with invalid metadata → logged, returns 200
- [ ] No sensitive data in production logs

### Testing
- [ ] `npm test` runs all tests
- [ ] `npm run test:coverage` shows >60% coverage
- [ ] Tests pass in CI environment
