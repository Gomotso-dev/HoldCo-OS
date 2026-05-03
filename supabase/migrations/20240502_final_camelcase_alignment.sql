-- MIGRATION: Final Schema Alignment for camelCase
-- This ensures all requested camelCase columns exist and are indexed correctly.

DO $$
BEGIN
    -- Companies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "legalEntityType" TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "groupRole" TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "incorporationDate" DATE;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "financialYearEnd" TEXT;
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Update existing data if possible (optional but good)
    UPDATE public.companies SET 
        "legalEntityType" = legal_entity_type WHERE "legalEntityType" IS NULL;
    UPDATE public.companies SET 
        "groupRole" = group_role WHERE "groupRole" IS NULL;
    UPDATE public.companies SET 
        "registrationNumber" = registration_number WHERE "registrationNumber" IS NULL;
    UPDATE public.companies SET 
        "incorporationDate" = incorporation_date WHERE "incorporationDate" IS NULL;
    UPDATE public.companies SET 
        "financialYearEnd" = financial_year_end WHERE "financialYearEnd" IS NULL;
END $$;
