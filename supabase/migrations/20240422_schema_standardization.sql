-- MIGRATION: HoldCo OS Database Schema Polish & Resilience
-- Standardizing snake_case and camelCase compatibility, owner_id isolation, and storage buckets.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (OPTIONAL BUT GOOD FOR INTEGRITY)
-- Note: Using TEXT with CHECK constraints is often safer for evolution in Supabase UI.

-- 3. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    trading_name TEXT,
    tradingName TEXT, -- Compatibility
    legal_entity_type TEXT NOT NULL,
    legalEntityType TEXT, -- Compatibility
    group_role TEXT NOT NULL,
    groupRole TEXT, -- Compatibility
    registration_number TEXT NOT NULL,
    registrationNumber TEXT, -- Compatibility
    incorporation_date DATE NOT NULL,
    incorporationDate DATE, -- Compatibility
    tax_number TEXT,
    taxNumber TEXT, -- Compatibility
    vat_number TEXT,
    vatNumber TEXT, -- Compatibility
    paye_number TEXT,
    payeNumber TEXT, -- Compatibility
    uif_number TEXT,
    uifNumber TEXT, -- Compatibility
    industry TEXT,
    financial_year_end TEXT NOT NULL,
    financialYearEnd TEXT, -- Compatibility
    status TEXT NOT NULL DEFAULT 'Active',
    notes TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW(), -- Compatibility
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW() -- Compatibility
);

-- 4. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    companyId UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- Compatibility
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    fileUrl TEXT, -- Compatibility
    file_type TEXT,
    fileType TEXT, -- Compatibility
    version_number INTEGER DEFAULT 1,
    versionNumber INTEGER DEFAULT 1, -- Compatibility
    issue_date DATE,
    issueDate DATE, -- Compatibility
    expiry_date DATE,
    expiryDate DATE, -- Compatibility
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploadedBy UUID, -- Compatibility
    notes TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW() -- Compatibility
);

-- 5. SHAREHOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.shareholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    companyId UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- Compatibility
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Person' or 'Entity'
    ownership_percentage NUMERIC(5,2) NOT NULL,
    ownershipPercentage NUMERIC(5,2), -- Compatibility
    share_class TEXT NOT NULL,
    shareClass TEXT, -- Compatibility
    issue_date DATE,
    issueDate DATE, -- Compatibility
    notes TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DIRECTORS TABLE
CREATE TABLE IF NOT EXISTS public.directors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    companyId UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- Compatibility
    full_name TEXT NOT NULL,
    fullName TEXT, -- Compatibility
    id_number TEXT,
    idNumber TEXT, -- Compatibility
    passport_number TEXT,
    passportNumber TEXT, -- Compatibility
    appointment_date DATE NOT NULL,
    appointmentDate DATE, -- Compatibility
    resignation_date DATE,
    resignationDate DATE, -- Compatibility
    role_title TEXT NOT NULL DEFAULT 'Director',
    roleTitle TEXT, -- Compatibility
    email TEXT,
    phone TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BENEFICIAL OWNERS TABLE
CREATE TABLE IF NOT EXISTS public.beneficial_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    companyId UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- Compatibility
    full_name TEXT NOT NULL,
    fullName TEXT, -- Compatibility
    control_type TEXT NOT NULL,
    controlType TEXT, -- Compatibility
    ownership_percentage NUMERIC(5,2) NOT NULL,
    ownershipPercentage NUMERIC(5,2), -- Compatibility
    effective_date DATE,
    effectiveDate DATE, -- Compatibility
    status TEXT DEFAULT 'Active',
    notes TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COMPLIANCE TABLE
CREATE TABLE IF NOT EXISTS public.compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    companyId UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- Compatibility
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    dueDate DATE, -- Compatibility
    reminder_date DATE,
    reminderDate DATE, -- Compatibility
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    linked_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    linkedDocumentId UUID REFERENCES public.documents(id) ON DELETE SET NULL, -- Compatibility
    notes TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FINANCE TABLE
CREATE TABLE IF NOT EXISTS public.finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    companyId UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- Compatibility
    related_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    relatedCompanyId UUID REFERENCES public.companies(id) ON DELETE SET NULL, -- Compatibility
    intercompany BOOLEAN DEFAULT FALSE,
    compliance BOOLEAN DEFAULT FALSE,
    date DATE NOT NULL,
    type TEXT NOT NULL, -- 'Income', 'Expense', etc.
    category TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    description TEXT,
    payment_method TEXT,
    paymentMethod TEXT, -- Compatibility
    counterparty TEXT,
    reference_number TEXT,
    referenceNumber TEXT, -- Compatibility
    linked_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    linkedDocumentId UUID REFERENCES public.documents(id) ON DELETE SET NULL, -- Compatibility
    notes TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    userId UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Compatibility
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    eventType TEXT, -- Compatibility
    entity_type TEXT NOT NULL,
    entityType TEXT, -- Compatibility
    entity_id TEXT,
    entityId TEXT, -- Compatibility
    description TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    companyId UUID REFERENCES public.companies(id) ON DELETE SET NULL, -- Compatibility
    created_at TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW() -- Compatibility
);

-- 11. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficial_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 12. POLICIES (Example for Companies, repeat for others)
-- Helper to handle multiple tables cleanly
DO $$
DECLARE
    tbl_name TEXT;
    tbl_list TEXT[] := ARRAY['companies', 'documents', 'shareholders', 'directors', 'beneficial_owners', 'compliance', 'finance', 'activity_log'];
BEGIN
    FOREACH tbl_name IN ARRAY tbl_list LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can only access their own data" ON public.%I', tbl_name);
        EXECUTE format('CREATE POLICY "Users can only access their own data" ON public.%I FOR ALL USING (auth.uid() = owner_id)', tbl_name);
    END LOOP;
END $$;

-- 13. STORAGE SETUP
-- Ensure the bucket exists (can only be done via dashboard or API, but here is the manual setup reminder)
-- To be run in dashboard: 
-- 1. Create PUBLIC bucket named 'documents'
-- 2. Run the policies below:

/*
-- Create Bucket Policies (Run in Dashboard)
CREATE POLICY "Users can upload their own document files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own document files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own document files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
*/
