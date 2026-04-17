CREATE TABLE public.moon_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  climate_score INTEGER NOT NULL,
  zodiac_sign TEXT NOT NULL,
  volatility_alert BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.moon_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read moon history"
ON public.moon_history
FOR SELECT
USING (true);

CREATE INDEX idx_moon_history_created_at ON public.moon_history (created_at DESC);