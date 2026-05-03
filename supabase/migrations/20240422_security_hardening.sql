-- MIGRATION: HoldCo OS Security Hardening
-- Restricting storage access and audit log immutability.

-- 1. HARDEN STORAGE POLICIES
-- Ensure users can only access files in their own folder (user_id/...)
DROP POLICY IF EXISTS "Users can view their own document files" ON storage.objects;
CREATE POLICY "Users can view their own document files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload their own document files" ON storage.objects;
CREATE POLICY "Users can upload their own document files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own document files" ON storage.objects;
CREATE POLICY "Users can delete their own document files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);


-- 2. HARDEN AUDIT LOGS (IMMUTABILITY)
-- Users should be able to see and create logs, but never edit or delete them.
DROP POLICY IF EXISTS "Users can only access their own data" ON public.activity_log;

CREATE POLICY "Users can view their own activity logs" 
ON public.activity_log FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own activity logs" 
ON public.activity_log FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Note: No UPDATE or DELETE policy means those operations are denied by default.


-- 3. ENSURE PRIVATE BUCKET
-- While this is usually a dashboard toggle, this hint reminds the admin to keep it private.
-- UPDATE storage.buckets SET public = false WHERE id = 'documents';
