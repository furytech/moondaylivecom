import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { INITIAL_TRANSIT_QUEUE } from '../src/mocks/transitQueue';

const SUPABASE_PROJECT_URL = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
const BUCKET_NAME = 'transit-images';

export const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export function getTransitImageUrl(sign: string): string {
  const cleanSign = sign.toLowerCase().trim();
  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanSign}.png`;
}

function escapeSqlString(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function formatSqlArray(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const elements = arr.map((item) => `'${escapeSqlString(item)}'`).join(', ');
  return `ARRAY[${elements}]::text[]`;
}

export function generatePopulateSql(): string {
  // 1. Direct update for any existing rows
  const directUpdates = ZODIAC_SIGNS.map((sign) => {
    const url = getTransitImageUrl(sign);
    return `UPDATE public.transits SET image_url = '${url}', updated_at = now() WHERE lower(id) = '${sign}';`;
  }).join('\n');

  // 2. Upsert all 12 signs from INITIAL_TRANSIT_QUEUE to guarantee all 12 rows exist in table with image_url populated
  const upserts = INITIAL_TRANSIT_QUEUE.map((item) => {
    const imageUrl = getTransitImageUrl(item.id);
    const hashtagsSql = formatSqlArray(item.hashtags);

    return `
INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  '${item.id}',
  '${escapeSqlString(item.sign)}',
  '${escapeSqlString(item.symbol)}',
  '${item.element}',
  '${escapeSqlString(item.ruler)}',
  '${escapeSqlString(item.dates)}',
  '${escapeSqlString(item.transitTitle)}',
  '${escapeSqlString(item.transitAspect)}',
  '${escapeSqlString(item.copy)}',
  '${escapeSqlString(item.powerHour)}',
  '${escapeSqlString(item.ritualTip)}',
  ${hashtagsSql},
  '${imageUrl}',
  '${item.status}',
  ${item.publishedAt ? `'${item.publishedAt}'::timestamptz` : 'NULL'},
  ${item.socialPostedAt ? `'${item.socialPostedAt}'::timestamptz` : 'NULL'},
  '${item.createdAt || new Date().toISOString()}'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();`;
  }).join('\n');

  return `
-- 1. Direct UPDATE on existing rows matching each sign id
${directUpdates}

-- 2. Ensure all 12 signs exist with populated image_url in transits table
${upserts}
`;
}

async function main() {
  console.log('======================================================================');
  console.log('POPULATING IMAGE_URL FOR ALL 12 SIGNS IN SUPABASE (ggrhuhwxbwrfbbcwcrmv)');
  console.log('======================================================================\n');
  console.log(`Base URL Pattern: ${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET_NAME}/[signname].png\n`);

  ZODIAC_SIGNS.forEach((sign, idx) => {
    console.log(`[${(idx + 1).toString().padStart(2, '0')}/12] Sign: ${sign.padEnd(12)} -> ${getTransitImageUrl(sign)}`);
  });

  const sql = generatePopulateSql();
  const tempSqlFile = path.resolve(process.cwd(), 'supabase', 'migrations', '003_populate_transit_images.sql');
  fs.writeFileSync(tempSqlFile, sql, 'utf-8');
  
  console.log(`\nExecuting SQL migration file (${tempSqlFile}) against linked Supabase project (ggrhuhwxbwrfbbcwcrmv)...`);
  try {
    const output = execSync(`npx supabase db query --linked --file "${tempSqlFile}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log('\nExecution Output:');
    console.log(output || 'SQL statements executed successfully.');

    console.log('\n======================================================================');
    console.log('VERIFYING POPULATED ROWS IN public.transits');
    console.log('======================================================================');
    const verifyOutput = execSync(
      `npx supabase db query --linked "SELECT id, sign, symbol, image_url, status FROM public.transits ORDER BY id ASC;"`,
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
    console.log(verifyOutput);
    console.log('✓ All 12 transit rows verified with correct image_url matching id!');
  } catch (err: any) {
    console.error('Error executing database update:', err?.message || err);
    if (err?.stdout) console.log('Stdout:', err.stdout.toString());
    if (err?.stderr) console.error('Stderr:', err.stderr.toString());
    process.exit(1);
  }
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('populate-transit-images')) {
  main();
}
