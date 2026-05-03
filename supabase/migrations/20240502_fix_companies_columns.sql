-- MIGRATION: Ensure standard columns exist on companies table
-- Some environments might have the table without snake_case columns.

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Also ensure other snake_case columns exist for compatibility
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS "legal_entity_type" TEXT,
ADD COLUMN IF NOT EXISTS "group_role" TEXT,
ADD COLUMN IF NOT EXISTS "registration_number" TEXT,
ADD COLUMN IF NOT EXISTS "incorporation_date" DATE,
ADD COLUMN IF NOT EXISTS "financial_year_end" TEXT;
