-- Create signups table for lead capture (public signup form)
CREATE TABLE public.signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  birth_date DATE NOT NULL,
  moon_sign TEXT NOT NULL,
  moon_element TEXT,
  moon_symbol TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup form)
CREATE POLICY "Anyone can submit signup"
ON public.signups
FOR INSERT
WITH CHECK (true);

-- Only allow reading via service role (admin only)
-- No SELECT policy for anon users