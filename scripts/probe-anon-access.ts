/**
 * scripts/probe-anon-access.ts  (read-only, counts only)
 *
 * Asks the project's REST API what the PUBLIC anon key can read, the way an anonymous visitor would.
 * For every table/view it can see, it sends a HEAD request with `Prefer: count=exact`, so only the
 * Content-Range header comes back: a row COUNT, never a row. Nothing is written anywhere.
 *
 *   npx tsx scripts/probe-anon-access.ts                       every table the API advertises
 *   npx tsx scripts/probe-anon-access.ts triad_states          just these tables
 *   npx tsx scripts/probe-anon-access.ts --expect-denied triad_states triad_states_backup_2026_10_21
 *
 * With --expect-denied the script exits 1 if any named table still returns a row count to anon
 * (that is the post-lockdown check). After the lockdown, "401/403" or a count of 0 both mean anon sees nothing.
 *
 * Uses only VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env.local (the key shipped in the
 * browser bundle). It refuses to run against any project except ggrhuhwxbwrfbbcwcrmv, and never prints the key.
 */
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_REF = 'ggrhuhwxbwrfbbcwcrmv';

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of ['.env.local', '.env']) {
    const file = path.resolve(process.cwd(), name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const base = (process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
if (!base.includes(PROJECT_REF)) {
  console.error(`Refusing to run: VITE_SUPABASE_URL is not project ${PROJECT_REF}.`);
  process.exit(2);
}
if (!anonKey) {
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY is not set.');
  process.exit(2);
}

const args = process.argv.slice(2);
const expectDenied = args.includes('--expect-denied');
const named = args.filter((a) => !a.startsWith('--'));
const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

async function advertisedTables(): Promise<string[]> {
  const res = await fetch(`${base}/rest/v1/`, { headers });
  if (!res.ok) throw new Error(`OpenAPI listing returned ${res.status}`);
  const spec = (await res.json()) as { paths?: Record<string, unknown> };
  return Object.keys(spec.paths ?? {})
    .filter((p) => p !== '/' && !p.startsWith('/rpc/'))
    .map((p) => p.slice(1))
    .sort();
}

interface Result {
  table: string;
  status: number;
  count: string;
  readable: boolean;
}

async function probe(table: string): Promise<Result> {
  const res = await fetch(`${base}/rest/v1/${encodeURIComponent(table)}?select=*`, {
    method: 'HEAD',
    headers: { ...headers, Prefer: 'count=exact', Range: '0-0' },
  });
  const range = res.headers.get('content-range') ?? '';
  const total = range.split('/')[1] ?? '';
  const readable = (res.status === 200 || res.status === 206) && total !== '' && total !== '0';
  return { table, status: res.status, count: res.ok ? total || '?' : '-', readable };
}

async function main() {
  let tables = named;
  if (tables.length === 0) {
    try {
      tables = await advertisedTables();
    } catch (err) {
      console.error(`${(err as Error).message}. Name the tables on the command line instead.`);
      process.exit(2);
    }
  }
  const results: Result[] = [];
  for (const t of tables) results.push(await probe(t));

  console.log(`project ${PROJECT_REF}, anon key, HEAD count only`);
  console.log('table'.padEnd(46), 'http'.padEnd(6), 'rows visible to anon');
  for (const r of results) {
    console.log(r.table.padEnd(46), String(r.status).padEnd(6), r.readable ? r.count : r.status < 300 ? '0' : 'denied');
  }

  if (expectDenied) {
    const leaks = results.filter((r) => r.readable);
    if (leaks.length > 0) {
      console.error(`\nFAIL: anon can still read ${leaks.map((l) => `${l.table} (${l.count} rows)`).join(', ')}`);
      process.exit(1);
    }
    console.log('\nPASS: anon reads no rows from the named tables.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
