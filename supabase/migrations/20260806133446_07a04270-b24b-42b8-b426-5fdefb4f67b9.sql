CREATE POLICY "Users can delete own natal profile"
ON public.user_natal_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);