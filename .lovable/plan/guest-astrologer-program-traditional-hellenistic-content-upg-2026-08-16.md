# Guest Astrologer Program + Traditional/Hellenistic Content Upgrade

## 30,000 feet

Two things get built, and they snap together:

1. **A vetted traditional/Hellenistic layer** so Saturn (and every planet) stops being an LLM cliché. Real dignity, sect, rulership and aspect logic computed from the ephemeris you already trust.
2. **A Guest Astrologer surface** — a private page where your astrologer talks or types his take, it gets transcribed, and it flows into that week's posts under a "Guest Astrologer" banner across Blog, Substack and Reddit.

The guest voice is the *authority*; the engine is the *scaffolding*. The AI only assembles — it never invents doctrine.

## The pieces, in order

### Piece 1 — Traditional chart context (no birth time needed)
A calculation module that outputs, for any given moment:
- Planet positions (already accurate via `astronomy-engine`)
- **Sect** — day chart vs night chart, and which planets are benefic/malefic *of the sect*
- **Essential dignity** — domicile, exaltation, detriment, fall, plus traditional triplicity/bounds
- **Aspects** — the seven classical planets only, whole-sign, traditional orbs
- **Whole-sign houses from the Moon** (Chandra Lagna) and from the Sun as a second lens — both valid without a birth time, both labeled honestly as such

This is deterministic math and traditional tables, not opinion. It replaces the free-association gap.

### Piece 2 — The doctrine lexicon
A structured, editable set of traditional meanings (planet in sign, planet by dignity, sect condition, classical aspect). Seeded from Hellenistic sources, then **corrected by your astrologer** — his edits are the source of truth. The generator must quote from it, never around it.

### Piece 3 — Guest Astrologer input surface
A dedicated page for invited astrologers (own login, no full admin access):
- **Talk it out** — record voice in the browser, auto-transcribed
- **Or type it** — a plain box, no formatting rules
- Pick the transit/week it belongs to
- Add a display name, one-line bio, optional photo
- Submit → lands in your Journal Admin as a pending guest contribution

### Piece 4 — Guest content in the pipeline
When a guest contribution exists for a transit:
- Generated copy is built *around* his words, not over them — his transcript is preserved as a pull-quote block
- Posts carry a **"Guest Astrologer this week — [Name]"** banner with his bio
- Substack and Reddit copy inherit the same attribution
- You still approve everything in the Journal Admin before anything goes out
- Telegram alerts you the moment a guest submits

### Piece 5 — Attribution and reuse
- Guest byline shown on the public blog post
- A running roster so returning guests don't re-enter their bio
- Contributions archived and searchable, so a strong Saturn take can be reused later with credit

## Technical notes

- Traditional calculations live alongside `src/lib/sovereignEngine.ts`; positions stay on `astronomy-engine`
- Voice → text uses the Lovable AI gateway speech-to-text; audio stored in a private bucket
- New tables: guest contributions, guest profiles, doctrine lexicon entries — all with row-level security so guests only see their own submissions
- `supabase/functions/_shared/transitContent.ts` prompt is rewritten: it receives the computed traditional context plus the guest transcript, and is instructed to reason only from those inputs
- Guest access is a new role in the existing `user_roles` table — no privilege escalation path to admin

## Sequencing

1. Traditional calculation module + verification against known charts
2. Doctrine lexicon, seeded and admin-editable
3. Generator rewrite to consume both
4. Guest submission page with voice + text
5. Guest banner and attribution across all three outlets
6. Telegram alert on guest submission

Steps 1–3 fix content quality immediately. Steps 4–6 open the door to guests.
