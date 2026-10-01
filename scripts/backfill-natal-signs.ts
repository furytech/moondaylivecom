import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { calculateNatalSigns } from '../src/lib/moonSign';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!);

    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('user_id, email, birthday')
        .or('natal_sun_sign.is.null,natal_moon_sign.is.null')
        .not('birthday', 'is', null);

    if (error) { console.error('Fetch error:', error); process.exit(1); }
    console.log(`Found ${users?.length ?? 0} users needing natal signs.\n`);

    for (const user of users ?? []) {
        process.stdout.write(`${user.email} (${user.birthday})... `);
        try {
            const { sunSign, moonSign } = await calculateNatalSigns(user.birthday);
            const { error: upErr } = await supabase
                .from('user_profiles')
                .update({ natal_sun_sign: sunSign, natal_moon_sign: moonSign })
                .eq('user_id', user.user_id);

            if (upErr) throw upErr;
            console.log(`${sunSign} Sun / ${moonSign} Moon — SAVED`);
        } catch (err: any) {
            console.log(`FAILED: ${err?.message?.slice(0, 80)}`);
        }
    }
    console.log('\nDone.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });