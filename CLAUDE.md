# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StaticPress is a web-based WYSIWYG editor for Hugo static site blogs with GitHub integration. Users authenticate via GitHub OAuth, connect their Hugo repository, and can create/edit posts through a clean interface. Changes are automatically committed to their GitHub repository.

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
- **Always** use `await getSupabase()` or `getStripe()` inside functions
- Use `import type` for TypeScript types to avoid runtime evaluation
- Server Components and API routes should use **dynamic imports** when importing from `@/lib/db`:
  ```typescript
  const { getUserByGithubId } = await import('@/lib/db')
  ```

Database schema (Supabase):
- `users`: GitHub user info, subscription tier, Stripe customer/subscription IDs
- `repositories`: User's connected Hugo repository config (owner, repo, content_path)
- `usage_tracking`: Post edit counts per user for free tier limits
- `analytics_events`: Event tracking (oauth_completed, repo_bound, first_publish, etc.)

### Repository Configuration Flow

1. After OAuth, user redirected to `/setup` if no repository configured
2. User selects repository from their GitHub repos list
3. Repository config saved to Supabase `repositories` table via `upsertUserRepository()`
4. Config includes: owner, repo name, and content path (default: `content/posts`)
5. Config retrieved server-side via `getRepoConfig()` from cookies/database

### Hugo Post Management

**File Structure Convention:**
- Hugo posts stored at: `content/posts/YYYY/MM/slug.md`
- Frontmatter: YAML with title, date, draft, tags, categories
- Content: Markdown body

**Key Utilities** (`lib/hugo.ts`):
- `generateSlug(title)`: Creates URL-safe slug from title
- `generateHugoPath(title, date)`: Generates full file path following Hugo convention
- `generateFrontmatter(data)`: Creates YAML frontmatter block
- `parseHugoPost(fileContent)`: Extracts frontmatter and content from existing posts

**Post Workflow:**
1. User writes in TipTap WYSIWYG editor (components/editor.tsx)
2. HTML content converted to Markdown via Turndown
3. Frontmatter generated with title, date, draft status
4. File committed to GitHub via Octokit API at Hugo-conventional path
5. GitHub Actions/Netlify/Vercel automatically rebuilds Hugo site

### GitHub API Integration

**GitHubClient** (`lib/github.ts`):
- Wraps Octokit with user's access token from session
- Methods: `getUserRepos()`, `getRepoContents()`, `getFileContent()`, `createOrUpdateFile()`
- Handles both file creation and updates (requires SHA for updates)
- Automatic base64 encoding/decoding for file content

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

### Caching Strategy

- `node-cache` used for repository content (expires after 5 minutes)
- Cache key format: `posts:{owner}:{repo}`
- Manual cache invalidation after publish/delete operations via `clearCache()`
- Prevents rate limiting on GitHub API when browsing posts

### Page Routes

- `/` - Landing page with sign-in
- `/setup` - First-time repository selection
- `/dashboard` - Main editing interface with file browser and editor
- `/pricing` - Subscription tiers with upgrade flow
- `/settings` - Repository configuration management

### API Routes

**Posts:**
- `GET /api/posts` - List posts from connected repository (with caching)
- `POST /api/posts/publish` - Create or update post, commit to GitHub
- `DELETE /api/posts/delete` - Delete post from repository

**Stripe:**
- `POST /api/stripe/create-checkout-session` - Initialize subscription purchase
- `POST /api/stripe/create-portal-session` - Customer billing portal
- `POST /api/stripe/webhook` - Handle subscription events (requires `STRIPE_WEBHOOK_SECRET`)

**Analytics:**
- `POST /api/analytics/log-event` - Log user events (client-side tracking)

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
- `dashboard-client.tsx`: Main editing UI with TipTap editor
- `file-browser.tsx`: GitHub repository file tree navigation
- `editor.tsx`: Reusable TipTap WYSIWYG editor
- `upgrade-modal.tsx`: Subscription paywall for free tier limits

**Error Handling:**
- Database operations wrapped in try/catch, graceful degradation
- GitHub API errors logged but don't crash the app
- Stripe webhooks return 200 even on non-critical errors to prevent retries

### Deployment (Vercel)

- Deployed on Vercel with automatic deployments from `main` branch
- Uses Next.js 15 with Turbopack
- Environment variables must be configured in Vercel dashboard
- Stripe webhook endpoint: `https://yourapp.vercel.app/api/stripe/webhook`
- GitHub OAuth callback: `https://yourapp.vercel.app/api/auth/callback/github`

### Testing Considerations

- Local testing requires valid GitHub OAuth app
- Stripe webhooks can be tested with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Repository operations require a real GitHub repo (or use Octokit mocks)
- Supabase connection required for user/repository persistence
