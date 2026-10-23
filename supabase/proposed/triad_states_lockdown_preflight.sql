-- READ-ONLY pre-flight for supabase/proposed/triad_states_lockdown.sql. Changes nothing. Project ggrhuhwxbwrfbbcwcrmv.
-- One statement, one result cell: the SQL editor only shows the last statement's result, so everything is
-- folded into a single JSON value. Counts and catalog metadata only; no member data and no triad text.
select jsonb_pretty(jsonb_build_object(
  'tables', (
    select jsonb_agg(jsonb_build_object('table', c.relname, 'rls_on', c.relrowsecurity, 'owner', pg_get_userbyid(c.relowner)) order by c.relname)
      from pg_class c
     where c.relnamespace = 'public'::regnamespace
       and c.relname in ('triad_states', 'triad_states_backup_2026_10_21')),
  'policies', (
    select coalesce(jsonb_agg(jsonb_build_object('table', tablename, 'name', policyname, 'roles', roles, 'cmd', cmd, 'using', qual) order by tablename, policyname), '[]'::jsonb)
      from pg_policies
     where schemaname = 'public' and tablename in ('triad_states', 'triad_states_backup_2026_10_21')),
  'privileges', (
    select jsonb_agg(jsonb_build_object('table', t.tbl, 'role', r.role,
             'select', has_table_privilege(r.role, 'public.' || t.tbl, 'SELECT'),
             'insert', has_table_privilege(r.role, 'public.' || t.tbl, 'INSERT'),
             'update', has_table_privilege(r.role, 'public.' || t.tbl, 'UPDATE'),
             'delete', has_table_privilege(r.role, 'public.' || t.tbl, 'DELETE'),
             'truncate', has_table_privilege(r.role, 'public.' || t.tbl, 'TRUNCATE')) order by t.tbl, r.role)
      from (values ('anon'), ('authenticated'), ('service_role')) r(role),
           (values ('triad_states'), ('triad_states_backup_2026_10_21')) t(tbl)),
  'in_realtime_publication', (select count(*) from pg_publication_tables where tablename like 'triad_states%'),
  'objects_depending_on_triad_states', (select count(*) from pg_depend where refobjid = 'public.triad_states'::regclass and deptype = 'n'),
  'rows', jsonb_build_object(
    'triad_states', (select count(*) from public.triad_states),
    'backup', (select count(*) from public.triad_states_backup_2026_10_21)),
  'members', (
    select jsonb_build_object(
      'total', count(*),
      'no_natal_pair', count(*) filter (where natal_sun_sign is null or natal_moon_sign is null),
      'paid', count(*) filter (where is_subscriber is true or lower(coalesce(subscription_status, '')) in ('sovereign', 'luminary')),
      'paid_without_natal_pair', count(*) filter (where (natal_sun_sign is null or natal_moon_sign is null)
                                                    and (is_subscriber is true or lower(coalesce(subscription_status, '')) in ('sovereign', 'luminary'))))
      from public.user_profiles)
)) as preflight;
