// Shared transit content generator for Moonday Live.
// Produces a single JSON package: blog, substack and reddit copy for one Moon ingress.
// Voice: warm, personable, quietly funny — a friend telling a friend about something
// they discovered. Entertainment only, never medical or predictive.

import { resolveSubredditRoute } from "./subredditRouting.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;


export interface TransitPackage {
  blog_content: string;
  reddit_content: string;
  facebook_content: string;
  instagram_content: string;
  threads_content: string;
  pinterest_content: string;
  twitter_content: string;
  /** Retired channel. Kept so older callers keep compiling. */
  substack_content: string;
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
The four pieces go to four different audiences and MUST read like four different writers had four different mornings.
- No shared opening line, opening image, or opening move. Compare your four first sentences before answering: if any two rhyme in structure or share a phrase, rewrite them.
- Only the blog may state the exact UTC instant. Facebook/Instagram refers to the shift by feel and by day. Reddit and Pinterest quote no timestamps at all.
- Each piece needs its own examples, its own metaphors, its own ending. Never recycle a sentence.
- Audience tuning: blog = search-led reader who wants a clear, useful explainer. Reddit = practising astrologers who want a technical tracking breakdown. Facebook/Instagram = a scrolling reader who wants today's emotional weather in a few breaths. Pinterest = a searcher scanning keywords on a pin.

Respond with a SINGLE JSON object and nothing else. No markdown fences. Exactly five keys:

"blog_content": A ~700-word deep-dive article in pure Markdown, titled "${title}" as an H1. Three structured sections, each an H2:

Astronomical baseline and atmospheric resonance — exact degrees, ingress timing, framework note, and what the shift actually feels like over the next ~2.5 days
Practical heads-up — underappreciated friction points to watch for, phrased constructively
Grounded guidance — simple practical ways to navigate the shift, including one small ritual

CTA (platform native): A soft closing paragraph, two to three sentences, worded like a friend who found something they're excited about. Invite the reader to explore their Personal Portrait on MoondayLive.com. No pricing, no urgency, never a sales pitch.

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

"facebook_content": Native Facebook caption, plain text, no markdown, no links inside the body. 90-150 words. Two to three short paragraphs separated by a blank line. First line under 12 words, survives the "see more" fold. One concrete mundane image. No timestamps, no degrees, no jargon.

CTA (platform native): Second to last line: a warm direct invitation freshly worded each time, with the full URL MoondayLive.com written plainly in the text. Final line: three to five lowercase hashtags including #moonin${toSign.toLowerCase()} and #moondaylive.

"instagram_content": Native Instagram caption, plain text, no markdown. 150-200 words. First line under 10 words, visually evocative, survives the "more" fold. Two to three short paragraphs. One concrete sensory image from the transit. Warm and aesthetic, slightly more poetic than Facebook but never vague.

CTA (platform native): Second to last line: "full reading at the link in our bio" or a fresh variation of that phrasing — never a raw URL, Instagram links don't work in captions. Final line: 10-15 lowercase hashtags mixing astrology community tags and mood tags, including #moondaylive and #moonin${toSign.toLowerCase()}.

"twitter_content": A single tweet, plain text, no markdown, under 260 characters to leave room for a link. Punchy and conversational. One concrete image or observation from the transit. No jargon, no degrees, no timestamps.

CTA (platform native): End with a space then the bare URL moondaylive.com as the final element before the hashtag. Final element: #moondaylive. Total must stay under 280 characters including the URL.

"threads_content": Native Threads post, plain text, no markdown, under 500 characters. Conversational and intimate, like a diary entry you decided to make public. One sharp observation about how this transit lands in daily life. No jargon, no timestamps, no degrees.

CTA (platform native): One casual closing line, freshly worded each time, something like "tracking this one over at MoondayLive.com if you want to follow along" — never a hard sell, always sounds like you mentioned it in passing. Ends with #moondaylive.

"pinterest_content": Native Pinterest pin, plain text, formatted exactly:

Line 1: pin title, search phrase under 60 characters, title case, naming the sign
Line 2: blank
Pin description, 200-450 characters total. One keyword-rich opening sentence, then 3-4 short lines each starting with • naming transit themes as scannable keyword phrases
Blank line
CTA (platform native): One closing line inviting the reader to track the transit live on MoondayLive.com — Pinterest users expect a destination, make it clear and direct
Final line: exactly three lowercase hashtags`;


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
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "gemini-2.0-flash",
      response_format: { type: "json_object" },
      // Higher temperature breaks the uniform, low-perplexity phrasing that AI
      // classifiers key on. (Frequency/presence penalties are rejected by the
      // Gemini models on the gateway, so cadence is enforced by the prompt.)
      temperature: 1.05,
      top_p: 0.95,

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
    reddit_content: humanize(parsed.reddit_content),
    facebook_content: humanize(parsed.facebook_content),
    instagram_content: humanize(parsed.instagram_content),
    threads_content: humanize(parsed.threads_content),
    pinterest_content: humanize(parsed.pinterest_content),
    twitter_content: humanize(parsed.twitter_content),
    substack_content: humanize(parsed.substack_content),
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

