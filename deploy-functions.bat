@echo off
echo Deploying Moonday Live edge functions...
echo.

echo =^> auth-email-hook (no jwt)
supabase.cmd functions deploy auth-email-hook --no-verify-jwt

echo =^> calculate-climate (no jwt)
supabase.cmd functions deploy calculate-climate --no-verify-jwt

echo =^> check-subscription (no jwt)
supabase.cmd functions deploy check-subscription --no-verify-jwt

echo =^> create-checkout (no jwt)
supabase.cmd functions deploy create-checkout --no-verify-jwt

echo =^> customer-portal (no jwt)
supabase.cmd functions deploy customer-portal --no-verify-jwt

echo =^> notify-moon-ingress (no jwt)
supabase.cmd functions deploy notify-moon-ingress --no-verify-jwt

echo =^> preview-transactional-email (no jwt)
supabase.cmd functions deploy preview-transactional-email --no-verify-jwt

echo =^> send-transit-review (no jwt)
supabase.cmd functions deploy send-transit-review --no-verify-jwt

echo =^> sovereign-teaser (no jwt)
supabase.cmd functions deploy sovereign-teaser --no-verify-jwt

echo =^> verify-turnstile (no jwt)
supabase.cmd functions deploy verify-turnstile --no-verify-jwt

echo =^> stripe-webhook (no jwt)
supabase.cmd functions deploy stripe-webhook --no-verify-jwt

echo =^> handle-email-events (no jwt)
supabase.cmd functions deploy handle-email-events --no-verify-jwt

echo =^> make-social-bridge (no jwt)
supabase.cmd functions deploy make-social-bridge --no-verify-jwt

echo =^> admin-delete-user
supabase.cmd functions deploy admin-delete-user

echo =^> auto-publish-posts
supabase.cmd functions deploy auto-publish-posts

echo =^> dispatch-preview
supabase.cmd functions deploy dispatch-preview

echo =^> facebook-post
supabase.cmd functions deploy facebook-post

echo =^> fill-transit-schedule
supabase.cmd functions deploy fill-transit-schedule

echo =^> generate-blog-draft
supabase.cmd functions deploy generate-blog-draft

echo =^> list-subscribers
supabase.cmd functions deploy list-subscribers

echo =^> mfa-recover-with-code
supabase.cmd functions deploy mfa-recover-with-code

echo =^> mfa-store-backup-codes
supabase.cmd functions deploy mfa-store-backup-codes

echo =^> next-ingress
supabase.cmd functions deploy next-ingress

echo =^> publish-transit-draft
supabase.cmd functions deploy publish-transit-draft

echo =^> reddit-auto-post
supabase.cmd functions deploy reddit-auto-post

echo =^> regenerate-channel-copy
supabase.cmd functions deploy regenerate-channel-copy

echo =^> seed-moon-transitions
supabase.cmd functions deploy seed-moon-transitions

echo =^> substack-approval
supabase.cmd functions deploy substack-approval

echo =^> substack-auto-post
supabase.cmd functions deploy substack-auto-post

echo =^> substack-bridge-send
supabase.cmd functions deploy substack-bridge-send

echo =^> telegram-notify
supabase.cmd functions deploy telegram-notify

echo =^> transcribe-guest-audio
supabase.cmd functions deploy transcribe-guest-audio

echo.
echo Done. mcp and migration-export intentionally NOT deployed.
