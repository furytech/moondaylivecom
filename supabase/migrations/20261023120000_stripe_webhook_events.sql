-- APPLIED 2026-10-24 in the Supabase SQL editor (project ggrhuhwxbwrfbbcwcrmv). Idempotent; no need to re-run.
-- Event-ID dedupe for stripe-webhook. The function inserts each Stripe event id before it
-- processes the event; a second delivery of the same id hits the primary key and is ignored.
-- Additive only: one new table, nothing existing is touched.
create table if not exists public.stripe_webhook_events (
  event_id    text primary key,
  event_type  text not null,
  received_at timestamptz not null default now()
);

-- Only the service role (the edge function) touches this table. RLS on with no policies
-- blocks anon and authenticated; the explicit grants keep it that way.
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from public, anon, authenticated;
grant select, insert, delete on public.stripe_webhook_events to service_role;

create index if not exists stripe_webhook_events_received_at_idx
  on public.stripe_webhook_events (received_at);
