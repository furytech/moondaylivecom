UPDATE public.blog_posts
SET reddit_status = 'draft', reddit_posted_at = NULL
WHERE reddit_status = 'sent'
  AND reddit_posted_at IS NOT NULL
  AND reddit_scheduled_at IS NOT NULL
  AND reddit_posted_at < reddit_scheduled_at;

UPDATE public.blog_posts
SET substack_status = 'draft', substack_sent_at = NULL
WHERE substack_status = 'sent'
  AND substack_sent_at IS NOT NULL
  AND substack_scheduled_at IS NOT NULL
  AND substack_sent_at < substack_scheduled_at;