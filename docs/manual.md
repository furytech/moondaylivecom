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
