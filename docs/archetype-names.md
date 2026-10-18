# Moon-sign archetype names

One official naming system. Updated 2026-10-18.

- **Official archetype name**: the `archetype` field in `src/lib/moonSignContent.ts`. Shown on the Moon Card, the Moon-sign modal, and as "Your Moon Archetype" in the Library sign page (`SignDetailPanel` imports it; never duplicate it).
- **Library chapter heading**: `essence.title` in `src/lib/zodiacDeepContent.ts`, shown under the official name.

| Moon sign | Official archetype | Library chapter heading |
|---|---|---|
| Aries | The Warrior | The Primal Spark |
| Taurus | The Sensualist | The Sacred Vessel |
| Gemini | The Storyteller | The Quicksilver Witness |
| Cancer | The Nurturer | The Keeper of Memory |
| Leo | The Radiant Heart | The Golden Heart |
| Virgo | The Healer | The Devoted Tender |
| Libra | The Harmonizer | The Graceful Mediator |
| Scorpio | The Alchemist | The Keeper of Depths |
| Sagittarius | The Seeker | The Eternal Seeker |
| Capricorn | The Elder | The Ancient Architect |
| Aquarius | The Visionary | The Electric Outsider |
| Pisces | The Mystic | The Holy Dreamer |

## Other places names appear

- **Blueprint** (`BlueprintIdentity.tsx`) shows `combination_profiles.combination_title` (a Sun + Moon pair name, not a Moon-sign name). If missing, it falls back to "{Sun} Sun · {Moon} Moon".
- `combination_profiles` titles (144 rows) and the `moon_sign_library` table were not changed. `moon_sign_library` is not read by app code and its contents have not been checked.
- `combinationService.ts` `getArchetypeName` (fallback generator when a DB row is missing) still builds element-pair names such as "Double X Sovereign"; left as is.

## "Sovereign" in the 144 `combination_profiles` titles

**24 of 144 titles contain "Sovereign" (case-insensitive).** 21 use the exact word "Sovereign"; 3 use "Sovereignty" ("The Architect of Sovereignty").

### Exact word "Sovereign" (21)

| Sun / Moon | Title |
|---|---|
| Aquarius Sun / Aquarius Moon | The Sovereign Architect |
| Aquarius Sun / Leo Moon | The Sovereign Visionary |
| Aries Sun / Aries Moon | The Sovereign Vanguard |
| Aries Sun / Capricorn Moon | The Sovereign Architect |
| Aries Sun / Leo Moon | The Sovereign Architect |
| Cancer Sun / Cancer Moon | The Sovereign Sentinel |
| Cancer Sun / Leo Moon | The Sovereign Protector |
| Capricorn Sun / Aries Moon | The Sovereign Architect |
| Capricorn Sun / Taurus Moon | The Sovereign Architect |
| Leo Sun / Aries Moon | The Sovereign Vanguard |
| Leo Sun / Capricorn Moon | The Sovereign Architect |
| Leo Sun / Leo Moon | The Sovereign Architect |
| Leo Sun / Scorpio Moon | The Sovereign Strategist |
| Sagittarius Sun / Leo Moon | The Radiant Sovereign |
| Scorpio Sun / Cancer Moon | The Sovereign Sentinel |
| Scorpio Sun / Capricorn Moon | The Sovereign Strategist |
| Scorpio Sun / Leo Moon | The Sovereign Strategist |
| Scorpio Sun / Scorpio Moon | The Sovereign Sentinel |
| Scorpio Sun / Taurus Moon | The Sovereign Architect |
| Scorpio Sun / Virgo Moon | The Investigative Sovereign |
| Taurus Sun / Leo Moon | The Sovereign Architect |

### "Sovereignty" (3)

| Sun / Moon | Title |
|---|---|
| Capricorn Sun / Capricorn Moon | The Architect of Sovereignty |
| Capricorn Sun / Leo Moon | The Architect of Sovereignty |
| Capricorn Sun / Scorpio Moon | The Architect of Sovereignty |

Source: live `combination_profiles` table, queried read-only with the public key on 2026-10-18.
