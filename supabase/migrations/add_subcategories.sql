-- Add subcategory support to existing tables

-- 1. Add subcategory column to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 2. Add subcategory column to global_category_hints
ALTER TABLE global_category_hints
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 3. Update global_category_hints primary key to include subcategory
-- (This requires dropping and recreating the constraint)

-- First, check if we need to update the PK
DO $$
BEGIN
    -- Drop existing primary key
    ALTER TABLE global_category_hints DROP CONSTRAINT IF EXISTS global_category_hints_pkey;
    
    -- Add new primary key including subcategory (NULL allowed for backward compatibility)
    -- Using unique constraint instead since subcategory is nullable
    CREATE UNIQUE INDEX IF NOT EXISTS idx_global_hints_unique 
    ON global_category_hints(description_slug, category, COALESCE(subcategory, ''));
END $$;

COMMENT ON COLUMN transactions.subcategory IS 'Detailed subcategory (e.g., Combustível within Transporte)';
COMMENT ON COLUMN global_category_hints.subcategory IS 'Learned subcategory for better categorization';
