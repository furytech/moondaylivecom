# Moon-sign archetype names: inventory

Snapshot of where a Moon-sign archetype name is defined or shown. Inventory only; nothing was changed.

## Table: one row per Moon sign

| Moon sign | Moon Card + Moon-sign modal (`src/lib/moonSignContent.ts`, field `archetype`) | Library / SignDetailPanel (`src/lib/zodiacDeepContent.ts`, `essence.title`) |
|---|---|---|
| Aries | The Warrior | The Primal Spark |
| Taurus | The Sensualist | The Sacred Vessel |
| Gemini | The Storyteller | The Sacred Witness |
| Cancer | The Nurturer | The Keeper of Memory |
| Leo | The Sovereign | The Sovereign Heart |
| Virgo | The Healer | The Sacred Tender |
| Libra | The Harmonizer | The Sacred Mediator |
| Scorpio | The Alchemist | The Keeper of Death |
| Sagittarius | The Seeker | The Eternal Seeker |
| Capricorn | The Elder | The Ancient Architect |
| Aquarius | The Visionary | The Sacred Outsider |
| Pisces | The Mystic | The Holy Dissolver |

### Notes per source

- **Moon Card** (`src/pages/MyMoonCard.tsx:252`) and **MoonSignModal** (`src/components/MoonSignModal.tsx:65`) both read `moonSignDeepDiveContent[sign].archetype` from `moonSignContent.ts`. One source, two screens.
- **Library** (`src/pages/Library.tsx`, `ZodiacPortal.tsx`, `SignDetailPanel.tsx`) reads `zodiacDeepContent.ts`. Each sign has three titles: essence, shadow, ritual (for example Aries: The Primal Spark / The Wound of Invisibility / The Warrior's Release). The essence title is the closest match to an archetype name. This content is per sign, not Moon-specific.
- **Blueprint** (`src/components/BlueprintIdentity.tsx`) shows the title from `combination_profiles.combination_title`. That is a Sun + Moon pair name, not a Moon-sign name. If the title is missing, it falls back to the literal "The Sovereign".
- **Blueprint email** (`supabase/functions/send-blueprint-email/index.ts`) shows the same `combination_title`. It has no per-Moon-sign names.
- **Fallback generator** (`src/services/combinationService.ts`, `getArchetypeName`) is used if a DB row is missing. It builds names from element pairs: "Double X Sovereign", "Harmonic X Catalyst", "Electric Luminary", "Fertile Alchemist", "X-Y Integrator". It has no per-Moon-sign names.
- **Database** `combination_profiles` (144 rows, 12 per Moon sign): titles are Sun + Moon pair names written by the AI batch script `scripts/batch-generate-combinations.ts`. There is no per-Moon-sign name column.
- **Database** `moon_sign_library` (columns include `essence`, `shadow`, `ritual`, `sign_name`): not read by any app code. The public key is denied access. **Its contents were not checked** because that needs the service-role key, and that read was blocked in this session. It may hold a third set of names.
- **Social content / emails**: no Moon-sign archetype names found in `supabase/functions/_shared/channels.ts`, the social functions, or other email templates. The only hits for those words elsewhere were `dailyRitual.ts` ("The Warrior's Dawn"), a Scorpio-themed ritual title, and `innerCircleDictionary.ts` ("The Mystic Union"). Neither is a Moon-sign archetype.

### Overlaps and conflicts to know about

- Leo is "The Sovereign" on the Moon Card and "The Sovereign Heart" in the Library. 21 Blueprint titles also use "Sovereign". "Sovereign" is also the old internal name for the paid tier (now "Luminary" in visible copy).
- Aries is "The Warrior" on the Moon Card, but the Library's Aries ritual title is "The Warrior's Release".
- Sagittarius is "The Seeker" on the Moon Card and "The Eternal Seeker" in the Library, so these are close to the same name.
- Capricorn is "The Elder" on the Moon Card and "The Ancient Architect" in the Library. "Architect" appears in 47 of the 144 Blueprint titles.

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
