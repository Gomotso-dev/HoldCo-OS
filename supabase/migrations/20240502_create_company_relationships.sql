-- MIGRATION: Create Company Relationships Table
-- This table maps the group structure and ownership between entities.

CREATE TABLE IF NOT EXISTS public.company_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    parentCompanyId UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, -- Compatibility
    child_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    childCompanyId UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, -- Compatibility
    ownership_percentage NUMERIC(5,2) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    ownershipPercentage NUMERIC(5,2), -- Compatibility
    relationship_type TEXT NOT NULL, -- e.g. Holding Company, Subsidiary, Associate, Joint Venture
    relationshipType TEXT, -- Compatibility
    effective_date DATE DEFAULT CURRENT_DATE,
    effectiveDate DATE DEFAULT CURRENT_DATE, -- Compatibility
    notes TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW(), -- Compatibility
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW() -- Compatibility
);

-- RLS
ALTER TABLE public.company_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own data" ON public.company_relationships;
CREATE POLICY "Users can only access their own data" ON public.company_relationships 
FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_relationships_parent ON public.company_relationships(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_company_relationships_child ON public.company_relationships(child_company_id);
CREATE INDEX IF NOT EXISTS idx_company_relationships_owner ON public.company_relationships(owner_id);
