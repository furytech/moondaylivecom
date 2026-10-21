import React from "react";
import { Sparkles, Sun, Moon } from "lucide-react";
import GlassmorphismCard from "./GlassmorphismCard";
import type { CombinationProfile } from "@/types";
import { safeLunarIntelligence } from "@/lib/safeLunar";

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export function getTriadStateNumber(
  sunSign?: string | null,
  moonSign?: string | null,
  transitSign?: string | null
): number | null {
  if (!sunSign || !moonSign || !transitSign) return null;
  const normalize = (s: string) =>
    ZODIAC_SIGNS.findIndex((sign) => sign.toLowerCase() === s.toLowerCase().trim());
  const si = normalize(sunSign);
  const mi = normalize(moonSign);
  const ti = normalize(transitSign);

  if (si === -1 || mi === -1 || ti === -1) return null;
  return si * 144 + mi * 12 + ti + 1;
}

interface BlueprintIdentityProps {
  profile: CombinationProfile | null;
  className?: string;
  currentMoonSign?: string | null;
  isPro?: boolean;
  /**
   * Render one part as its own card (the My Blueprint tab) instead of everything in one card.
   * "hero" is the combination title, shown once; the daily Triad number lives in <TriadStateLine /> on Today.
   */
  section?: "hero" | "strengths" | "synthesis" | "essence";
  /** Anchor id for the section (jump links) */
  sectionId?: string;
}

export const BlueprintIdentity: React.FC<BlueprintIdentityProps> = ({
  profile,
  className,
  currentMoonSign,
  isPro = true,
  section,
  sectionId,
}) => {
  if (!profile) return null;

  // Extract archetype display title and pairing subtitle
  let displayTitle =
    profile.combination_title ||
    (profile.sun_sign && profile.moon_sign
      ? `${profile.sun_sign} Sun · ${profile.moon_sign} Moon`
      : "Your Blueprint");
  let pairingSubtitle: string | null = null;

  if (displayTitle.includes("—")) {
    const parts = displayTitle.split("—").map((p) => p.trim());
    pairingSubtitle = parts[0];
    displayTitle = parts[1];
  } else if (profile.combination_title && profile.sun_sign && profile.moon_sign) {
    pairingSubtitle = `${profile.sun_sign} Sun • ${profile.moon_sign} Moon`;
  }

  const sunSign =
    profile.sun_sign ||
    (pairingSubtitle ? pairingSubtitle.split("Sun")[0]?.trim() : null);
  const moonSign =
    profile.moon_sign ||
    (pairingSubtitle ? pairingSubtitle.split("•")?.[1]?.replace("Moon", "")?.trim() : null);
  const transitSign = currentMoonSign || safeLunarIntelligence().data?.sign.name;
  const triadNumber = getTriadStateNumber(sunSign, moonSign, transitSign);

  // Parse luminous expression chips safely
  const traits: string[] = (() => {
    if (!profile.luminous_expression) return [];
    if (Array.isArray(profile.luminous_expression)) {
      return profile.luminous_expression.map((t) => String(t).trim()).filter(Boolean);
    }
    if (typeof profile.luminous_expression === "string") {
      return profile.luminous_expression
          .split(/[,·•|]/)
          .map((t) => t.trim())
          .filter(Boolean);
    }
    return [];
  })();

  // Split combination_synthesis into 2-sentence paragraph chunks
  const synthesisParagraphs: string[] = (() => {
    if (!profile.combination_synthesis) return [];
    // Normalize newlines following periods so ". " splitting works consistently
    const normalized = profile.combination_synthesis
      .replace(/\r\n/g, "\n")
      .replace(/\.\s*\n+/g, ". ")
      .replace(/\n+/g, " ");

    const sentences = normalized
      .split(". ")
      .map((s) => s.trim())
      .filter(Boolean);

    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2);
      const paragraphText = chunk
        .map((s) =>
          s.endsWith(".") || s.endsWith("!") || s.endsWith("?") ? s : `${s}.`
        )
        .join(" ");
      paragraphs.push(paragraphText);
    }
    return paragraphs;
  })();

  const eyebrow = (
    <div className="text-center mb-3">
      <p className="font-display text-xs text-primary/80 uppercase tracking-widest flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span>Natal Blueprint · Core Identity</span>
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </p>
    </div>
  );

  const triadHook = (
    <>
      {/* Dominant Triad Hook: Crisp gold (#c9a84c) without glow or blur */}
      <p
        className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight md:tracking-wide leading-tight mb-1"
        style={{ color: "#c9a84c" }}
      >
        ✦ {triadNumber !== null ? triadNumber.toLocaleString() : "401"} of 1,728 ✦
      </p>
      <p className="font-serif text-xs text-cream-muted/80 mb-2">
        Your natal Sun · your natal Moon · today's transiting Moon
      </p>
    </>
  );

  const rarityLine = (
    <p className="font-serif italic text-sm md:text-base text-cream-muted/90 mb-5 max-w-md mx-auto leading-relaxed text-left">
      Your combination exists in less than 0.06% of people
    </p>
  );

  const titleBlock = (
    <div className="pt-1">
      <p className="font-display text-xs uppercase tracking-[0.2em] text-primary/80 mb-1">
        Your Blueprint Identity
      </p>
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-wide mb-1 leading-tight break-words text-center"
        style={{ color: "#d4af37", textShadow: "0 0 22px rgba(212, 175, 55, 0.35)", textWrap: "balance" }}
      >
        {displayTitle}
      </h1>
      <p className="font-serif text-xs text-cream-muted/70 mb-2">
        Your Sun + Moon combination · 1 of 144
      </p>
      {pairingSubtitle && (
        <p className="font-display text-xs md:text-sm text-primary/70 tracking-widest uppercase">
          {pairingSubtitle}
        </p>
      )}
    </div>
  );

  // 2. luminous_expression: Horizontal row of trait chips
  const traitsBlock =
    traits.length > 0 ? (
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5 mb-8 max-w-2xl mx-auto">
        {traits.map((trait, index) => {
          const capitalized = trait ? trait.charAt(0).toUpperCase() + trait.slice(1) : "";
          return (
            <span
              key={index}
              className="px-4 py-2.5 rounded-xl text-left text-[15px] md:text-base font-sans font-normal normal-case leading-relaxed tracking-normal bg-primary/10 border border-primary/20 text-cream max-w-full"
            >
              {capitalized}
            </span>
          );
        })}
      </div>
    ) : null;

  // 3. combination_synthesis: Explicitly left-aligned paragraph chunks filling full width (Luminary only)
  const synthesisBlock =
    isPro && synthesisParagraphs.length > 0 ? (
      <div className="w-full mb-10 text-left !text-left" style={{ textAlign: "left", width: "100%" }}>
        {synthesisParagraphs.map((paragraph, index) => (
          <p
            key={index}
            className="w-full font-serif text-base md:text-lg text-cream-muted leading-relaxed not-italic font-normal text-left !text-left indent-0 !indent-0"
            style={{ marginBottom: "1.2em", textIndent: 0, textAlign: "left" }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    ) : null;

  // 4. solar_essence + lunar_essence: Side by side descriptors (Luminary only)
  const essenceBlock =
    isPro && (profile.solar_essence || profile.lunar_essence) ? (
      <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-primary/15">
        {profile.solar_essence && (
          <div className="rounded-xl p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
            <div className="flex items-center justify-center gap-2 mb-3 text-primary">
              <Sun className="w-4 h-4 text-primary" />
              <h2 className="font-display text-xs uppercase tracking-widest text-primary text-center">
                Natal Sun · Conscious Drive
              </h2>
            </div>
            <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left">
              {profile.solar_essence}
            </p>
          </div>
        )}

        {profile.lunar_essence && (
          <div className="rounded-xl p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
            <div className="flex items-center justify-center gap-2 mb-3 text-primary">
              <Moon className="w-4 h-4 text-primary" />
              <h2 className="font-display text-xs uppercase tracking-widest text-primary text-center">
                Natal Moon · Instinctual Sanctuary
              </h2>
            </div>
            <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed text-left">
              {profile.lunar_essence}
            </p>
          </div>
        )}
      </div>
    ) : null;

  if (section) {
    const heading = (text: string) => (
      <h2 className="font-display text-lg tracking-widest text-foreground uppercase text-center mb-5">{text}</h2>
    );
    if (section === "hero") {
      return (
        <GlassmorphismCard size="lg" className={className}>
          {eyebrow}
          <div className="text-center">
            {rarityLine}
            {titleBlock}
          </div>
        </GlassmorphismCard>
      );
    }
    if (section === "strengths") {
      return traitsBlock ? (
        <GlassmorphismCard size="md" flush className={className}>
          <div id={sectionId} className="scroll-mt-32">
            {heading("Strengths")}
            <div className="[&>div]:mb-0">{traitsBlock}</div>
          </div>
        </GlassmorphismCard>
      ) : null;
    }
    if (section === "synthesis") {
      return synthesisBlock ? (
        <GlassmorphismCard size="md" className={className}>
          <div id={sectionId} className="scroll-mt-32">
            {heading("Synthesis")}
            <div className="[&>div]:mb-0">{synthesisBlock}</div>
          </div>
        </GlassmorphismCard>
      ) : null;
    }
    return essenceBlock ? (
      <GlassmorphismCard size="md" flush className={className}>
        <div id={sectionId} className="scroll-mt-32">
          {heading("Essence")}
          <div className="[&>div]:pt-0 [&>div]:border-t-0">{essenceBlock}</div>
        </div>
      </GlassmorphismCard>
    ) : null;
  }

  return (
      <GlassmorphismCard size="lg" className={className}>
        {/* Header Eyebrow */}
        {eyebrow}

        {/* 1. Dominant Triad Hook & Identity Reveal */}
        <div className="text-center mb-6">
          {triadHook}

          {/* Line 2: Rarity text in smaller italic */}
          {rarityLine}

          {/* Archetype Name: Primary H1 identity reveal */}
          {titleBlock}
        </div>

        {traitsBlock}
        {synthesisBlock}
        {essenceBlock}
      </GlassmorphismCard>
  );
};

/**
 * Today's Triad state: your natal Sun, your natal Moon and today's transiting Moon, as one of 1,728. It changes
 * daily, so it belongs on the Today tab, not in the permanent identity.
 */
export const TriadStateLine: React.FC<{ sunSign?: string | null; moonSign?: string | null; transitSign?: string | null }> = ({
  sunSign,
  moonSign,
  transitSign,
}) => {
  const n = getTriadStateNumber(sunSign, moonSign, transitSign);
  if (n === null) return null;
  return (
    <div className="text-center">
      <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-amber-300">
        ✦ {n.toLocaleString()} of 1,728 ✦
      </p>
      <p className="font-serif text-xs text-cream-muted/80 text-center">Natal Sun · natal Moon · today's Moon</p>
    </div>
  );
};

export default BlueprintIdentity;
