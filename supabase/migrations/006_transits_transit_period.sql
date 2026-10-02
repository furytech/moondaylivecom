-- ======================================================================
-- Migration: 006_transits_transit_period.sql
-- Description: Add transit_period column to public.transits table
-- ======================================================================

-- 1. Add transit_period column to public.transits table
ALTER TABLE public.transits 
ADD COLUMN IF NOT EXISTS transit_period text;

-- 2. Populate default upcoming transit window for existing records
UPDATE public.transits 
SET transit_period = COALESCE(transit_date, 'Sep 28 – Sep 30'), updated_at = now()
WHERE transit_period IS NULL;
