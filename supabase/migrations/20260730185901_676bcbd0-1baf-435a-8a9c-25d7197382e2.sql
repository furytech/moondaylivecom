alter table public.user_profiles
add column if not exists moon_alert_frequency text default 'all';

comment on column public.user_profiles.moon_alert_frequency is
  'Sovereign preference for moon ingress alerts: all (every ingress) or natal (only ingress into the user''s natal moon sign).';
