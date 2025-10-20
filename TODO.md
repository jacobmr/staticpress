# StaticPress Development TODO

**Current Phase:** Phase 2 - Paywall Gates + Personal Tier (Weeks 1-2)
**Goal:** Implement monetization with free tier limits + unlock Personal tier ($2.50/mo)

## Week 1: Paywall Infrastructure ⚡ PRIORITY

### Database Schema & Tier Management
- [ ] Create `subscriptions` table in Supabase
  - [ ] Fields: user_id, tier (free/personal/smb/pro), stripe_customer_id, stripe_subscription_id, status, current_period_end
  - [ ] Add RLS policies for user-only access
- [ ] Create `usage_limits` table (optional - for tracking post edits)
- [ ] Add `tier` column to users/profiles table (default: 'free')

### Stripe Integration
- [ ] Set up Stripe account + get API keys
- [ ] Install Stripe SDK: `npm install stripe @stripe/stripe-js`
- [ ] Create `/app/api/stripe/create-checkout-session/route.ts`
  - [ ] Handle Personal tier checkout ($2.50/mo or $20/yr)
  - [ ] Store customer_id and subscription_id in database
- [ ] Create `/app/api/stripe/webhook/route.ts`
  - [ ] Handle `checkout.session.completed`
  - [ ] Handle `customer.subscription.updated`
  - [ ] Handle `customer.subscription.deleted`
  - [ ] Update user tier in database
- [ ] Add Stripe webhook endpoint to Stripe dashboard
- [ ] Create pricing page component (`/app/pricing/page.tsx`)

### Free Tier Limits - "Edit Last 5 Posts Only"
- [ ] Update `/lib/github.ts` `getHugoPosts()` function
  - [ ] Add user tier detection from database
  - [ ] For Free tier: return only last 5 posts sorted by date
  - [ ] For paid tiers: return all posts
- [ ] Update `/app/dashboard/page.tsx`
  - [ ] Check user tier from session/database
  - [ ] Pass tier to components
  - [ ] Show tier badge in UI
- [ ] Update FileBrowser component
  - [ ] Show "Last 5 posts (Free tier)" message
  - [ ] Display upgrade prompt when on Free tier
- [ ] Add "locked" state for older posts in Free tier
  - [ ] Show lock icon on posts beyond the 5-post limit
  - [ ] Clicking locked post shows upgrade modal

### Upgrade Prompts & Flows
- [ ] Create `UpgradeModal` component
  - [ ] Triggered when Free user hits limit (tries to edit 6th post)
  - [ ] Shows Personal tier benefits + pricing
  - [ ] "Upgrade Now" button → Stripe checkout
- [ ] Create `TierBadge` component
  - [ ] Display current tier in dashboard header
  - [ ] Link to pricing/manage subscription
- [ ] Add upgrade trigger when attempting to upload image (Free tier)

### Server-Side Event Logging
- [ ] Create `analytics_events` table in Supabase
  - [ ] Fields: event_name, user_id, metadata (jsonb), created_at
- [ ] Log key events (server-side only, no PII):
  - [ ] `oauth_completed`
  - [ ] `repo_bound`
  - [ ] `first_publish`
  - [ ] `upgrade_modal_shown`
  - [ ] `upgrade_started`
  - [ ] `upgrade_completed`
- [ ] Create helper function `logEvent(eventName, userId, metadata)`

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
