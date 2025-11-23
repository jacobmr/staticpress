# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StaticPress is a web-based WYSIWYG editor for Hugo and Krems static site blogs with GitHub integration. Users authenticate via GitHub OAuth, connect their Hugo/Krems repository, and can create/edit posts through a clean interface. Changes are automatically committed to their GitHub repository and deployed via GitHub Pages or other platforms.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (uses Turbopack)
npm run dev

# Build for production (uses Turbopack)
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Project Structure

```
staticpress/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Main editing interface
│   ├── setup/             # Repository selection
│   ├── settings/          # User/repo settings
│   ├── pricing/           # Subscription plans
│   ├── onboarding/        # Post-signup flow
│   ├── deploy/            # Deployment options
│   └── help/              # Documentation
├── components/            # React client components
├── lib/                   # Core business logic
│   ├── auth.ts           # NextAuth.js configuration
│   ├── db.ts             # Supabase operations
│   ├── github.ts         # GitHub API client
│   ├── hugo.ts           # Hugo/Krems utilities
│   ├── stripe.ts         # Stripe integration
│   ├── cache.ts          # Server-side caching
│   └── themes.ts         # Hugo theme definitions
├── types/                 # TypeScript declarations
├── supabase/             # Database migrations
├── scripts/              # Maintenance scripts
├── docs/                 # Documentation
└── public/               # Static assets
```

## Architecture

### Authentication & Session Flow

- **NextAuth.js v5** (beta) handles GitHub OAuth authentication
- Access tokens are stored in JWT sessions to make GitHub API calls on behalf of users
- GitHub OAuth scope: `read:user user:email repo` (required for reading/writing to user's repositories)
- On first sign-in, user is created in Supabase database via `getOrCreateUser()`
- Session includes `accessToken` and user `id` for downstream API calls

### Database Layer (Supabase)

**CRITICAL - Lazy Initialization Pattern:**

Both `lib/db.ts` and `lib/stripe.ts` use lazy initialization to prevent build-time errors on Vercel:

- **Never** create database or Stripe clients at module level (will fail during Next.js build phase)
- **Always** use `await getSupabase()` or `stripe()` inside functions
- Use `import type` for TypeScript types to avoid runtime evaluation
- Server Components and API routes should use **dynamic imports** when importing from `@/lib/db`:
  ```typescript
  const { getUserByGithubId } = await import('@/lib/db')
  ```

**Database Schema (Supabase):**
- `users`: GitHub user info, subscription tier, Stripe customer/subscription IDs
- `repositories`: User's connected repository config (owner, repo, content_path, engine, theme, site_url)
- `usage_tracking`: Post edit counts per user for free tier limits
- `analytics_events`: Event tracking (oauth_completed, repo_bound, first_publish, etc.)
- `feedback`: User feedback submissions

### Repository Configuration Flow

1. After OAuth, user redirected to `/setup` if no repository configured
2. User can select existing repo OR create new Hugo repo from template
3. Repository config saved to Supabase `repositories` table via `upsertUserRepository()`
4. Config includes: owner, repo name, content path, engine (hugo/krems), theme, site_url
5. Config retrieved server-side via `getRepoConfig()` from cookies/database

### Blog Engine Support

**Hugo (default):**
- Posts stored at: `content/posts/YYYY/MM/slug.md`
- Supports draft mode via frontmatter
- Uses git submodules for themes
- Path function: `generateHugoPath()`
- Frontmatter function: `generateFrontmatter()`

**Krems:**
- Posts stored at root: `slug.md`
- No draft support
- Simpler frontmatter structure
- Path function: `generateKremsPath()`
- Frontmatter function: `generateKremsFrontmatter()`

**Hugo Post Workflow:**
1. User writes in TipTap WYSIWYG editor (`components/editor.tsx`)
2. HTML content converted to Markdown via Turndown
3. Frontmatter generated with title, date, draft status, featured image
4. File committed to GitHub via Octokit API
5. GitHub Actions workflow builds and deploys to GitHub Pages

### GitHub API Integration

**GitHubClient** (`lib/github.ts`):
- Wraps Octokit with user's access token from session
- Core methods: `getUserRepos()`, `getRepoContents()`, `getFileContent()`, `createOrUpdateFile()`, `deleteFile()`
- Repository management: `createRepository()`, `createRepositoryFromTemplate()`, `initializeHugoProject()`
- Deployment: `enableGitHubPages()`, `setCustomDomain()`, `getGitHubPagesStatus()`, `triggerWorkflowDispatch()`
- Theme management: `setHugoTheme()` (adds theme as git submodule)
- Status monitoring: `getLatestDeploymentStatus()`, `getDeploymentLogs()`

### Theme System

Themes are defined in `lib/themes.ts`:
- `HUGO_THEMES`: Array of available themes with id, name, repoUrl, description
- `getThemeById()`: Retrieve theme configuration
- `DEFAULT_THEME_ID`: Default theme (currently 'ananke')

Themes are added as git submodules in `themes/{theme-id}/` directory via `GitHubClient.setHugoTheme()`.

### Stripe Subscription & Monetization

**Tiers:**
- Free: 5 most recent posts editable, no images
- Personal ($2.50/mo or $20/yr): All posts, image uploads
- SMB ($5/mo or $50/yr): Personal + custom domains, theme gallery
- Pro ($10/mo or $100/yr): SMB + 5 repositories, priority support

**Implementation:**
- Checkout sessions created via `/api/stripe/create-checkout-session`
- Customer portal for subscription management via `/api/stripe/create-portal-session`
- Webhooks handle subscription lifecycle: `/api/stripe/webhook`
- Stripe metadata includes `user_id` and `tier` for webhook processing
- User tier stored in `users.subscription_tier` and checked via `hasFeatureAccess()`
- Feature access tiers: free=0, personal=1, smb=2, pro=3

### Caching Strategy

**Server-side (`lib/cache.ts`):**
- Uses `node-cache` with 24-hour TTL
- Cache key format: `posts:{owner}:{repo}:{tier}`
- Functions: `getCached()`, `setCached()`, `clearCache()`, `clearCachePattern()`
- Rate limiting: `rateLimitCheck()` for API protection
- Duplicate prevention: `addUniqueKey()` for webhook idempotency

**Client-side (`lib/client-cache.ts`):**
- Uses localStorage with 24-hour expiry
- Functions: `getCachedPosts()`, `setCachedPosts()`, `clearCachedPosts()`

### Page Routes

- `/` - Landing page with pricing, features, FAQ
- `/dashboard` - Main editing interface with file browser and editor
- `/setup` - First-time repository selection/creation
- `/settings` - Repository & account settings
- `/pricing` - Subscription tiers with upgrade flow
- `/onboarding` - Post-signup onboarding
- `/deploy` - Deployment configuration options
- `/help` - Setup guide & documentation

### API Routes

**Posts:**
- `GET /api/posts` - List posts from connected repository (with caching)
- `POST /api/posts/publish` - Create or update post, commit to GitHub
- `POST /api/posts/delete` - Delete post from repository

**Repository Management:**
- `POST /api/repos/connect` - Connect existing repository
- `POST /api/repos/create` - Create new Hugo repository from template
- `GET /api/repos/site-url` - Get deployment URL for repository
- `POST /api/repos/theme` - Set Hugo theme (add as git submodule)

**Deployment:**
- `POST /api/deploy/github-pages` - Enable GitHub Pages for repository
- `GET /api/deployment/status` - Get current deployment status
- `GET /api/deployment/logs` - Get build logs for failed deployments
- `POST /api/deployment/fix` - Auto-fix common deployment issues

**Stripe:**
- `POST /api/stripe/create-checkout-session` - Initialize subscription purchase
- `POST /api/stripe/create-portal-session` - Customer billing portal
- `POST /api/stripe/webhook` - Handle subscription events (requires `STRIPE_WEBHOOK_SECRET`)

**Settings & Utilities:**
- `POST /api/settings/favicon` - Upload favicon image
- `POST /api/settings/fix-config` - Repair Hugo configuration
- `POST /api/images/upload` - Upload images to GitHub repository
- `POST /api/cache/clear` - Clear server cache for repository
- `POST /api/feedback` - Submit user feedback
- `POST /api/analytics/log-event` - Log client-side events

### Environment Variables

**Required for local development (`.env.local`):**
```
# NextAuth
AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Stripe Price IDs (per tier/interval)
STRIPE_PERSONAL_MONTHLY_PRICE_ID=
STRIPE_PERSONAL_YEARLY_PRICE_ID=
STRIPE_SMB_MONTHLY_PRICE_ID=
STRIPE_SMB_YEARLY_PRICE_ID=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
```

### Common Patterns

**Server Actions (Next.js 15):**
- Used in `/setup` and `/settings` pages for form submissions
- Marked with `"use server"` directive
- Handle repository selection and updates
- Use dynamic imports for database functions to prevent build-time initialization

**Client Components:**
- `dashboard-client.tsx`: Main editing UI with TipTap editor, publish/draft actions
- `file-browser.tsx`: Sidebar with post list, search, thumbnails, delete modal
- `editor.tsx`: TipTap WYSIWYG editor with toolbar, image paste, link modal, focus mode
- `editor-slash-command.tsx`: Notion-style "/" command menu
- `upgrade-modal.tsx`: Subscription paywall for free tier limits
- `deployment-status.tsx`: Live deployment status with logs viewer
- `pricing-client.tsx`: Tier cards with billing toggle

**Error Handling:**
- Database operations wrapped in try/catch, graceful degradation
- GitHub API errors logged but don't crash the app
- Stripe webhooks return 200 even on non-critical errors to prevent retries
- Rate limiting via `rateLimitCheck()` returns 429 on exceed

**Security Patterns:**
- All API routes check authentication via `auth()` from NextAuth
- Stripe webhooks verify signature with `constructEvent()`
- Webhook deduplication via `addUniqueKey()` with event ID
- IP-based rate limiting on sensitive operations

### Key Components

**Editor (`components/editor.tsx`):**
- TipTap-based WYSIWYG with markdown support
- Features: Toolbar, bubble menu, slash commands, image paste
- Link modal for URL input
- Focus mode toggle
- Turndown for HTML to Markdown conversion

**FileBrowser (`components/file-browser.tsx`):**
- Post list with thumbnails extracted from featured images
- Search/filter functionality
- Delete confirmation modal
- Free tier limit enforcement

**DeploymentStatus (`components/deployment-status.tsx`):**
- Real-time polling for deployment status
- Auto-retry on pending deployments
- Logs viewer for debugging failures

### Database Migrations

Located in `/supabase/migrations/`:
- Schema changes for engine support, site_url, feedback table
- Run via Supabase CLI or dashboard

Maintenance scripts in `/scripts/`:
- `init-db.sql`: Initial schema setup
- `setup-stripe.js`: Stripe product/price configuration
- `fix-subscription.ts`: Repair subscription issues
- `merge-duplicate-users.ts`: Handle duplicate accounts

### Deployment (Vercel)

- Deployed on Vercel with automatic deployments from `main` branch
- Uses Next.js 15 with Turbopack
- Environment variables must be configured in Vercel dashboard
- Stripe webhook endpoint: `https://yourapp.vercel.app/api/stripe/webhook`
- GitHub OAuth callback: `https://yourapp.vercel.app/api/auth/callback/github`

### Testing Considerations

- **No test suite currently implemented**
- Local testing requires valid GitHub OAuth app
- Stripe webhooks can be tested with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Repository operations require a real GitHub repo (or use Octokit mocks)
- Supabase connection required for user/repository persistence

### Known Issues & Improvements

**Current Issues:**
- Debug console.log statements in production code (e.g., `app/api/posts/publish/route.ts:53-54`)
- No test coverage
- No error monitoring service (Sentry, etc.)

**Potential Improvements:**
- Add Zod schema validation for API inputs
- Implement comprehensive test suite (Jest/Vitest)
- Add error monitoring/tracking
- Consider migrating console.log to proper logging service
- Add API rate limiting per user in addition to IP

### Tech Stack

**Core:**
- Next.js 15 with App Router
- React 19
- TypeScript 5
- Tailwind CSS v4

**Authentication & Database:**
- NextAuth.js v5 (beta)
- Supabase (PostgreSQL)

**Integrations:**
- GitHub API via Octokit
- Stripe for payments

**Editor:**
- TipTap (ProseMirror)
- Turndown (HTML to Markdown)
- Marked (Markdown to HTML)

**Utilities:**
- node-cache (server caching)
- Sharp (image processing)
- Slugify (URL generation)
