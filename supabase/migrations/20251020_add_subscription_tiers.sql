-- Migration: Add Personal and SMB tiers to subscription_tier enum
-- Date: 2025-10-20
-- Phase: Phase 2 - Paywall Gates + Personal Tier

-- First, check if we need to recreate the enum or if we can alter it
-- Since PostgreSQL doesn't allow altering enums directly, we need to:
-- 1. Add new enum values if the column uses enum type, OR
-- 2. Change to text with check constraint

-- Option 1: If using enum type (drop and recreate)
-- DROP TYPE IF EXISTS subscription_tier_enum CASCADE;
-- CREATE TYPE subscription_tier_enum AS ENUM ('free', 'personal', 'smb', 'pro');

-- Option 2: If using text with check constraint (recommended for flexibility)
-- Remove old constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;

-- Ensure column is text type
ALTER TABLE users ALTER COLUMN subscription_tier TYPE TEXT;

-- Add new check constraint with all 4 tiers
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'personal', 'smb', 'pro'));

-- Ensure default is 'free' for new users
ALTER TABLE users ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Update any existing 'pro' users to stay as 'pro' (no changes needed)
-- All new users will default to 'free'

-- Add index for faster tier-based queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Add comment for documentation
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: free (default), personal ($2.50/mo), smb ($5/mo), pro ($10/mo)';
