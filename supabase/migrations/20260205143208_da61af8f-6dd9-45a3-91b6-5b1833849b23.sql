-- Create daily_forecasts table for birth/current moon sign combinations
CREATE TABLE public.daily_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  birth_moon_sign TEXT NOT NULL,
  current_moon_sign TEXT NOT NULL,
  headline TEXT NOT NULL,
  forecast_text TEXT NOT NULL,
  energy TEXT NOT NULL,
  lucky_focus TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(birth_moon_sign, current_moon_sign)
);

-- Create moon_phase_texts table for phase modifiers
CREATE TABLE public.moon_phase_texts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_name TEXT NOT NULL UNIQUE,
  modifier_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.daily_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moon_phase_texts ENABLE ROW LEVEL SECURITY;

-- Create read-only policies (content is public)
CREATE POLICY "Anyone can read daily forecasts"
ON public.daily_forecasts
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read moon phase texts"
ON public.moon_phase_texts
FOR SELECT
USING (true);

-- Add trigger for updated_at on daily_forecasts
CREATE TRIGGER update_daily_forecasts_updated_at
BEFORE UPDATE ON public.daily_forecasts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();