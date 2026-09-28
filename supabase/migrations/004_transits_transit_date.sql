-- ======================================================================
-- Migration: 004_transits_transit_date.sql
-- Description: Add transit_date column to public.transits table
-- Target Supabase Project: ggrhuhwxbwrfbbcwcrmv
-- ======================================================================

-- 1. Add transit_date column to public.transits table
ALTER TABLE public.transits 
ADD COLUMN IF NOT EXISTS transit_date text;

-- 2. Populate default upcoming transit window for existing records
UPDATE public.transits 
SET transit_date = 'Sep 28 – Sep 30', updated_at = now()
WHERE transit_date IS NULL;
