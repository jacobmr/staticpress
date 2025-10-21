# StaticPress Development TODO

**Current Phase:** Phase 2 - Paywall Gates + Personal Tier (Weeks 1-2)
**Goal:** Implement monetization with free tier limits + unlock Personal tier ($2.50/mo)

## Week 1: Paywall Infrastructure ✅ COMPLETE

### Database Schema & Tier Management ✅
- [x] Create analytics_events table in Supabase with RLS policies
- [x] Update subscription_tier to support all 4 tiers (free/personal/smb/pro)
- [x] Add helper functions: hasFeatureAccess(), getUserTier(), logEvent()
- [x] Migration files created in supabase/migrations/

### Stripe Integration ✅
- [x] Install Stripe SDK: `npm install stripe @stripe/stripe-js`
- [x] Create `/app/api/stripe/create-checkout-session/route.ts` (all 3 tiers, monthly/yearly)
- [x] Create `/app/api/stripe/create-portal-session/route.ts` (billing management)
- [x] Create `/app/api/stripe/webhook/route.ts` with all event handlers
- [x] Create pricing page component (`/app/pricing/page.tsx`)
- [x] Create comprehensive setup guide (docs/STRIPE_SETUP.md)
- [ ] **ACTION REQUIRED:** Configure Stripe products and get price IDs
- [ ] **ACTION REQUIRED:** Set up webhook endpoint in Stripe Dashboard

### Free Tier Limits - "Edit Last 5 Posts Only" ✅
- [x] Update dashboard to detect user tier and limit posts
- [x] Free tier: 5 posts, Paid tiers: 50 posts
- [x] Cache keys include tier for proper filtering
- [x] Show tier badge in dashboard header (color-coded)
- [x] FileBrowser shows "(Free: 5 most recent)" indicator
- [x] "Upgrade to Edit All Posts" button for free users

### Upgrade Prompts & Flows ✅
- [x] Create `UpgradeModal` component with all 3 paid tiers
- [x] Context-aware messaging (post_limit, images, etc.)
- [x] Monthly/yearly toggle with 17% savings
- [x] Direct Stripe checkout integration
- [x] Tier badge links to pricing page
- [x] Beautiful, responsive pricing page with FAQ
- [x] "Manage Subscription" for existing customers

### Server-Side Event Logging ✅
- [x] Create `analytics_events` table in Supabase (migration ready)
- [x] Create `/api/analytics/log-event` endpoint for client events
- [x] Log `oauth_completed` (on GitHub sign-in)
- [x] Log `repo_bound` (when repository connected)
- [x] Log `first_publish` (user's first published post)
- [x] Log `post_published` (every publish/update)
- [x] Log `post_deleted` (when post deleted)
- [x] Log `upgrade_started` (in Stripe checkout endpoint)
- [x] Log `upgrade_completed` (in webhook handler)
- [x] Helper function `logEvent()` implemented

---

## Week 2: Personal Tier Features

### Images Feature (Personal Tier Only)
- [ ] Update TipTap editor configuration
  - [ ] Add Image extension: `npm install @tiptap/extension-image`
  - [ ] Add image toolbar button (only shown for Personal+ tiers)
  - [ ] Implement drag-and-drop image support
- [ ] Create `/app/api/upload-image/route.ts`
  - [ ] Check user tier (Personal/SMB/Pro only)
  - [ ] Accept image upload (validate type: jpg, png, webp, gif)
  - [ ] Optimize image:
    - [ ] Convert to WebP format (use `sharp` library)
    - [ ] Enforce max size (e.g., 2MB per image, 10MB total per post)
  - [ ] Upload to GitHub via API: `/static/images/YYYY/MM/filename.webp`
  - [ ] Return image URL for editor insertion
- [ ] Add image size enforcement UI feedback
- [ ] Handle image deletion when post is saved (cleanup unused images)

### Categories & Tags (Free for All Tiers)
- [ ] Add Categories UI component
  - [ ] Comma-separated input field
  - [ ] Tag-style pills display
  - [ ] Save to Hugo frontmatter: `categories: ["cat1", "cat2"]`
- [ ] Add Tags UI component
  - [ ] Same pattern as categories
  - [ ] Save to Hugo frontmatter: `tags: ["tag1", "tag2"]`
- [ ] Update post editor layout to include Categories/Tags section

### Preview Feature (Free for All Tiers)
- [ ] Create "Preview" button in editor toolbar
- [ ] Build preview modal/panel
  - [ ] Render markdown to HTML (using same parser as Hugo if possible)
  - [ ] Apply basic theme styling
  - [ ] Show frontmatter fields (title, date, categories, tags)
- [ ] Handle images in preview (show uploaded images from static path)

### Documentation & Onboarding
- [ ] Write "Getting Started" guide
  - [ ] GitHub OAuth flow
  - [ ] Selecting/creating a Hugo repo
  - [ ] Writing first post
  - [ ] Deploying to Cloudflare Pages/Vercel/Netlify (manual setup)
- [ ] Create onboarding video (screen recording)
  - [ ] < 3 minutes: OAuth → Write → Publish → Deploy
- [ ] Add in-app tooltips/guided tour (optional)

### Soft Beta Launch (25-50 Users)
- [ ] Prepare beta signup form (optional waitlist or direct invite)
- [ ] Recruit from Hugo/Dev communities:
  - [ ] Hugo Discourse forum post
  - [ ] r/hugo, r/JAMstack Reddit posts
  - [ ] Dev.to article
  - [ ] Personal network outreach
- [ ] Set up feedback collection mechanism
  - [ ] GitHub Discussions or simple feedback form
  - [ ] Monitor for bugs and onboarding friction
- [ ] Monitor server-side events for funnel analysis
  - [ ] Track: Visit → OAuth → First publish conversion
  - [ ] Identify drop-off points

---

## Future Phases (Documented - Not Immediate)

### Phase 3: SMB Tier (Weeks 3-4)
- [ ] Custom domain guided setup (Cloudflare DNS automation first)
- [ ] Theme gallery (5-8 curated Hugo themes as template repos)
- [ ] One-click "Switch theme" functionality
- [ ] Public beta posts: Hugo forum, Dev.to, Show HN

### Phase 4: Pro Tier (Weeks 5-6)
- [ ] Multi-repo support (up to 5 blogs per account)
- [ ] Repo switcher UI
- [ ] Vercel domain automation
- [ ] Pricing page finalization
- [ ] Referral program MVP

### Phase 5: GA Launch (Weeks 7-8)
- [ ] Product Hunt launch
- [ ] "From zero to blog in 60s" walkthrough video
- [ ] Partner outreach (Cloudflare, Vercel)
- [ ] Showcase/case studies

### Phase 6: Advanced Features (Future)
- [ ] Automated deployment (Vercel/Cloudflare/Netlify OAuth integration)
- [ ] Built-in Hugo theme editor
- [ ] Collaboration features (multi-user repos)
- [ ] Analytics dashboard
- [ ] Custom CSS editor
- [ ] Media library management
- [ ] Scheduled publishing

---

## Current Blockers / Questions
- [ ] Stripe account setup complete?
- [ ] Supabase project configured for production?
- [ ] Which Stripe price tier structure: monthly-only or monthly + annual?
- [ ] Image optimization library preference: `sharp` or `jimp`?
- [ ] Hugo content structure confirmed: `/content/posts/` for all posts?

---

## Quick Wins (Can Do Anytime)
- [ ] Add dark mode toggle (theme already supports it)
- [ ] Improve error messages (humanized, helpful)
- [ ] Add loading states for GitHub API calls
- [ ] Implement better empty states ("No posts yet")
- [ ] Add keyboard shortcuts (Cmd+S to save)
- [ ] Improve mobile responsiveness

---

**Last Updated:** 2025-10-20
**Tracking:** See PRD-StaticBlogEditor.md for full roadmap
