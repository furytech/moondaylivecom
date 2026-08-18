DROP POLICY IF EXISTS "Guests can edit their own open contributions" ON public.guest_contributions;

CREATE POLICY "Guests can edit their own open contributions"
ON public.guest_contributions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    status = ANY (ARRAY['draft'::text, 'submitted'::text])
    AND guest_id IN (SELECT id FROM public.guest_astrologers WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR guest_id IN (
    SELECT id FROM public.guest_astrologers
    WHERE user_id = auth.uid()
      AND (approved = true OR guest_contributions.status = 'draft')
  )
);