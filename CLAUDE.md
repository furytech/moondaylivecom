# Moonday Live: rules for AI coding agents

## What this is
Moonday Live (moondaylive.com) is a lunar astrology wellness app.
- Free tier: the Blueprint, 144 natal Sun + Moon profiles (combination_profiles).
- Paid tier: Luminary ($6.88/month or $58.88/year): the daily Triad = natal Sun × natal Moon × transiting Moon (1,728 states, triad_states).

## Stack and infrastructure
- React + TypeScript + Vite + Tailwind. Supabase project ggrhuhwxbwrfbbcwcrmv. Vercel deploys automatically on push to main. Repo: furytech/moondaylivecom.
- NEVER touch the old Supabase project hzlpnmvboqhzthvjlves (legacy Lovable build).
- Stripe is in LIVE mode. Never change Stripe configuration. Price IDs: monthly price_1ULN2GJowQfvwg0ZtYxb5Th5, yearly price_1ULN4MJowQfvwg0ZjOGNtzgY. create-checkout rejects any other ID.
- Edge functions live in supabase/functions. Deploy with: supabase functions deploy <name> --project-ref ggrhuhwxbwrfbbcwcrmv
- Auth email templates live in supabase/templates. Apply them with the Supabase Management API, PATCHing only the specific fields. Never run "supabase config push" (it can overwrite other live settings).
- Email sends through Resend from noreply@moondaylive.com.
- Windows + PowerShell: never chain commands with &&. Run .ts scripts with npx tsx scripts/<file>.ts.

## Workflow (always)
- After any change: npm test -- --run, then npm run build. If both pass, commit with a clear message and push to main. The owner wants changes shipped automatically, with no hold for review.
- Finish with a short plain-language summary of what changed, plus anything that needs the owner's decision.
- Don't invent product decisions. Report the options and ask.

## Ask first
- Before any irreversible or destructive action, stop and ask the owner first. That includes: dropping or truncating tables, deleting rows in bulk, deleting files permanently, changing production environment variables or secrets in Vercel or Supabase (such as STRIPE_SECRET_KEY), deleting users, or anything git revert can't undo.
- Routine edits, builds, tests, commits and pushes don't need asking.

## Product rules
- Birthday only. Never ask for, require, or store birth time or birth place. Moon sign assumes noon on the birth date. No Rising sign / Ascendant features or promises.
- The paid tier is "Luminary" in all visible copy. The database value subscription_status = 'sovereign' stays as-is (don't rename DB values, routes, or variables). Treat 'sovereign', 'luminary', or is_subscriber = true as paid.
- Users only ever see the Sun × Moon combination for their own birthday. Never build pickers, lists, links or URLs that let someone browse or look up other combinations (no 'for a friend' lookups).
- Birthdays are locked after signup (prevents looking up other people's signs for free). Corrections go through support@moondaylive.com.
- Upgrade buttons for signed-in users say "Unlock Luminary" and go to /pricing (the pricing page starts checkout). Never send signed-in users to /signup. Never show upsells to Luminary members.
- Cancellation must stay online: Account → "Manage subscription" opens the Stripe Customer Portal (cancels at the end of the paid period). Required by state auto-renewal laws.
- Moon-change birthdays use the Moon Cusp Quiz (src/lib/moonCuspQuiz.ts, src/lib/cuspDay.ts): pair-specific Moon questions, the user's own timezone, clock-weighted scoring. Close results let the person choose; never silently save a tie. Call it a "Moon-change birthday", not "Between Phases".
- Signup email order: confirmation email first, then the Blueprint email after confirmation.
- Tone: reflective, not predictive. No fear-based engagement. Blueprint strength statements stay around 30 words (owner's decision; don't shorten).

## Design rules
- Brand: dark navy background; gold (#d4af37) for significant moments and main buttons; violet for the personal/Blueprint layer; amber for live data.
- Menus and tab bars never scroll horizontally. Every option must be visible without swiping; on phones, wrap into a grid instead.
- Typography: the engraved display font is only for short headings and labels (6 words or fewer). Sentences use the body font in sentence case. Text that wraps to more than one line never goes in a rounded-full pill; use rounded-xl.
- The Sun + Moon combination title is the anchor metaphor of every reading. Always show it as a hero element (display font, gold), never as inline small text, and only once per page.
- Expand/collapse toggles look like buttons, never like labels. On public pages, collapsed content must be present in the HTML at load (hidden, not mounted on click) so search engines can index it.
- src/index.css centers every <p> and .font-serif by default. Left-aligned text needs an explicit text-left.
- Never add global element selectors (like section { ... }) to CSS.
- Check every UI change at phone width (360–400px) and on desktop. The bottom tab bar (Pulse, Blueprint, Lenses, Library, Account) must fit at 360px.

## SEO and URLs
- Canonical host is https://moondaylive.com (no www). www redirects to it in Vercel Domains.
- Before pushing changes to vercel.json routing or redirects, verify on a Vercel preview deploy first.
- All URLs are lowercase. Every public page has a self-referencing canonical, unique title and meta description in the served HTML.
- Build URLs and page SEO only through src/lib/seo.ts (blogPostPath, canonicalUrl, seoProps, buildPostSeo). Edge functions mirror it in supabase/functions/_shared/channels.ts. Never build /blog/... URLs from the raw category ("Transits").
- The build writes the head into the HTML for every public page (scripts/prerender-library.mjs, scripts/prerender-seo.mjs). A new public page needs an entry in PAGES in seo.ts; it is then prerendered, used by <SEO>, and listed in the sitemap.
- No trailing slashes. Capitalised /blog/<Category>/... paths 301 to lowercase in vercel.json. Unknown paths fall back to dist/app.html (rewrite destination is /app because cleanUrls is on), which has no canonical on purpose.
- /sitemap.xml is served live by api/sitemap.ts (there is no static sitemap file). Posts published after the last build are served by api/blog-post.ts with their own head; unpublished or deleted transit posts redirect to /transit/<sign>. Both read published posts with the public anon key (VITE_SUPABASE_* env vars) and share src/lib/seo.ts and src/lib/seoHead.ts with the build.
- Noindex pages stay out of the sitemap.
- Every public page's main content must be present in the served HTML (no JavaScript required). Verify with curl after changes.

## Lessons learned (don't repeat these)
- A global CSS rule section { py-… } padded the hidden toast container and pushed every page down ~128px on desktop. Find layout bugs with the browser's Inspect tool, not by guessing page by page.
- Pricing.tsx once sent an old yearly price ID and checkout failed. When checkout fails, read the create-checkout edge function logs first.
- An edit once went into BottomTabBar.tsx while the live nav was rendered elsewhere. Confirm which component actually renders before editing.
- Moon-change days were once computed in UTC, which misrouted evening births in the Americas. Always use the user's timezone for day boundaries.
- Tests that use the real clock break as dates pass. Pin the date with vi.setSystemTime (fake Date only).
- Supabase: VITE_SUPABASE_PUBLISHABLE_KEY must be the legacy eyJ… anon key. New tables need GRANTs as well as RLS policies. Only one createClient (src/integrations/supabase/client.ts). Queries return 1,000 rows max by default, so paginate.
- STRIPE_SECRET_KEY must start with sk_live_ or sk_test_. An mk_ key ID once caused a 500 that signed users out.
- The generated Supabase types are stale. Regenerate them before trusting tsc errors about profile updates.

## Planning
The owner tracks open work in a separate "Growth OS" page. Don't start work from that list unless asked.
