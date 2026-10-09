// Shared transit content generator for Moonday Live.
// Produces a single JSON package: blog, substack, and social copy for one Moon ingress.
// Voice: warm, personable, quietly funny — a friend telling a friend about something
// they discovered. Entertainment only, never medical or predictive.

import { resolveSubredditRoute } from "./subredditRouting.ts";

const GEMINI_API_KEY = typeof Deno !== "undefined" ? Deno.env.get("GEMINI_API_KEY") : undefined;

export interface TransitPackage {
  blog_content: string;
  substack_content: string;
  reddit_content: string;
  facebook_content: string;
  instagram_content: string;
  threads_content: string;
  pinterest_content: string;
  twitter_content: string;
}

const TRUTHFULNESS = `Truthfulness (hard requirement, applies to every channel):
- You are an editorial voice, not a person with a life. Never claim an experience, event, conversation, body sensation, test or observation as your own. No "I tried", "I noticed", "my own check", "my digestion", "yesterday I", "last week I", "when I...".
- First person ("I think", "I'm not sure", "I suspect") is allowed ONLY for opinions and honest uncertainty about the astrology, never for things that happened to you.
- Relatable scenes must be framed as shared or general ("there's a particular kind of paralysis that shows up at the mailbox") or in second person ("you open the fridge at 11pm"), never as your own history.
- Never invent statistics, studies, quotes, reader reports or community results. Every astrological claim must come from the CHART CONDITION or VETTED DOCTRINE supplied.`;

const VOICE = `You are the voice of Moonday Live — a luxury, editorial astrology brand with a distinct, warm, quietly funny editorial voice.

Product context (know this cold — it shapes every CTA and every framing choice):
- Moonday maps three layers of the sky: the natal sun sign, the natal moon sign, and the current transiting moon sign.
- Together they form a Triad — one of 1,728 unique daily operating states. Every person is living one of these 1,728 states right now, whether they know it or not.
- The Blueprint is the fixed natal layer — a person's natal sun + natal moon combination. There are 144 Blueprints. It is free.
- The Triad Activation is the personalized daily reading — how the current sky moves through a person's specific Blueprint. It is the paid Luminary tier.
- Never call Moonday a horoscope app. It is a personalized lunar intelligence system.
- CTAs reference the Blueprint (free offer) or the Triad (paid offer). Never just "the website." The free offer: discover which of 1,728 combinations you are. The paid offer: see how today's sky moves through your specific combination.

Voice rules:
- Personable and warm. Write like a smart friend texting you at midnight, not like an oracle on a mountain.
- Genuinely funny in a dry, self-aware way. Light jokes, small admissions of uncertainty about the astrology itself, the occasional wink at how absurd it is that the Moon has opinions about our group chats. Never goofy, never emoji-stuffed, never punchline-hunting.
- Concrete and human: real situations (unanswered texts, the fridge at 11pm, the meeting that could have been an email), not vague cosmic fog.
- Grounded, never predictive, never medical, financial or legal advice. Entertainment and reflection only.
- Sentence case for all headings. No frontmatter, no code fences, no emojis in titles.
- Weave in "The Lunar Signature" naturally at most once.
- Every piece ends with a CTA worded like a note from a friend who found something they're excited about — an invitation, never a sales pitch. Reference the Blueprint or Triad specifically. No pricing, no urgency, no "sign up now".
- Include one quiet, legal-safe line noting this is for entertainment and reflection.

${TRUTHFULNESS}`;

const HUMAN_CADENCE = `Human cadence (hard requirement — AI-detector tells to avoid):
- BURSTINESS: vary sentence length hard. Put a four-word sentence next to a thirty-word one. Use the occasional fragment. Start a sentence with And, But, So or Anyway when it sounds right.
- NO EM DASHES. None. Use commas, periods, parentheses or a colon instead. Also avoid the en-dash-as-aside habit.
- Ban the tricolon reflex ("clearer, calmer, kinder"). Two items, or four, or an awkward list that trails off. Never three balanced clauses.
- Ban the antithesis template: "It's not X, it's Y", "less X, more Y", "not because X, but because Y".
- Ban LLM diction: delve, tapestry, landscape, realm, navigate, unpack, resonate, embrace, journey, testament, "in a world where", "it's worth noting", "at its core", "the truth is", "here's the thing", "let's be honest", "that's the beauty of it".
- Ban the closing-summary reflex. Don't restate the piece in the last paragraph. End mid-thought, on a small image, on a question, or on something slightly off-topic.
- Don't open consecutive paragraphs with the same grammatical shape, and never open a paragraph with a gerund clause ("Standing there, ...").
- Specificity over abstraction: name an actual mundane thing (the 11:40pm text, the third tab of a spreadsheet, a bike lock, cold coffee). Present mundane details as shared, general situations, never as things that happened to the writer. Vague emotional weather is not welcome.
- Allow small human mess: a hedge, an aside in parentheses, a self-correction, an admission you're not sure. Perfect symmetry reads synthetic.
- Contractions everywhere. Occasional second person. First person only for opinions and uncertainty, never for events.
- Never use bold for emphasis inside prose, and never use a rhetorical question as a section opener twice.`;

export interface GuestVoice {
  displayName: string;
  bio?: string | null;
  text: string;
}

export interface GenerationSources {
  traditionalBrief?: string;
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
The pieces go to distinct audiences and platforms. Each platform field must be written natively, never copy-pasted. Every channel MUST read like a different writer had a different morning.
- No shared opening line, opening image, or opening move. Compare your opening sentences across all platforms before answering: if any two rhyme in structure or share a phrase, rewrite them.
- Only the blog may state the exact UTC instant. Facebook/Instagram refers to the shift by feel and by day. Reddit, Twitter, Threads, and Pinterest quote no timestamps at all.
- Each piece needs its own examples, its own metaphors, its own ending. Never recycle a sentence across platforms.
- Audience and platform tuning:
  - blog = search-led reader who wants a clear, useful explainer; ends with Blueprint CTA.
  - substack = editorial reader who wants depth and philosophy; introduces the Triad concept; ends with Blueprint CTA.
  - reddit = practising astrologers who want a technical tracking breakdown.
  - facebook = conversational scrolling reader, 3-4 paragraphs, link and hashtags at end.
  - instagram = visual and emotional, 4-5 sentences, 15-20 hashtags, link in bio reference.
  - pinterest = descriptive and search-optimized, keyword-rich, direct link to moondaylive.com.
  - twitter = punchy, max 280 characters, 2-3 hashtags, link.
  - threads = conversational, 2-3 sentences, minimal hashtags.

Respond with a SINGLE JSON object and nothing else. No markdown fences. Exactly eight keys:

"blog_content": A ~700-word deep-dive article in pure Markdown, titled "${title}" as an H1. Three structured sections, each an H2:

Astronomical baseline and atmospheric resonance — exact degrees, ingress timing, framework note, and what the shift actually feels like over the next ~2.5 days
Practical heads-up — underappreciated friction points to watch for, phrased constructively
Grounded guidance — simple, practical ways to navigate the shift phrased as conscious choices rather than prescriptions. No rituals.

CTA (platform native): A soft closing paragraph, two to three sentences. Invite the reader to discover their free Blueprint at moondaylive.com — their natal sun and moon combination, and which of 1,728 states they occupy right now. Word it like a friend who found something genuinely useful. No pricing, no urgency.

"substack_content": Editorial Substack post, 600-900 words, Markdown. H1 title. This is the philosophy layer — personal, essayistic, reflective. Not a transit explainer but a deeper meditation on what this transit reveals about human experience.

Structure:
- Open with a small, relatable scene or observation, told in second person or as a general truth ("There's a particular kind of paralysis at the mailbox..."), never as something that happened to the writer. Not the ingress timing. Not "the Moon enters X today." Start somewhere human and specific.
- Build into what this transit is really about — the emotional or psychological texture of it, not just the astrological mechanics.
- Introduce the idea that not everyone experiences this transit identically. Your natal moon determines the angle at which the current sky hits you. A Scorpio transit moving through a Cancer moon feels different than it moving through an Aries moon. This variance is the core of what Moonday tracks.
- Name the Triad concept naturally: the intersection of your natal sun, your natal moon, and the current transiting moon creates one of 1,728 unique operating states. Most astrology hands everyone the same reading. Moonday doesn't.
- End with an invitation to get the free Blueprint at moondaylive.com. Not a pitch. A recommendation from someone who thinks this matters. Two to three sentences max.

Voice: More personal than the blog. First person only for opinions and honest uncertainty ("I think", "I'm not sure"), never for events or experiences. This is where Moonday's editorial voice lives most fully. End on a small image, a question, or something slightly unresolved — never a tidy summary.

"reddit_content": A community discussion thread for r/${resolveSubredditRoute(toSign).subreddit}. Register: ${resolveSubredditRoute(toSign).register}. Focus on physical body tracking: gut, heart, head, and how this ingress tends to show up in that chain.

Hard format:

Line 1: post title, 6-14 words, plain, states what is being tracked. No "The Moon Enters X:" formula, no colon-subtitle, no markdown, no "Title:" prefix
Line 2: blank
Line 3: "TL;DR: " then one sentence, max 28 words, naming the ingress and the single most testable body signal to watch
Line 4: blank
Body: 3-5 short sentences, ~90-130 words. Sign condition, ruler and its state, gut/heart/head read. Use dignity, reception, applying/separating, void course vocabulary correctly but never define it
Blank line
CTA (platform native): One genuine open question inviting the community to compare what they are noticing in their own body this window. The piece MUST end on that question. Zero promotional language. No links. Reddit norms apply hard here.

No headings, no bold, no bullets, no em dashes, no UTC timestamps, no dates, no hype. Total length including title: under 180 words.

"facebook_content": Native Facebook post, plain text, no markdown. Conversational tone, structured into exactly 3-4 short paragraphs separated by a blank line. No links inside the body text. First line under 12 words, survives the "see more" fold. One concrete mundane image. No timestamps, no degrees, no astrology jargon.

Ending (platform native): Link and hashtags placed strictly at the end.
- Second to last line: a warm direct invitation referencing the Blueprint or Triad — freshly worded each time — with the full URL https://moondaylive.com written plainly in the text.
- Final line: three to five lowercase hashtags including #moonin${toSign.toLowerCase()} and #moondaylive.

"instagram_content": Native Instagram caption, plain text, no markdown. Visual and emotional tone. Exactly 4-5 sentences total across 2-3 short paragraphs. First line under 10 words, visually evocative, survives the "more" fold. One concrete sensory image from the transit. Warm, aesthetic, and evocative, slightly more poetic than Facebook but grounded and never vague.

Ending (platform native):
- Second to last line: clear "link in bio" reference (e.g. "Find your Blueprint at the link in our bio" or a fresh variation — NEVER an active/raw URL, Instagram links do not work in captions).
- Final line: heavy hashtags, exactly 15-20 lowercase hashtags mixing astrology community tags, sign tags, and mood tags, including #moondaylive and #moonin${toSign.toLowerCase()}.

"twitter_content": A single tweet, plain text, no markdown. Punchy and conversational, one concrete image or observation from the transit. No jargon, no degrees, no timestamps.

Length and Link: Maximum 280 characters total (CRITICAL HARD LIMIT: count characters carefully including the URL and hashtags; must stay strictly under 280 characters total). Include link https://moondaylive.com and exactly 2-3 hashtags including #moondaylive and #moonin${toSign.toLowerCase()}.

"threads_content": Native Threads post, plain text, no markdown. Conversational tone, like Instagram but shorter and intimate, like a diary entry or quick thought you decided to post. Exactly 2-3 sentences total. One sharp observation about how this transit lands in daily life. No jargon, no timestamps, no degrees.

CTA and hashtags: One casual closing mention referencing moondaylive.com. Minimal hashtags (at most 1 hashtag: #moondaylive, or zero).

"pinterest_content": Native Pinterest pin, plain text, descriptive and search-optimized, keyword-rich, formatted exactly:

Line 1: pin title, search phrase under 60 characters, title case, naming the sign (e.g. "Moon in ${toSign} Transit Guide & Meaning")
Line 2: blank
Pin description: 200-450 characters total. Descriptive, search-optimized, keyword-rich opening sentence, followed by 3-4 short lines each starting with a bullet naming transit themes as scannable keyword phrases.
Blank line
CTA (platform native): One direct closing line with a direct link to moondaylive.com (e.g. "Discover your Blueprint and track this transit live at https://moondaylive.com").
Final line: 3-5 lowercase search hashtags including #moonin${toSign.toLowerCase()} and #moondaylive.`;
}

// Phrases that signal an invented first-person experience. "I think / I'm not sure"
// style opinions are deliberately NOT matched.
const INVENTED_EXPERIENCE_PATTERNS: RegExp[] = [
  /\bmy own\b/i,
  /\bin my (own )?experience\b/i,
  /\bmy (digestion|stomach|gut|jaw|body|week|morning|day|friend|partner|sister|brother|mother|mom|dad|therapist|clients?|readers?)\b/i,
  /\b(yesterday|last (night|week|month|year)|this morning|the other day|earlier today)\b[^.!?\n]{0,80}\bI\b/i,
  /\bI\b[^.!?\n]{0,60}\b(yesterday|last (night|week|month|year)|this morning|the other day)\b/i,
  /\bI(?:'ve| have)\s+(been|noticed|tracked|found|learned|watched|tried|seen)\b/i,
  /\bI\s+(spent|tried|noticed|tracked|woke|sat|stood|stared|watched|realized|realised|went|walked|called|texted|ran|checked|burned|burnt|cried|laughed|forgot|opened|ate|drank|slept)\b/i,
  /\bwhen I (try|tried|do|did|over|forget|forgot)\b/i,
];

function findInventedExperience(pkg: TransitPackage): string[] {
  const hits: string[] = [];
  for (const [channel, text] of Object.entries(pkg)) {
    for (const re of INVENTED_EXPERIENCE_PATTERNS) {
      const m = String(text).match(re);
      if (m) hits.push(`${channel}: "${m[0].trim()}"`);
    }
  }
  return hits;
}

const MAX_ATTEMPTS = 3;

export async function generateTransitPackage(
    opts: Parameters<typeof requestPackage>[0],
): Promise<TransitPackage> {
  let correction = "";
  let lastHits: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const pkg = await requestPackage({ ...opts, correction });
    const hits = findInventedExperience(pkg);
    if (hits.length === 0) return pkg;
    lastHits = hits;
    console.warn(`Truthfulness check failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${hits.join("; ")}`);
    correction =
        `\n\nREWRITE REQUIRED: your previous draft broke the Truthfulness rule with these phrases: ${hits.join("; ")}. ` +
        `Rewrite the entire package with none of them. No invented first-person events, experiences or body reports in any channel.`;
  }
  throw new Error(`Truthfulness check failed after ${MAX_ATTEMPTS} attempts: ${lastHits.join("; ")}`);
}

async function requestPackage(opts: {
  apiKey?: string;
  fromSign: string;
  toSign: string;
  transitionAtUtc: string;
  title: string;
  model?: string;
  sources?: GenerationSources;
  correction?: string;
}): Promise<TransitPackage> {
  const apiKey =
      (typeof Deno !== "undefined" ? Deno.env.get("GEMINI_API_KEY") : undefined) ||
      opts.apiKey ||
      (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined) ||
      GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = opts.model ?? "gemini-3.1-flash-lite";

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 1.05,
      top_p: 0.95,
      max_tokens: 6000,
      messages: [
        { role: "system", content: VOICE },
        {
          role: "user",
          content:
              buildTransitPrompt(
                  opts.fromSign,
                  opts.toSign,
                  opts.transitionAtUtc,
                  opts.title,
                  opts.sources ?? {},
              ) + (opts.correction ?? ""),
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";

  let parsed: Partial<TransitPackage> = {};
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`AI returned non-JSON content: ${raw.slice(0, 200)}`);
  }

  const jsonStr = raw.slice(start, end + 1);
  try {
    parsed = JSON.parse(jsonStr);
  } catch (_e) {
    const cleanedJson = jsonStr.replace(/,\s*([}\]])/g, "$1");
    parsed = JSON.parse(cleanedJson);
  }

  return {
    blog_content: humanize(parsed.blog_content),
    substack_content: humanize(parsed.substack_content),
    reddit_content: humanize(parsed.reddit_content),
    facebook_content: humanize(parsed.facebook_content),
    instagram_content: humanize(parsed.instagram_content),
    threads_content: humanize(parsed.threads_content),
    pinterest_content: humanize(parsed.pinterest_content),
    twitter_content: enforceTweetLength(humanize(parsed.twitter_content)),
  };
}

export function enforceTweetLength(tweet: string): string {
  if (!tweet || tweet.length <= 280) return tweet;
  const urlIdx = tweet.indexOf("http");
  if (urlIdx !== -1) {
    const textPart = tweet.slice(0, urlIdx).trim();
    const urlAndTags = tweet.slice(urlIdx).trim();
    const available = 280 - urlAndTags.length - 1;
    if (available > 20) {
      return `${textPart.slice(0, available - 3)}... ${urlAndTags}`;
    }
  }
  return tweet.slice(0, 277) + "...";
}

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
