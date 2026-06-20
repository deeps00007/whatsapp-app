-- ============================================================
-- 026_template_media_bucket.sql
--
-- Creates the `template-media` Supabase Storage bucket for
-- WhatsApp template header images, videos and documents.
--
-- Public read so Meta can fetch URLs during template review.
-- Authenticated users can upload/delete only within their own folder.
--
-- File path convention: template-media/{auth.uid()}/{filename}
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-media',
  'template-media',
  TRUE,
  16777216, -- 16 MB (Meta's video limit)
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp',
    'video/mp4', 'video/3gpp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Template media are publicly readable" ON storage.objects;
CREATE POLICY "Template media are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'template-media');

DROP POLICY IF EXISTS "Users can upload their own template media" ON storage.objects;
CREATE POLICY "Users can upload their own template media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'template-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own template media" ON storage.objects;
CREATE POLICY "Users can update their own template media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'template-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own template media" ON storage.objects;
CREATE POLICY "Users can delete their own template media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'template-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
