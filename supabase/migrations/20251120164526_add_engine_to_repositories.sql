-- Add engine column to repositories table
ALTER TABLE repositories
ADD COLUMN engine TEXT NOT NULL DEFAULT 'hugo';

-- Add check constraint for valid engine values
ALTER TABLE repositories
ADD CONSTRAINT valid_engine CHECK (engine IN ('hugo', 'krems'));
