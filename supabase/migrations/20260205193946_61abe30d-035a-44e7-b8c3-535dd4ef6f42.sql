-- Create moon_sign_library table for permanent zodiac content
CREATE TABLE public.moon_sign_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sign_name TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  element TEXT NOT NULL,
  ruling_planet TEXT NOT NULL,
  
  -- The Essence (JSONB for structured content)
  essence JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- The Shadow (JSONB for structured content)
  shadow JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- The Sacred Ritual (JSONB for structured content)
  ritual JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- The Elemental Affinity (JSONB for stones, botanicals, colors)
  elemental_affinity JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moon_sign_library ENABLE ROW LEVEL SECURITY;

-- Allow public read access (this is reference content)
CREATE POLICY "Anyone can read moon sign library"
  ON public.moon_sign_library
  FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_moon_sign_library_updated_at
  BEFORE UPDATE ON public.moon_sign_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.moon_sign_library IS 'Permanent content for the Lunar Encyclopedia / Library page';
COMMENT ON COLUMN public.moon_sign_library.essence IS 'JSON: {title, poetry, coreWounds[], soulGifts[]}';
COMMENT ON COLUMN public.moon_sign_library.shadow IS 'JSON: {title, rawTruth, triggers[], hiddenFears[], destructivePatterns[]}';
COMMENT ON COLUMN public.moon_sign_library.ritual IS 'JSON: {title, element, practice, timing, tools[], steps[]}';
COMMENT ON COLUMN public.moon_sign_library.elemental_affinity IS 'JSON: {sacredNumber, moonPhase, stones[], botanicals[], colors[]}';