// scripts/verify-auto-approve.ts
// Verification utility to inspect moon_transitions and transits tables.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.log('Skipping remote verification: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
  process.exit(0);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const { data: transitions, error: transError } = await supabase
    .from('moon_transitions')
    .select('*')
    .limit(1);

  if (transError) {
    console.log('moon_transitions query status:', transError.message);
  } else {
    console.log('moon_transitions sample row:', transitions?.[0] || 'No rows');
  }

  const { data: transits, error: transitError } = await supabase
    .from('transits')
    .select('id, sign, status')
    .limit(3);

  if (transitError) {
    console.log('transits query error:', transitError.message);
  } else {
    console.log('transits sample rows:', transits);
  }
}

main().catch(console.error);
