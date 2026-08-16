CREATE POLICY "Guests can upload their own recordings"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'guest-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Guests can read their own recordings"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'guest-audio'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Guests can update their own recordings"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'guest-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'guest-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Guests can delete their own recordings"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'guest-audio'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );