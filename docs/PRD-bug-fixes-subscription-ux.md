# PRD: Critical Bug Fixes - Subscription & Authentication UX

**Status:** Planning
**Priority:** P0 (Critical - Blocks user experience)
**Created:** 2025-10-21
**Author:** JMR + Claude

## Problem Statement

Three critical UX bugs are preventing proper subscription functionality and user authentication:

1. **Dashboard shows incorrect tier** - User upgraded to Personal but dashboard still displays "Free"
2. **Incorrect CTA labels** - Pricing page shows "Start Free Trial" but we don't offer trials
3. **No login option** - Logged-out users cannot sign back in (no Sign In button on landing page)

## Current Behavior (Broken)

### Issue #1: Dashboard Tier Display
- **Location**: `/dashboard` (top-right corner)
- **Current**: Shows "Free" even after successful subscription
- **Root Cause**: TBD - Need to verify if:
  - Session not being refreshed after database update?
  - Server component not re-fetching user data?
  - Caching issue with Next.js 15?

### Issue #2: Pricing CTA Labels
- **Location**: `/pricing` page, pricing cards
- **Current**: All paid tiers show "Start Free Trial" button
- **Problem**: We don't offer free trials, this is misleading
- **Expected**: Should say "Upgrade to Personal", "Upgrade to SMB", etc.

### Issue #3: No Login Option
- **Location**: Landing page `/` when logged out
- **Current**: Only shows "Get Started Free" button (which triggers OAuth)
- **Problem**: Existing users who logged out cannot explicitly "Sign In"
- **Expected**: Should have both "Get Started Free" AND "Sign In" options

## Expected Behavior (Fixed)

### Issue #1: Dashboard Tier Display
- Dashboard should display correct subscription tier from database
- Should update immediately after subscription changes
- Format: "Personal" | "SMB" | "Pro" | "Free"

### Issue #2: Pricing CTA Labels
- **Free tier**: "Get Started" (gray, disabled style)
- **Personal tier**:
  - If current tier: "Current Plan" (disabled)
  - If not subscribed: "Upgrade to Personal" (blue)
- **SMB tier**: "Coming Soon" (gray, disabled) + subtitle "Available in Q2 2025"
- **Pro tier**: "Coming Soon" (gray, disabled) + subtitle "Available in Q2 2025"

### Issue #3: Login Options
- Landing page should show:
  - Primary CTA: "Get Started Free" (for new users)
  - Secondary CTA: "Sign In" (for returning users)
- Both should trigger GitHub OAuth (same flow, different messaging)

## Technical Implementation Plan

### Fix #1: Dashboard Tier Display

**Files to modify:**
- `app/dashboard/page.tsx` (server component)
- Potentially session refresh logic in NextAuth config

**Investigation steps:**
1. Verify session contains correct user ID
2. Check if `getUserByGithubId()` is being called
3. Confirm database has correct tier (we know it does from manual fix)
4. Check if Next.js page cache is preventing re-fetch
5. Add `export const dynamic = 'force-dynamic'` if needed

**Implementation:**
```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic' // Force server-side rendering

export default async function DashboardPage() {
  const session = await auth()
  const { getUserByGithubId } = await import('@/lib/db')
  const user = await getUserByGithubId(session.user.id)

  // Pass tier to client component
  return <DashboardClient tier={user.subscription_tier} ... />
}
```

### Fix #2: Pricing CTA Labels

**Files to modify:**
- `components/pricing-client.tsx` (lines 302-311)

**Current code:**
```typescript
<button onClick={() => handleUpgrade(tier.id, billingInterval)}>
  {isLoading ? 'Loading...' : tier.cta}
</button>
```

**Fixed code:**
```typescript
{canUpgrade && !isDowngrade ? (
  <button onClick={() => handleUpgrade(tier.id, billingInterval)}>
    {isLoading ? 'Loading...' : `Upgrade to ${tier.name}`}
  </button>
) : tier.comingSoon ? (
  <div className="text-center">
    <button disabled className="...">Coming Soon</button>
    <p className="mt-2 text-xs">Available in Q2 2025</p>
  </div>
) : (
  // Current plan or manage subscription
)}
```

**Remove from tier config:**
- Delete `cta` property from tier definitions (lines 91, 108, 123, 138)
- CTAs will be generated dynamically based on tier name

### Fix #3: Login Options

**Files to modify:**
- `app/page.tsx` (landing page)

**Current code:**
```typescript
<Link href="/api/auth/signin/github">
  Get Started Free
</Link>
```

**Fixed code:**
```typescript
<div className="flex gap-4">
  <Link href="/api/auth/signin/github"
        className="primary-button">
    Get Started Free
  </Link>
  <Link href="/api/auth/signin/github"
        className="secondary-button">
    Sign In
  </Link>
</div>
```

**Styling:**
- Primary: Dark background, white text (existing style)
- Secondary: White background, dark border, dark text (new style)

## Testing Checklist

### Issue #1: Dashboard Tier Display
- [ ] Fresh login shows correct tier
- [ ] After subscription upgrade, tier updates without re-login
- [ ] Hard refresh shows correct tier
- [ ] Multiple browser tabs show consistent tier

### Issue #2: Pricing CTA Labels
- [ ] Free tier shows "Get Started" (gray, disabled)
- [ ] Personal tier shows "Upgrade to Personal" (not "Start Free Trial")
- [ ] SMB/Pro show "Coming Soon" with Q2 2025 subtitle
- [ ] After upgrading to Personal, that card shows "Current Plan"
- [ ] "Manage Subscription" button appears on current tier card

### Issue #3: Login Options
- [ ] Landing page shows both "Get Started Free" and "Sign In" buttons
- [ ] Both buttons trigger GitHub OAuth correctly
- [ ] Logged-in users don't see these buttons (see dashboard link instead)
- [ ] Mobile view shows both buttons stacked vertically

## Rollout Plan

1. **Fix Implementation** (Sequential)
   - Fix #3 first (login options) - Independent change
   - Fix #2 next (pricing CTAs) - Independent change
   - Fix #1 last (dashboard tier) - May require investigation

2. **Testing**
   - Test each fix in local development
   - Deploy to Vercel preview environment
   - Test all three fixes together in preview
   - Manual QA checklist completion

3. **Production Deployment**
   - Merge fixes to main branch
   - Auto-deploy to production (Vercel)
   - Monitor for errors in Vercel logs
   - Verify fixes live on staticpress.me

## Success Metrics

- Dashboard displays correct tier for 100% of paid users
- Pricing page CTAs are clear and accurate (no "free trial" language)
- Logged-out users can successfully sign back in

## Open Questions

1. **Dashboard tier display**: Why isn't the database value showing? Need to debug session/database query.
2. **Should we differentiate new user vs returning user CTAs?** Currently both go to same OAuth flow.

## Dependencies

- None - These are self-contained UI/UX fixes
- All database schema and API routes already correct

## Timeline Estimate

- Investigation & Implementation: 1-2 hours
- Testing: 30 minutes
- Deployment: 15 minutes
- **Total**: ~2-3 hours
