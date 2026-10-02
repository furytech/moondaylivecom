import React from "react";
import { Sparkles, Sun, Moon } from "lucide-react";
import GlassmorphismCard from "./GlassmorphismCard";
import type { CombinationProfile } from "@/types";

interface BlueprintIdentityProps {
  profile: CombinationProfile | null;
  className?: string;
}

export const BlueprintIdentity: React.FC<BlueprintIdentityProps> = ({
                                                                      profile,
                                                                      className,
                                                                    }) => {
  if (!profile) return null;

  // Extract archetype display title and pairing subtitle
  let displayTitle = profile.combination_title || "The Sovereign";
  let pairingSubtitle: string | null = null;

  if (displayTitle.includes("—")) {
    const parts = displayTitle.split("—").map((p) => p.trim());
    pairingSubtitle = parts[0];
    displayTitle = parts[1];
  } else if (profile.sun_sign && profile.moon_sign) {
    pairingSubtitle = `${profile.sun_sign} Sun • ${profile.moon_sign} Moon`;
  }

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

  return (
      <GlassmorphismCard size="lg" className={className}>
        {/* Header Eyebrow */}
        <div className="text-center mb-3">
          <p className="font-display text-xs text-primary/80 uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Natal Blueprint · Core Identity</span>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </p>
        </div>

        {/* 1. combination_title: Evocative identity label in gold */}
        <div className="text-center mb-4">
          <h2 className="font-display text-3xl md:text-5xl text-gold-gradient tracking-wide mb-2 leading-tight">
            {displayTitle}
          </h2>
          {pairingSubtitle && (
              <p className="font-display text-xs md:text-sm text-primary/70 tracking-widest uppercase">
                {pairingSubtitle}
              </p>
          )}
        </div>

        {/* 2. luminous_expression: Horizontal row of trait chips */}
        {traits.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5 mb-8 max-w-2xl mx-auto">
              {traits.map((trait, index) => (
                  <span
                      key={index}
                      className="px-3.5 py-1 rounded-full text-xs md:text-sm font-display tracking-wider uppercase bg-primary/10 border border-primary/20 text-cream"
                  >
              {trait}
            </span>
              ))}
            </div>
        )}

        {/* 3. combination_synthesis: Explicitly left-aligned paragraph chunks filling full width */}
        {synthesisParagraphs.length > 0 && (
            <div
                className="w-full mb-10 text-left !text-left"
                style={{ textAlign: "left", width: "100%" }}
            >
              {synthesisParagraphs.map((paragraph, index) => (
                  <p
                      key={index}
                      className="w-full font-serif text-xl md:text-2xl text-cream-muted leading-relaxed italic font-light text-left !text-left indent-0 !indent-0"
                      style={{
                        marginBottom: "1.2em",
                        textIndent: 0,
                        textAlign: "left",
                      }}
                  >
                    {paragraph}
                  </p>
              ))}
            </div>
        )}

        {/* 4. solar_essence + lunar_essence: Side by side descriptors */}
        {(profile.solar_essence || profile.lunar_essence) && (
            <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-primary/15">
              {profile.solar_essence && (
                  <div className="rounded-xl p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <Sun className="w-4 h-4 text-primary" />
                      <span className="font-display text-xs uppercase tracking-widest text-primary">
                  Natal Sun · Conscious Drive
                </span>
                    </div>
                    <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed">
                      {profile.solar_essence}
                    </p>
                  </div>
              )}

              {profile.lunar_essence && (
                  <div className="rounded-xl p-5 md:p-6 bg-navy-medium/30 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <Moon className="w-4 h-4 text-primary" />
                      <span className="font-display text-xs uppercase tracking-widest text-primary">
                  Natal Moon · Instinctual Sanctuary
                </span>
                    </div>
                    <p className="font-serif text-base md:text-lg text-cream-muted leading-relaxed">
                      {profile.lunar_essence}
                    </p>
                  </div>
              )}
            </div>
        )}
      </GlassmorphismCard>
  );
};

export default BlueprintIdentity;
