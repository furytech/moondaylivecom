-- ======================================================================
-- Migration: 002_transits_image_url.sql
-- Description: Add image_url column to transits and set up transit-images storage bucket
-- ======================================================================

-- 1. Add image_url column to transits table (nullable text)
ALTER TABLE public.transits 
ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Create the 'transit-images' public bucket in Supabase Storage if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('transit-images', 'transit-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Set up Storage Policies for 'transit-images' bucket
-- Public read access for images (for Instagram poller, social syndication, and web app)
CREATE POLICY "Public Read Access for Transit Images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'transit-images');

-- Admin & Service Role upload / management permissions
CREATE POLICY "Admin Upload Access for Transit Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transit-images' 
  AND (public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated')
);

CREATE POLICY "Admin Update Access for Transit Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'transit-images'
  AND (public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated')
);

CREATE POLICY "Admin Delete Access for Transit Images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'transit-images'
  AND (public.has_role(auth.uid(), 'admin') OR auth.role() = 'authenticated')
);
