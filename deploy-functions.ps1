# Moonday Live — deploy all edge functions
Write-Host "Deploying Moonday Live edge functions..." -ForegroundColor Green

$noJwt = @(
    "auth-email-hook",
    "calculate-climate",
    "check-subscription",
    "create-checkout",
    "customer-portal",
    "notify-moon-ingress",
    "preview-transactional-email",
    "send-transit-review",
    "sovereign-teaser",
    "verify-turnstile",
    "stripe-webhook",
    "handle-email-events",
    "make-social-bridge"
)

$withJwt = @(
    "admin-delete-user",
    "auto-publish-posts",
    "dispatch-preview",
    "facebook-post",
    "fill-transit-schedule",
    "generate-blog-draft",
    "list-subscribers",
    "mfa-recover-with-code",
    "mfa-store-backup-codes",
    "next-ingress",
    "publish-transit-draft",
    "reddit-auto-post",
    "regenerate-channel-copy",
    "seed-moon-transitions",
    "substack-approval",
    "substack-auto-post",
    "substack-bridge-send",
    "telegram-notify",
    "transcribe-guest-audio"
)

foreach ($f in $noJwt) {
    Write-Host "==> $f (no jwt)" -ForegroundColor Cyan
    & supabase functions deploy $f --no-verify-jwt
}

foreach ($f in $withJwt) {
    Write-Host "==> $f" -ForegroundColor Cyan
    & supabase functions deploy $f
}

Write-Host ""
Write-Host "Done. mcp and migration-export intentionally NOT deployed." -ForegroundColor Green
