/**
 * scripts/measure-stored-triads.ts  (read-only)
 *
 * Given a JSON export of triad_states text columns, reports how many rows contain body/health wording and how much of
 * each field would remain after the display filter (stripBodyClaims). Nothing is written anywhere.
 *
 *   supabase db query --linked "select physical_guidance, emotional_guidance, spiritual_guidance, daily_ritual,
 *     shadow_activation, integration_invitation from public.triad_states" > triads.json
 *   npx tsx scripts/measure-stored-triads.ts triads.json
 */
import * as fs from 'fs';
import { hasBodyClaims, stripBodyClaims } from '../src/lib/dailyContentGuard';

const raw = fs.readFileSync(process.argv[2], 'utf8');
const start = raw.indexOf('{');
const end = raw.lastIndexOf('}');
const rows: Array<Record<string, string | null>> = JSON.parse(raw.slice(start, end + 1)).rows;

const fields = ['physical_guidance', 'emotional_guidance', 'spiritual_guidance', 'daily_ritual', 'shadow_activation', 'integration_invitation'];
console.log(`rows: ${rows.length}`);
for (const f of fields) {
  const flagged = rows.filter((r) => hasBodyClaims(r[f])).length;
  const emptied = rows.filter((r) => hasBodyClaims(r[f]) && stripBodyClaims(r[f]) === '').length;
  const shorter = rows.filter((r) => hasBodyClaims(r[f]) && stripBodyClaims(r[f]) !== '').length;
  console.log(`${f.padEnd(24)} flagged ${String(flagged).padStart(5)}   shown in part ${String(shorter).padStart(5)}   hidden entirely ${String(emptied).padStart(5)}`);
}
