// Shared transit content generator for Moonday Live.
// Produces a single JSON package: blog, substack and reddit copy for one Moon ingress.
// Voice: warm, personable, quietly funny — a friend telling a friend about something
// they discovered. Entertainment only, never medical or predictive.

export interface TransitPackage {
  blog_content: string;
  substack_content: string;
  reddit_content: string;
}

const VOICE = `You are the voice of Moonday Live — a luxury, editorial astrology brand written by an actual human with a pulse.

Voice rules:
- Personable and warm. Write like a smart friend texting you at midnight, not like an oracle on a mountain.
- Genuinely funny in a dry, self-aware way. Light jokes, small confessions, the occasional wink at how absurd it is that the Moon has opinions about our group chats. Never goofy, never emoji-stuffed, never punchline-hunting.
- Concrete and human: real situations (unanswered texts, the fridge at 11pm, the meeting that could have been an email), not vague cosmic fog.
- Grounded, never predictive, never medical, financial or legal advice. Entertainment and reflection only.
- Sentence case for all headings. No frontmatter, no code fences, no emojis in titles.
- Weave in "The Lunar Signature" naturally at most once.
- Every piece ends with a soft CTA to join Moonday Live worded like a note from a friend who found something they're excited about — an invitation, never a sales pitch. No pricing, no urgency, no "sign up now".
- Include one quiet, legal-safe line noting this is for entertainment and reflection.`;

// Detector-evasion is really just "write like a person". These are the tells
// Pangram/GPTZero-style classifiers score on: uniform sentence length, em-dash
// habit, tricolons, "It's not X, it's Y", stock LLM diction, tidy symmetry.
const HUMAN_CADENCE = `Human cadence (hard requirement — AI-detector tells to avoid):
- BURSTINESS: vary sentence length hard. Put a four-word sentence next to a thirty-word one. Use the occasional fragment. Start a sentence with And, But, So or Anyway when it sounds right.
- NO EM DASHES. None. Use commas, periods, parentheses or a colon instead. Also avoid the en-dash-as-aside habit.
- Ban the tricolon reflex ("clearer, calmer, kinder"). Two items, or four, or an awkward list that trails off. Never three balanced clauses.
- Ban the antithesis template: "It's not X, it's Y", "less X, more Y", "not because X, but because Y".
- Ban LLM diction: delve, tapestry, landscape, realm, navigate, unpack, resonate, embrace, journey, testament, "in a world where", "it's worth noting", "at its core", "the truth is", "here's the thing", "let's be honest", "that's the beauty of it".
- Ban the closing-summary reflex. Don't restate the piece in the last paragraph. End mid-thought, on a small image, on a question, or on something slightly off-topic.
- Don't open consecutive paragraphs with the same grammatical shape, and never open a paragraph with a gerund clause ("Standing there, ...").
- Specificity over abstraction: name an actual mundane thing (the 11:40pm text, the third tab of a spreadsheet, a bike lock, cold coffee). Invented personal detail is welcome. Vague emotional weather is not.
- Allow small human mess: a hedge, an aside in parentheses, a self-correction, an admission you're not sure. Perfect symmetry reads synthetic.
- Contractions everywhere. Occasional second person. First person where it fits.
- Never use bold for emphasis inside prose, and never use a rhetorical question as a section opener twice.`;


export interface GuestVoice {
  displayName: string;
  bio?: string | null;
  /** The astrologer's own words — transcript or typed text. Never paraphrased away. */
  text: string;
}

export interface GenerationSources {
  /** Deterministic traditional condition of the sky, from formatTraditionalBrief(). */
  traditionalBrief?: string;
  /** Vetted doctrine lines the model must reason from instead of free-associating. */
  doctrine?: string[];
  guest?: GuestVoice | null;
}

const DOCTRINE_RULES = `Doctrinal discipline (non-negotiable):
- You are writing in the TRADITIONAL / HELLENISTIC idiom. Use only the seven visible planets, whole-sign houses, essential dignity, sect, and the five Ptolemaic aspects.
- Never assign modern rulerships (no Uranus/Neptune/Pluto as sign lords) and never invent psychological archetypes.
- Saturn is a boundary-setter and time-lord, not a punisher. Read it through sect: of the sect by day it structures; contrary to the sect by night it bites. Never write Saturn as generic doom.
- Every astrological claim you make must be traceable to the CHART CONDITION or the VETTED DOCTRINE supplied below. If the material does not support a claim, leave it out.
- You may describe how something feels; you may not predict events, outcomes, health, money or legal matters.`;

function guestBlock(guest?: GuestVoice | null): string {
  if (!guest?.text?.trim()) return "";
  return `
GUEST ASTROLOGER — this week's contributor is ${guest.displayName}${guest.bio ? ` (${guest.bio})` : ""}.
Their own words follow between the markers. Treat them as the authority for this edition:

<<<GUEST
${guest.text.trim()}
GUEST>>>

Guest handling rules:
- Build the piece AROUND their take. Do not contradict it, water it down, or restate it in your own voice as if it were yours.
- Quote at least one substantial passage of their words verbatim as a Markdown blockquote, lightly cleaned of filler ("um", false starts) only.
- Open the piece by naming them: this week Moonday Live has a guest astrologer, and this is their reading.
- Attribute clearly: their interpretations are theirs; the house/dignity framing is the engine's.
`;
}

export function buildTransitPrompt(
  fromSign: string,
  toSign: string,
  transitionAtUtc: string,
  title: string,
  sources: GenerationSources = {},
): string {
  return `Write a complete lunar transit package for the upcoming shift.

Current Sign: ${fromSign}
Next Sign: ${toSign}
Exact ingress: ${transitionAtUtc} UTC
Transit Title: "${title}"

${DOCTRINE_RULES}

${HUMAN_CADENCE}

CHART CONDITION (computed from the ephemeris — treat as fact):
${sources.traditionalBrief ?? "(not supplied — keep astrological specifics to the Moon's sign change only)"}

VETTED DOCTRINE (approved by our astrologer — quote its sense, not its wording):
${sources.doctrine?.length ? sources.doctrine.map((d) => `- ${d}`).join("\n") : "(none supplied)"}
${guestBlock(sources.guest)}


CHANNEL SEPARATION (hard requirement — violating this makes the output unusable):
The three pieces go to three different audiences and MUST read like three different writers had three different mornings.
- No shared opening line, opening image, or opening move. Compare your three first sentences before answering: if any two rhyme in structure or share a phrase, rewrite them.
- Do NOT repeat the ingress timestamp sentence ("On <date>, at precisely <time> UTC, the Moon...") in more than one piece. Only the blog may state the exact UTC instant. Substack refers to the shift by feel and by day. Reddit doesn't quote timestamps at all.
- Each piece needs its own examples, its own metaphors, its own ending. Never recycle a sentence.
- Audience tuning: blog = search-led reader who wants a clear, useful explainer. Substack = subscriber who already gets it and wants an essay about the culture-wide weather. Reddit = a skeptical, low-patience feed reader who hates marketing and smells AI instantly.

Respond with a SINGLE JSON object and nothing else. No markdown fences. Exactly three keys:

"blog_content": A ~700-word deep-dive article in pure Markdown, titled "${title}" as an H1. This is the only piece allowed to name the exact ingress instant. Three structured sections, each an H2:
  a) Astronomical baseline and atmospheric resonance — what the shift actually feels like emotionally and mentally over the next ~2.5 days.
  b) Practical heads-up — underappreciated friction points to watch for, phrased constructively (over-analysis, emotional withdrawal, the urge to reorganize your entire life at 2am).
  c) Grounded guidance — simple, practical ways to navigate the shift, including one small ritual.
  Close with a soft, quiet invitation to explore their Personal Portrait on MoondayLive.com, written like a friend sharing a find.

"substack_content": A standalone, long-form newsletter edition of AT LEAST 800 words in Markdown. This is NOT a summary or restatement of "blog_content" — it must be a completely distinct reading experience with its own title (H1), its own structure, and its own examples. Open somewhere else entirely: an observation, a scene, a small confession, a question — never with the date or the ingress announcement. Anyone who read the website article should still find this worth reading.
  Editorial focus — the macro astro-climate:
  a) Read the world weather, not the individual. What does this specific Moon shift do to the collective mood: the pace of conversations, what people have patience for, what the culture leans toward or recoils from over these ~2.5 days.
  b) Societal and cultural pacing — how public discourse, work rhythms, media cycles, group decisions and social dynamics tend to tilt under this atmosphere. Concrete and observational, never political, never predictive about real events, never naming real people or organizations.
  c) The undercurrent — the quieter social dynamic underneath the surface mood, and what it asks of a room, a team, a family, a timeline.
  Use H2 sections with sentence-case headings. Keep the dry, warm, human voice.
  CTA — read this carefully: end every edition with a warm, conversational invitation that PIVOTS from the macro world-weather to the reader's own micro/personal picture, pointing them to MoondayLive.com to explore their Personal Portrait. You MUST invent a fresh CTA every single time: vary its length, its structure, its opening move, its angle and its rhythm. Sometimes a single offhand line, sometimes a short paragraph, sometimes a question, sometimes a small confession, sometimes an aside mid-thought before signing off. Never reuse a template, never open the CTA the same way twice, never use sales language, urgency, pricing or the phrase "sign up". It should read like a person who happens to have built the thing mentioning it because it's genuinely relevant right now. Zero AI footprint.

"reddit_content": A short, TL;DR-first self-post for r/moondaylive. Reddit is not a blog: people scan, downvote anything that smells like marketing or AI, and reward plain speech plus a real question.
  Hard format (follow exactly):
  Line 1 — the post title: 6-12 words, lowercase-leaning, plain, observation or curiosity led. No "The Moon Enters X:" formula, no colon-subtitle, no markdown heading, no "Title:" prefix, and NOT the blog title.
  Line 2 — blank.
  Line 3 — "TL;DR: " then ONE sentence (max ~25 words) saying what the shift is and what it feels like, in normal words.
  Line 4 — blank.
  Then 2-4 short sentences of body, ~60-90 words total, broken where a person would break lines.
  Then a blank line and one genuine open question to the sub.
  Reddit composition rules (non-negotiable):
  - No headings, no bold, no bullet lists, no em dashes, no timestamps, no dates, no UTC, no links, no CTA, no brand pitch, no "join us".
  - At most ONE offhand mention that Moonday Live is where you track this, only if it reads like a person mentioning their own project. Leaving it out entirely is fine and usually better.
  - No jargon dumping (no "cadent", "domicile", "sect light") — say it the way you'd say it out loud.
  - Never open with the ingress announcement, and never reuse a sentence, image or opening move from the blog or substack pieces.
  - Total length including the title: under 140 words. If it runs longer, cut it.`;
}

export async function generateTransitPackage(opts: {
  apiKey: string;
  fromSign: string;
  toSign: string;
  transitionAtUtc: string;
  title: string;
  model?: string;
  sources?: GenerationSources;
}): Promise<TransitPackage> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3.6-flash",
      response_format: { type: "json_object" },
      // Higher temperature + penalties break the uniform, low-perplexity phrasing
      // that AI classifiers key on.
      temperature: 1.05,
      top_p: 0.95,
      frequency_penalty: 0.35,
      presence_penalty: 0.3,
      messages: [
        { role: "system", content: VOICE },
        {
          role: "user",
          content: buildTransitPrompt(
            opts.fromSign,
            opts.toSign,
            opts.transitionAtUtc,
            opts.title,
            opts.sources ?? {},
          ),
        },
      ],

    }),
  });

  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";

  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: Partial<TransitPackage>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("AI returned non-JSON content");
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  return {
    blog_content: humanize(parsed.blog_content),
    substack_content: humanize(parsed.substack_content),
    reddit_content: humanize(parsed.reddit_content),
  };
}

/**
 * Last-mile scrub of the mechanical tells the model still slips in.
 * Em/en dashes are the single loudest signal in detector heuristics.
 */
export function humanize(input: unknown): string {
  return String(input ?? "")
    .replace(/\s+—\s+/g, ", ")
    .replace(/\s+–\s+/g, ", ")
    .replace(/—/g, ", ")
    .replace(/(\w)–(\w)/g, "$1-$2")
    .replace(/\bdelve\b/gi, "dig")
    .replace(/\btapestry\b/gi, "mix")
    .replace(/,\s*,/g, ",")
    .trim();
}

