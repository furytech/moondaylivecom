Moonday Master Manual: Setup & Architecture (v1.5)

Part 1: Detailed Setup Guide (Lovable + Composio)

This section outlines the "wiring" for the MoondayLive system.

Composio API Key: ak_otnvBu25M-PqToU1M8bu

Lovable Project ID: de169447-c15b-467b-b3d6-d72517dbc01d

Flow: Secrets are stored in Lovable Cloud. Composio manages the Daily Cron (00:00) to trigger data fetches.

Part 2: Version Control & GitHub Sync

Source of Truth: All code in Lovable is mirrored to the GitHub repository.

Manual Updates: Use Appendix F to push manual revisions to this /docs folder via the AI.

Part 3: The Moon Engine & "Climate" Formula

The climate score ($EC$) is calculated on a scale of 0-100:

$$EC = (I \cdot W_{phase}) + (Z \cdot W_{sign}) + V$$

Sign Weights: Water (+10), Fire (-5), Earth (+5), Air (0).

Volatility Offset ($V$): A +15 offset is applied if the current time is within 2 hours of a zodiac sign transition.

Part 4: Security & YubiKey Protocols

Hardware Anchors: Primary dev access is secured via YubiKey 5C NFC.

The "Two is One" Rule: Always maintain a registered backup key in a physical safe.

Part 5: The 3-Node Matrix Schema (v1.5)

The Matrix drives the personalized forecast dashboard from three inputs — Container (Sun), Trigger (Moon transit), Receptor (natal profile).

Node 1 — `cosmic_weather`
Every Sun/Moon transit tick. Columns: trigger_timestamp, sun_sign_tropical, sun_sign_sidereal, moon_sign_tropical, moon_sign_sidereal, moon_sign_draconic, is_processed. Read: any authenticated user. Write: admins only.

Node 2 — `content_drafts`
Generated forecast payloads awaiting review. FK → cosmic_weather.id (ON DELETE CASCADE). Columns: status (default 'pending_review'), app_atmospheric_text, app_experiential_text, reddit_payload (jsonb), substack_payload (jsonb). Admin-only.

Node 3 — `user_natal_profiles`
Minimal, moon-only per the Honest Chart Doctrine. PK = user_id → auth.users. Columns: natal_moon_tropical, natal_moon_sidereal. Each user manages their own row; admins can read all. No birth time is collected.

Admin role
`public.app_role` enum + `public.user_roles(user_id, role)` table + `public.has_role(uuid, app_role)` security-definer helper. Admin grants are assigned manually via SQL — never from the client. Roles are never stored on `user_profiles`.

Existing tables (`user_profiles`, `daily_forecasts`, `moon_*`, `mfa_backup_codes`) are untouched by the Matrix migration.
