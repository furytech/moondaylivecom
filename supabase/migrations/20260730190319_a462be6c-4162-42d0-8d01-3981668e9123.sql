insert into public.cron_secrets (name, secret_value)
values ('notify-moon-ingress', gen_random_uuid()::text)
on conflict (name) do update set secret_value = excluded.secret_value;

do $$
begin
  perform cron.unschedule('notify-moon-ingress');
exception when others then
  null;
end $$;

select cron.schedule(
  'notify-moon-ingress',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := 'https://hzlpnmvboqhzthvjlves.supabase.co/functions/v1/notify-moon-ingress',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', (select secret_value from public.cron_secrets where name = 'notify-moon-ingress')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
