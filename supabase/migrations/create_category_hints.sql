-- Category Learning System Migration
-- Creates global_category_hints table for collaborative categorization

CREATE TABLE IF NOT EXISTS global_category_hints (
  description_slug TEXT NOT NULL,
  category TEXT NOT NULL,
  votes INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (description_slug, category)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_global_hints_slug ON global_category_hints(description_slug);

-- Optional: Index for category lookups
CREATE INDEX IF NOT EXISTS idx_global_hints_category ON global_category_hints(category);

COMMENT ON TABLE global_category_hints IS 'Global collaborative category intelligence - learns from all users';
COMMENT ON COLUMN global_category_hints.description_slug IS 'Normalized description (slugified)';
COMMENT ON COLUMN global_category_hints.category IS 'Category learned from user edits';
COMMENT ON COLUMN global_category_hints.votes IS 'Number of times users chose this category for this description';
