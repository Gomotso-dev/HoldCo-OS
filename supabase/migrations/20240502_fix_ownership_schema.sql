-- MIGRATION: Fix Shareholders & Ownership Columns
-- Adding missing updated_at columns and ensuring camelCase compatibility for all ownership tables.

-- 1. ADD MISSING COLUMNS
ALTER TABLE public.shareholders 
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.directors 
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.beneficial_owners 
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();



-- 3. HARDEN RLS POLICIES FOR INSERTS
-- Standardizing from 'FOR ALL USING' to explicit 'FOR INSERT WITH CHECK' to prevent RLS failures on specific Postgres versions.
DO $$
DECLARE
    tbl_name TEXT;
    tbl_list TEXT[] := ARRAY['shareholders', 'directors', 'beneficial_owners'];
BEGIN
    FOREACH tbl_name IN ARRAY tbl_list LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can only access their own data" ON public.%I', tbl_name);
        EXECUTE format('CREATE POLICY "Users can only access their own data" ON public.%I FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)', tbl_name);
    END LOOP;
END $$;
