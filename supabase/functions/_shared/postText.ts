// Blog post text helpers: repeated-title detection, real excerpts, and UTC -> local time.
// Pure and import-free. supabase/functions/_shared/postText.ts is a byte-for-byte copy for the edge
// functions (src/test/postText.test.ts fails if they drift), so edit both together.

/** Fallback zone for served HTML and for readers whose zone is unknown (shown as "ET"). */
export const FALLBACK_ZONE = "America/New_York";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Strip markdown emphasis, heading marks and links down to plain text. */
function plain(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/, "")
    .replace(/[*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when `text` is the title, or close enough that showing both would repeat it. */
export function repeatsTitle(text: string | null | undefined, title: string | null | undefined): boolean {
  const a = norm(plain(text || ""));
  const b = norm(plain(title || ""));
  if (!a || !b) return false;
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 20 && long.includes(short) && short.length / long.length >= 0.75) return true;
  const wa = new Set(a.split(" "));
  const wb = new Set(b.split(" "));
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / Math.max(wa.size, wb.size) >= 0.8;
}

/**
 * Drop a leading heading or bold/plain first line that just repeats the title.
 * Only the first non-empty line is considered, and only when it is a single short line.
 */
export function stripLeadingTitle(content: string | null | undefined, title: string | null | undefined): string {
  const text = (content || "").replace(/^﻿/, "");
  const match = text.match(/^(\s*\n)*([^\n]*)(\n|$)/);
  if (!match) return text;
  const line = match[2];
  const isHeading = /^\s{0,3}#{1,6}\s+\S/.test(line);
  const isBold = /^\s*(\*\*|__)[^*_]+(\*\*|__)\s*$/.test(line);
  const isPlain = line.trim().length > 0 && line.trim().length <= 160;
  if ((isHeading || isBold || isPlain) && repeatsTitle(line, title)) {
    return text.slice(match[0].length).replace(/^\s+/, "");
  }
  return text;
}


function validZone(tz?: string | null): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * "Sunday, Oct 18 at 9:39 PM" in the reader's zone. With no usable zone it is Eastern Time with an
 * "ET" suffix (served HTML); a UTC reader gets a "UTC" suffix so the clock is never ambiguous.
 */
export function formatInstant(input: Date | string, tz?: string | null): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  const zone = validZone(tz) ? tz : FALLBACK_ZONE;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const label = !validZone(tz) ? " ET" : zone === "UTC" ? " UTC" : "";
  return `${get("weekday")}, ${get("month")} ${get("day")} at ${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()}${label}`;
}

/** The calendar date of an instant in the reader's zone ("October 18, 2026"); ET when the zone is unknown. */
export function formatLocalDate(input: Date | string, tz?: string | null): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    timeZone: validZone(tz) ? tz : FALLBACK_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// "2026-10-19 at 01:39:50 UTC", "2026-10-19T01:39:50.237Z", "2026-10-19T01:39:50Z UTC".
// A UTC/Z marker is required, so a bare date or an unmarked clock time is never rewritten.
const UTC_STAMP =
  /(\d{4})-(\d{2})-(\d{2})(?:T|\s+at\s+|\s+)(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:\s*Z(?![A-Za-z0-9])(?:\s*UTC(?![A-Za-z]))?|\s*UTC(?![A-Za-z]))/g;

/** Rewrite UTC timestamps in prose as "Sunday, Oct 18 at 9:39 PM" in the given zone (ET when none). */
export function localizeUtcTimes(text: string, tz?: string | null): string {
  return (text || "").replace(UTC_STAMP, (m, y, mo, d, h, mi, s) => {
    const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, s ? +s : 0));
    return formatInstant(date, tz) || m;
  });
}

/** Opening paragraph of a markdown body as plain text (headings and a repeated title skipped). */
export function openingParagraph(content: string | null | undefined, title?: string | null): string {
  const body = stripLeadingTitle((content || "").replace(/^---[\s\S]*?---\s*/, ""), title);
  const blocks = body
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n")
    .split(/\n\s*\n/)
    .map((b) => plain(b))
    .filter((b) => b && !repeatsTitle(b, title));
  return blocks[0] || "";
}

/** Shorten to `max` characters on a word boundary. */
function clipWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:—-]+$/, "")}…`;
}

/**
 * A real 1-2 sentence summary (about 150-160 characters) from the opening paragraph.
 * Timestamps are shown in ET because an excerpt is stored once for every reader.
 */
export function excerptFromContent(content: string | null | undefined, title?: string | null, target = 160): string {
  const opening = localizeUtcTimes(openingParagraph(content, title));
  if (!opening) return "";
  const sentences = opening.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map((s) => s.trim()) ?? [opening];
  let out = sentences[0] || opening;
  if (out.length > target) return clipWords(out, target);
  for (const next of sentences.slice(1)) {
    if (`${out} ${next}`.length > target) break;
    out = `${out} ${next}`;
    if (out.length >= 150) break;
  }
  return out;
}

