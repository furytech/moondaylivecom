-- ======================================================================
-- Migration: 001_transits_schema.sql
-- Description: Create transits table, syndication polling index, and RLS policies
-- Phase 3: Database Schema & Edge Function Alignment
-- ======================================================================

-- 1. Create transits table
CREATE TABLE IF NOT EXISTS public.transits (
  id text PRIMARY KEY,
  sign text NOT NULL,
  symbol text,
  element text CHECK (element IN ('Fire', 'Earth', 'Air', 'Water') OR element IS NULL),
  ruler text,
  dates text,
  transit_title text NOT NULL,
  transit_aspect text,
  copy text NOT NULL,
  power_hour text,
  ritual_tip text,
  hashtags text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published')),
  published_at timestamptz,
  social_posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transits TO authenticated;
GRANT ALL ON public.transits TO service_role;
GRANT SELECT ON public.transits TO anon;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.transits ENABLE ROW LEVEL SECURITY;

-- Policy A: Public / Reader access (anon & authenticated)
-- Can read records where published_at is stamped, in the past/present, and status is 'published'
CREATE POLICY "Public can read published transits"
ON public.transits
FOR SELECT
TO anon, authenticated
USING (published_at IS NOT NULL AND published_at <= now() AND status = 'published');

-- Policy B: Admin / Mission Control access (authenticated admin role)
-- Full CRUD permissions for authenticated admins to review, update, publish, or delete
CREATE POLICY "Admins can manage all transits"
ON public.transits
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. High-performance index for out-of-band Make.com poller
CREATE INDEX IF NOT EXISTS idx_transits_syndication_poll 
ON public.transits (published_at, social_posted_at) 
WHERE published_at IS NOT NULL AND social_posted_at IS NULL;

-- 5. Automatic updated_at trigger
DROP TRIGGER IF EXISTS update_transits_updated_at ON public.transits;
CREATE TRIGGER update_transits_updated_at
BEFORE UPDATE ON public.transits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
