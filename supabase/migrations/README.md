# Database Migrations

This directory contains SQL migration files for the StaticPress Supabase database.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://gyhfpkofafjccpvkyqqs.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of each migration file in order:
   - `20251020_add_subscription_tiers.sql`
   - `20251020_create_analytics_events.sql`
5. Click **Run** to execute each migration

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref gyhfpkofafjccpvkyqqs

# Apply migrations
supabase db push
```

## Migrations in this Phase

### 20251020_add_subscription_tiers.sql
- Updates `subscription_tier` column to support 4 tiers: `free`, `personal`, `smb`, `pro`
- Adds check constraint for valid tier values
- Adds index for faster tier-based queries
- Sets default to `free` for new users

### 20251020_create_analytics_events.sql
- Creates `analytics_events` table for server-side event logging
- Adds indexes for common query patterns
- Enables Row Level Security (RLS)
- Supports events: oauth_completed, repo_bound, first_publish, upgrade_modal_shown, etc.

## Verify Migrations

After applying migrations, verify they worked:

```sql
-- Check subscription_tier constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_subscription_tier_check';

-- Verify analytics_events table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'analytics_events';

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('users', 'analytics_events');
```

## Rollback (if needed)

If you need to rollback:

```sql
-- Rollback subscription tiers (revert to old constraint)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro'));

-- Rollback analytics_events
DROP TABLE IF EXISTS analytics_events CASCADE;
```

## Next Steps

After applying migrations:
1. Verify the database schema matches expectations
2. Test with a development user account
3. Proceed with Stripe integration (Week 1, Task 4)
