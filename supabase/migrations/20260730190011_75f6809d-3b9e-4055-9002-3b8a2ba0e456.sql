create table public.moon_ingress_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  transition_at timestamptz not null,
  to_sign text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, transition_at)
);

grant all on public.moon_ingress_notifications to service_role;

alter table public.moon_ingress_notifications enable row level security;
