-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can submit signup" ON public.signups;

-- Create a proper policy that allows anonymous users to insert
CREATE POLICY "Anyone can submit signup"
ON public.signups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);