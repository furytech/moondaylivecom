create table public.cron_secrets (
  name text primary key,
  secret_value text not null,
  created_at timestamptz not null default now()
);

grant all on public.cron_secrets to service_role;

alter table public.cron_secrets enable row level security;

insert into public.cron_secrets (name, secret_value) values ('auto-publish', gen_random_uuid()::text);

-- Ensure no one can see the cron secret except via service role
CREATE POLICY "Service role only" ON public.cron_secrets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "No public access" ON public.cron_secrets FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No anonymous access" ON public.cron_secrets FOR ALL TO anon USING (false) WITH CHECK (false);
