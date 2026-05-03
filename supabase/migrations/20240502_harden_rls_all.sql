-- MIGRATION: Harden RLS for all main tables
-- Ensuring consistent FOR ALL USING + WITH CHECK pattern to prevent insert failures.

DO $$
DECLARE
    tbl_name TEXT;
    tbl_list TEXT[] := ARRAY['companies', 'compliance', 'documents', 'finance', 'company_tax_profiles', 'company_bank_details'];
BEGIN
    FOREACH tbl_name IN ARRAY tbl_list LOOP
        -- Check if table exists before 
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            EXECUTE format('DROP POLICY IF EXISTS "Users can only access their own data" ON public.%I', tbl_name);
            EXECUTE format('CREATE POLICY "Users can only access their own data" ON public.%I FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)', tbl_name);
        END IF;
    END LOOP;
END $$;
