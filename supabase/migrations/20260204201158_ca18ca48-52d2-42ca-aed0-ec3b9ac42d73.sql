-- Add birth time and city columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS birth_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS birth_city TEXT DEFAULT NULL;