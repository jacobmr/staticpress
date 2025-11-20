# StaticPress Development Checkpoint

**Date:** November 19, 2025
**Session:** Context continuation - performance & image handling fixes

---

## Project Overview

StaticPress is a WYSIWYG editor for Hugo static site blogs with GitHub integration. Users authenticate via GitHub OAuth, connect their Hugo repository, and create/edit posts through a rich text editor. Changes are committed to GitHub, triggering site rebuilds.

**Live URL:** www.staticpress.me
**Repo:** github.com/jacobmr/staticpress

---

## What We Built This Session

### 1. Progressive Loading for Posts
- Dashboard now loads only **first 5 posts** for fast initial render
- Remaining posts load in background via API
- API supports `limit` and `offset` pagination
- **Files:** `app/api/posts/route.ts`, `app/dashboard/page.tsx`, `components/dashboard-client.tsx`

### 2. Image Upload & Display Fixes
- **Problem:** Private repos can't use GitHub raw URLs; images showed placeholders
- **Solution:** Use base64 data URLs for immediate preview
- Upload to GitHub in background
- Store mapping of base64 → hugo URL
- Convert base64 to relative Hugo path when saving
- **Files:** `components/editor.tsx`, `components/dashboard-client.tsx`, `app/api/images/upload/route.ts`

### 3. Image Paste from Clipboard
- Added `handlePaste` to TipTap editor
- Detects image files in clipboard
- Uploads and inserts into editor
- **File:** `components/editor.tsx`

### 4. Auth Button Loading States
- All sign-in/sign-out buttons show loading feedback
- Created reusable `AuthButton` component
- Variants: primary, secondary, outline
- **Files:** `components/auth-buttons.tsx`, `lib/auth-actions.ts`

### 5. Sign Out Redirect Fix
- Server action redirects don't work in client form handlers
- Added client-side navigation after sign out
- **File:** `components/auth-buttons.tsx`

### 6. Server Cache Invalidation
- Created `/api/cache/clear` endpoint
- Dashboard calls this on publish/delete
- **File:** `app/api/cache/clear/route.ts`

---

## Current Architecture

### Authentication Flow
- NextAuth v5 with GitHub OAuth
- JWT sessions stored in cookies (30-day expiry)
- GitHub numeric ID stored in session for database lookups
- Server actions for sign in/out

### Image Handling
- **Existing posts:** Relative URLs transformed to absolute (docnotes.com) for display
- **Uploaded images:** Base64 preview → upload to GitHub → convert to relative on save
- Transform functions in `dashboard-client.tsx`:
  - `transformImageUrls()` - relative → absolute
  - `reverseTransformImageUrls()` - base64/absolute → relative

### Caching
- **Server:** NodeCache with 24-hour TTL
- **Client:** localStorage for posts
- Cache key format: `posts:{owner}:{repo}:{tier}`

### Database (Supabase)
- `users` - GitHub user info, subscription tier
- `repositories` - Connected repo config
- `usage_tracking` - Post edit counts
- `analytics_events` - Event tracking

---

## In Progress: Onboarding System

### Phase 1: Create New Blog Flow (NEXT UP)
- Add "Create New Blog" option to setup page
- Create Hugo repo from template via GitHub API
- Auto-configure in StaticPress
- **Endpoint needed:** `POST /api/repos/create`

### Phase 2: Onboarding Wizard
- Progress checklist in dashboard
- Steps: Account → Blog → First Post → Deploy
- Tooltips for first-time users

### Phase 3: Help Documentation
- `/help` pages
- Getting started guide
- Deployment instructions

### Phase 4: Deployment Guide
- Interactive wizard for Cloudflare/Vercel/Netlify
- Step-by-step with verification

---

## TBD List

### High Priority
- [ ] **Create New Blog flow** - Allow users to create Hugo repo from template
- [ ] **Onboarding checklist** - Guide new users through setup
- [ ] **Deployment setup wizard** - Help connect to Cloudflare/Vercel
- [ ] **Make image base URL configurable** - Currently hardcoded to docnotes.com

### Medium Priority
- [ ] **Help documentation** - `/help` pages with guides
- [ ] **First post prompt** - Encourage empty dashboard users to create post
- [ ] **Theme gallery** - Browse and apply Hugo themes (SMB+ tier)
- [ ] **Custom domain setup** - Guide for pointing domain to deployed site
- [ ] **Draft preview** - Preview posts before publishing

### Low Priority / Future
- [ ] **Remove debug console.logs** - Clean up [Paste], [PasteImage] logs
- [ ] **Image optimization** - Resize/compress before upload
- [ ] **Scheduled publishing** - Set future publish date
- [ ] **Post analytics** - View counts, engagement
- [ ] **Team collaboration** - Multiple editors per repo (Pro tier)
- [ ] **Markdown import/export** - Bulk content management
- [ ] **SEO tools** - Meta tags, sitemap generation

### Technical Debt
- [ ] **TypeScript strict mode** - Fix any remaining type issues
- [ ] **Test coverage** - Add unit/integration tests
- [ ] **Error boundaries** - Better error handling in React components
- [ ] **Rate limiting** - Protect API endpoints
- [ ] **Logging service** - Structured logging for debugging

---

## Environment Setup

Required env vars for local development:
```
AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PERSONAL_MONTHLY_PRICE_ID=
STRIPE_PERSONAL_YEARLY_PRICE_ID=
(etc for SMB/Pro tiers)
```

---

## Key Files Reference

### Core Components
- `components/editor.tsx` - TipTap WYSIWYG editor with image handling
- `components/dashboard-client.tsx` - Main editing UI, URL transforms
- `components/file-browser.tsx` - Post list sidebar
- `components/auth-buttons.tsx` - Sign in/out with loading states

### API Routes
- `app/api/posts/route.ts` - List posts with pagination
- `app/api/posts/publish/route.ts` - Create/update posts
- `app/api/images/upload/route.ts` - Upload images to GitHub
- `app/api/cache/clear/route.ts` - Clear server cache

### Auth
- `lib/auth.ts` - NextAuth config with lazy DB imports
- `lib/auth-actions.ts` - Server actions for sign in/out
- `lib/cookies.ts` - Repository config from session

### Database
- `lib/db.ts` - Supabase client with lazy initialization
- `lib/cache.ts` - NodeCache for server-side caching
- `lib/client-cache.ts` - localStorage for client-side caching

---

## Recent Commits

```
8f87f84 fix: add client-side redirect after sign out
5d32084 fix: use base64 preview for uploaded images
56d11f7 debug: add console logs for paste image handler
cb9dece fix: use GitHub raw URLs for uploaded images
8adc584 feat: implement progressive loading for posts
11ea62b feat: add loading states to all auth buttons
33a7453 feat: add clipboard image paste support to editor
```

---

## Next Steps

1. Start Phase 1 of onboarding: Create New Blog flow
2. Need a Hugo template repository (or use existing public template)
3. Implement `/api/repos/create` endpoint
4. Update setup page with dual options

**Ready to continue from this checkpoint.**
