create or replace function public.sovereign_users_for_ingress(
  p_transition_at timestamptz,
  p_to_sign text
)
returns table (
  user_id uuid,
  email text,
  moon_sign text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.email,
    p.moon_sign
  from public.user_profiles p
  where p.is_subscriber = true
    and p.email is not null
    and (
      p.moon_alert_frequency is null
      or p.moon_alert_frequency = 'all'
      or (
        p.moon_alert_frequency = 'natal'
        and p.moon_sign is not null
        and lower(p.moon_sign) = lower(p_to_sign)
      )
    )
    and not exists (
      select 1
      from public.moon_ingress_notifications n
      where n.user_id = p.user_id
        and n.transition_at = p_transition_at
    )
$$;

grant execute on function public.sovereign_users_for_ingress(timestamptz, text) to service_role;
revoke execute on function public.sovereign_users_for_ingress(timestamptz, text) from authenticated, anon;
