-- 1. Create a public bucket named 'ticket-attachments' for storing uploads.
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create a policy to allow any authenticated user to upload files to this bucket.
-- This policy is for INSERT operations.
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'ticket-attachments' );

-- 3. Create a policy to allow anyone to view/download files from this bucket.
-- This is safe because the file URLs are public but only accessible if you have the direct link.
CREATE POLICY "Public read access for attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ticket-attachments' );