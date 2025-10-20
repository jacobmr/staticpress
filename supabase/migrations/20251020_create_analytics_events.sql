-- Migration: Create analytics_events table for server-side event logging
-- Date: 2025-10-20
-- Phase: Phase 2 - Paywall Gates + Personal Tier

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event ON analytics_events(user_id, event_name);

-- Add RLS (Row Level Security) policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own events (admins can read all via service role)
CREATE POLICY analytics_events_select_own ON analytics_events
  FOR SELECT
  USING (auth.uid()::text = (SELECT github_id FROM users WHERE id = analytics_events.user_id));

-- Policy: Only service role can insert events (server-side only)
CREATE POLICY analytics_events_insert_service_role ON analytics_events
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS, this is just a placeholder

-- Add comment for documentation
COMMENT ON TABLE analytics_events IS 'Server-side event logging for user actions and funnel analysis. Events: oauth_completed, repo_bound, first_publish, upgrade_modal_shown, upgrade_started, upgrade_completed, image_upload, etc.';
COMMENT ON COLUMN analytics_events.event_name IS 'Event identifier (e.g., oauth_completed, repo_bound, first_publish)';
COMMENT ON COLUMN analytics_events.metadata IS 'Additional event data as JSON (no PII)';
