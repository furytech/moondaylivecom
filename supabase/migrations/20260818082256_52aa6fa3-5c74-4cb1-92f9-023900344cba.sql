DROP POLICY IF EXISTS "Guests can create their own contributions" ON public.guest_contributions;

CREATE POLICY "Guests can create their own contributions"
ON public.guest_contributions
FOR INSERT
TO authenticated
WITH CHECK (
  guest_id IN (
    SELECT id FROM public.guest_astrologers
    WHERE user_id = auth.uid()
      AND (approved = true OR guest_contributions.status = 'draft')
  )
);