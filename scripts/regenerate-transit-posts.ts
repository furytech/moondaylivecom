/**
 * scripts/regenerate-transit-posts.ts
 *
 * Regenerates all platform-native channel fields:
 *   - facebook_post
 *   - instagram_post
 *   - twitter_post
 *   - threads_post
 *   - pinterest_post
 *   - substack_post   ← restored (was excluded; engine now generates this)
 *   - reddit_post     ← restored (was excluded; engine now generates this)
 * for all 12 transit records in blog_posts using the Gemini API (gemini-3.1-flash-lite).
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('CRON_SECRET is required (used to authorize the edge function call).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

interface PostRecord {
  id: string;
  slug: string;
  title: string;
  zodiac_sign_tag: string;
  publish_at: string | null;
  published_at: string | null;
}

async function regeneratePost(post: PostRecord): Promise<boolean> {
  const url = `${SUPABASE_URL}/functions/v1/regenerate-channel-copy`;
  console.log(`\n------------------------------------------------------------`);
  console.log(`Regenerating [${post.zodiac_sign_tag}] "${post.title}" (ID: ${post.id})...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({
        post_id: post.id,
        channels: ['facebook', 'instagram', 'twitter', 'threads', 'pinterest', 'substack', 'reddit'],
        model: 'gemini-3.1-flash-lite',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ HTTP ${res.status} Error: ${errText}`);
      return false;
    }

    const data = await res.json();
    console.log(`✓ Successfully updated fields for ${post.zodiac_sign_tag}:`);
    console.log(`  - facebook_post:  ${data.facebook_post  ? `${data.facebook_post.length} chars`  : 'missing'}`);
    console.log(`  - instagram_post: ${data.instagram_post ? `${data.instagram_post.length} chars` : 'missing'}`);
    console.log(`  - twitter_post:   ${data.twitter_post   ? `${data.twitter_post.length} chars`   : 'missing'}`);
    console.log(`  - threads_post:   ${data.threads_post   ? `${data.threads_post.length} chars`   : 'missing'}`);
    console.log(`  - pinterest_post: ${data.pinterest_post ? `${data.pinterest_post.length} chars` : 'missing'}`);
    console.log(`  - substack_post:  ${data.substack_post  ? `${data.substack_post.length} chars`  : 'missing'}`);
    console.log(`  - reddit_post:    ${data.reddit_post    ? `${data.reddit_post.length} chars`    : 'missing'}`);
    return true;
  } catch (err: unknown) {
    console.error(`❌ Network / Exception:`, err);
    return false;
  }
}

async function main() {
  console.log('Fetching all 12 transit records from blog_posts...');
  const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, slug, title, zodiac_sign_tag, publish_at, published_at')
      .eq('category', 'Transits')
      .order('publish_at', { ascending: true, nullsFirst: false });

  if (error || !posts) {
    console.error('Failed to fetch posts:', error);
    process.exit(1);
  }

  console.log(`Found ${posts.length} transit posts.`);
  if (posts.length !== 12) {
    console.warn(`Warning: expected 12 posts, got ${posts.length}`);
  }

  let successCount = 0;
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\nProcessing [${i + 1}/${posts.length}]: ${post.title}`);
    const ok = await regeneratePost(post);
    if (ok) {
      successCount++;
    } else {
      console.error(`Failed on post ${post.id}. Retrying once after 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
      const retryOk = await regeneratePost(post);
      if (retryOk) successCount++;
    }
    // Pacing delay — Gemini rate limits
    if (i < posts.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log('\n============================================================');
  console.log(`Completed: ${successCount}/${posts.length} transit records regenerated.`);
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
