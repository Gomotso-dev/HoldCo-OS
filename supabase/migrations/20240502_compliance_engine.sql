-- MIGRATION: Auto Compliance Template Engine
-- This migration sets up the template system and tax profiles.

-- 1. Compliance Templates (The Blueprints)
CREATE TABLE IF NOT EXISTS public.compliance_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    regulator TEXT NOT NULL, -- CIPC, SARS, Labour, POPIA, etc.
    applies_to_company_types TEXT[] NOT NULL, -- e.g. {'Private Company (Pty) Ltd', 'NPC'}
    frequency TEXT NOT NULL, -- annual, bi-annual, monthly, ad-hoc
    trigger_type TEXT NOT NULL, -- registration_based, financial_year_end_based, flag_based
    due_date_rule JSONB NOT NULL, -- { "months_offset": 1, "day_offset": 20 }
    grace_period_days INTEGER DEFAULT 30,
    penalty_risk_level TEXT NOT NULL, -- Low, Medium, High
    required_documents TEXT[] DEFAULT '{}',
    auto_create BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Company Tax Profile (Company-specific flags)
CREATE TABLE IF NOT EXISTS public.company_tax_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    is_vat_registered BOOLEAN DEFAULT false,
    vat_number TEXT,
    is_paye_registered BOOLEAN DEFAULT false,
    paye_number TEXT,
    is_uif_registered BOOLEAN DEFAULT false,
    uif_number TEXT,
    has_employees BOOLEAN DEFAULT false,
    industry_sector TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id)
);

-- 3. Update existing compliance items to link to templates
ALTER TABLE public.compliance ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.compliance_templates(id) ON DELETE SET NULL;
ALTER TABLE public.compliance ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE public.compliance ADD COLUMN IF NOT EXISTS required_documents TEXT[] DEFAULT '{}';

-- RLS
ALTER TABLE public.compliance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_tax_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by all authenticated users" 
ON public.compliance_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own company tax profiles" 
ON public.company_tax_profiles FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_template ON public.compliance(template_id);
CREATE INDEX IF NOT EXISTS idx_tax_profile_company ON public.company_tax_profiles(company_id);
