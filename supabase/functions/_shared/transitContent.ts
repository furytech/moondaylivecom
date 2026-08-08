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

export function buildTransitPrompt(
  fromSign: string,
  toSign: string,
  transitionAtUtc: string,
  title: string,
): string {
  return `Write a complete lunar transit package for the upcoming shift.

Current Sign: ${fromSign}
Next Sign: ${toSign}
Exact ingress: ${transitionAtUtc} UTC
Transit Title: "${title}"

Respond with a SINGLE JSON object and nothing else. No markdown fences. Exactly three keys:

"blog_content": A ~700-word deep-dive article in pure Markdown, titled "${title}" as an H1. Three structured sections, each an H2:
  a) Astronomical baseline and atmospheric resonance — what the shift actually feels like emotionally and mentally over the next ~2.5 days.
  b) Practical heads-up — underappreciated friction points to watch for, phrased constructively (over-analysis, emotional withdrawal, the urge to reorganize your entire life at 2am).
  c) Grounded guidance — simple, practical ways to navigate the shift, including one small ritual.
  Close with a soft, quiet invitation to explore their Personal Portrait on MoondayLive.com, written like a friend sharing a find.

"substack_content": A standalone, long-form newsletter edition of AT LEAST 800 words in Markdown. This is NOT a summary or restatement of "blog_content" — it must be a completely distinct reading experience with its own title (H1), its own structure, and its own examples. Anyone who read the website article should still find this worth reading.
  Editorial focus — the macro astro-climate:
  a) Read the world weather, not the individual. What does this specific Moon shift do to the collective mood: the pace of conversations, what people have patience for, what the culture leans toward or recoils from over these ~2.5 days.
  b) Societal and cultural pacing — how public discourse, work rhythms, media cycles, group decisions and social dynamics tend to tilt under this atmosphere. Concrete and observational, never political, never predictive about real events, never naming real people or organizations.
  c) The undercurrent — the quieter social dynamic underneath the surface mood, and what it asks of a room, a team, a family, a timeline.
  Use H2 sections with sentence-case headings. Keep the dry, warm, human voice.
  CTA — read this carefully: end every edition with a warm, conversational invitation that PIVOTS from the macro world-weather to the reader's own micro/personal picture, pointing them to MoondayLive.com to explore their Personal Portrait. You MUST invent a fresh CTA every single time: vary its length, its structure, its opening move, its angle and its rhythm. Sometimes a single offhand line, sometimes a short paragraph, sometimes a question, sometimes a small confession, sometimes an aside mid-thought before signing off. Never reuse a template, never open the CTA the same way twice, never use sales language, urgency, pricing or the phrase "sign up". It should read like a person who happens to have built the thing mentioning it because it's genuinely relevant right now. Zero AI footprint.

"reddit_content": A ~100-word casual, low-noise atmospheric check-in for r/moondaylive. Plain title line first (no "Title:" prefix, no markdown heading), blank line, then the body. Conversational, minimal formatting, no links, no sales language, ends with one genuine open question and a light, offhand mention that Moonday Live is where you track this stuff.`;
}

export async function generateTransitPackage(opts: {
  apiKey: string;
  fromSign: string;
  toSign: string;
  transitionAtUtc: string;
  title: string;
  model?: string;
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
      messages: [
        { role: "system", content: VOICE },
        {
          role: "user",
          content: buildTransitPrompt(
            opts.fromSign,
            opts.toSign,
            opts.transitionAtUtc,
            opts.title,
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
    blog_content: String(parsed.blog_content ?? "").trim(),
    substack_content: String(parsed.substack_content ?? "").trim(),
    reddit_content: String(parsed.reddit_content ?? "").trim(),
  };
}
