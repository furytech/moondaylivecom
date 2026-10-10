import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url!, key!);

async function check() {
  const { data, error } = await supabase.rpc('get_schema_info').catch(() => ({ data: null, error: true }));
  // Or query rpc if any, or query tables that might have access
  console.log('rpc:', error);
}

check();
