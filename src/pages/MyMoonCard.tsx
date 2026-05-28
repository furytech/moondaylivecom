import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { Button } from "@/components/ui/button";
import { Download, Share2, Twitter, Facebook, Instagram } from "lucide-react";
import { moonSignDeepDiveContent } from "@/lib/moonSignContent";
import { toast } from "@/hooks/use-toast";

// Update once the community goes live.
const REDDIT_URL = "https://www.reddit.com/r/MoondayLive/";
const SITE_URL = "https://moondaylive.com";

export default function MyMoonCard() {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [moonSign, setMoonSign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login?from=/my-moon-card");
        return;
      }
      const { data } = await supabase
        .from("user_profiles")
        .select("moon_sign")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setMoonSign(data?.moon_sign ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  const dive = moonSign ? moonSignDeepDiveContent[moonSign] : null;

  const generatePng = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setRendering(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#011124",
      });
      return dataUrl;
    } finally {
      setRendering(false);
    }
  };

  const handleDownload = async () => {
    const url = await generatePng();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `moonday-${(moonSign ?? "moon").toLowerCase()}-sign.png`;
    a.click();
    toast({ title: "Image saved", description: "Share it anywhere — the link travels with the art." });
  };

  const shareText = dive
    ? `I am a ${dive.sign} Moon — ${dive.headline}. Find your moon sign at ${SITE_URL}`
    : `Find your moon sign at ${SITE_URL}`;

  const handleNativeShare = async () => {
    const url = await generatePng();
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `moonday-${moonSign}.png`, { type: "image/png" });
      // @ts-ignore — canShare/files is widely supported on mobile
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText, title: "My Moon Sign — Moonday Live" });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: shareText, title: "My Moon Sign — Moonday Live", url: SITE_URL });
        return;
      }
      // Desktop fallback: download
      handleDownload();
    } catch (e) {
      // user cancelled — silent
    }
  };

  const shareTwitter = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  const shareFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`, "_blank");
  const shareInstagram = async () => {
    await handleDownload();
    toast({
      title: "Image downloaded",
      description: "Open Instagram and post your card to your story or feed.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-sm text-cream-muted uppercase tracking-[0.4em]">Loading</p>
      </div>
    );
  }

  if (!moonSign || !dive) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center px-6 pt-[68px]">
          <GlassmorphismCard className="max-w-md text-center">
            <h1 className="font-display text-2xl text-gold-gradient mb-3">Your Moon Awaits</h1>
            <p className="font-serif text-cream-muted mb-6">
              Discover your moon sign first to unlock your shareable card.
            </p>
            <Button onClick={() => navigate("/blueprint")}>Go to Blueprint</Button>
          </GlassmorphismCard>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title="Your Moon Sign Card — Moonday Live"
        description="A shareable card revealing your moon sign — beautifully designed for socials."
        noindex
      />
      <Navigation />

      <main className="flex-1 flex flex-col items-center pt-[80px] pb-12 px-6 relative z-10">
        <div className="max-w-2xl w-full text-center mb-6">
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-2">
            Your Moon Sign Card
          </h1>
          <p className="font-serif text-base text-cream-muted">
            A keepsake to share — and to invite friends to discover theirs.
          </p>
        </div>

        {/* The card to be exported as PNG */}
        <div className="w-full flex justify-center mb-8">
          <div
            ref={cardRef}
            className="relative overflow-hidden"
            style={{
              width: 540,
              height: 720,
              background:
                "radial-gradient(ellipse at top, hsl(239 60% 22%) 0%, #011124 55%, #000814 100%)",
              borderRadius: 28,
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              padding: "56px 44px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
              color: "#F5E6C8",
            }}
          >
            {/* Decorative stars */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5 }}>
              {[...Array(40)].map((_, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    top: `${(i * 53) % 100}%`,
                    left: `${(i * 71) % 100}%`,
                    width: 2,
                    height: 2,
                    background: "#F5E6C8",
                    borderRadius: "50%",
                    opacity: 0.3 + ((i % 5) / 10),
                  }}
                />
              ))}
            </div>

            {/* Top brand mark */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.5em",
                  textTransform: "uppercase",
                  color: "hsl(239 84% 75%)",
                  marginBottom: 6,
                }}
              >
                Moonday Live
              </div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(245,230,200,0.55)",
                }}
              >
                The Lunar Signature
              </div>
            </div>

            {/* Glyph + sign */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  fontSize: 140,
                  lineHeight: 1,
                  color: "hsl(239 84% 75%)",
                  textShadow: "0 0 40px hsl(239 84% 67% / 0.5)",
                  marginBottom: 16,
                }}
              >
                {dive.symbol}
              </div>
              <div
                style={{
                  fontSize: 36,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#F5E6C8",
                  marginBottom: 8,
                  fontWeight: 300,
                }}
              >
                {dive.sign} Moon
              </div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "rgba(245,230,200,0.5)",
                  marginBottom: 24,
                }}
              >
                {dive.archetype} · {dive.element}
              </div>
              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.5,
                  fontStyle: "italic",
                  color: "rgba(245,230,200,0.92)",
                  maxWidth: 380,
                  margin: 0,
                }}
              >
                "{dive.headline}."
              </p>
            </div>

            {/* Footer with URL — locked into the image */}
            <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
              <div
                style={{
                  height: 1,
                  background: "linear-gradient(to right, transparent, hsl(239 84% 67% / 0.4), transparent)",
                  marginBottom: 14,
                }}
              />
              <div
                style={{
                  fontSize: 13,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "hsl(239 84% 75%)",
                  fontWeight: 500,
                }}
              >
                moondaylive.com
              </div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "rgba(245,230,200,0.4)",
                  marginTop: 6,
                }}
              >
                Discover Your Moon Sign
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-3 mb-8">
          <Button onClick={handleNativeShare} disabled={rendering} className="gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={rendering} className="gap-2">
            <Download className="w-4 h-4" /> Download
          </Button>
          <Button variant="outline" onClick={shareTwitter} className="gap-2">
            <Twitter className="w-4 h-4" /> X / Twitter
          </Button>
          <Button variant="outline" onClick={shareFacebook} className="gap-2">
            <Facebook className="w-4 h-4" /> Facebook
          </Button>
          <Button variant="outline" onClick={shareInstagram} className="gap-2">
            <Instagram className="w-4 h-4" /> Instagram
          </Button>
        </div>

        {/* Community CTA */}
        <GlassmorphismCard className="max-w-2xl w-full text-center" size="sm">
          <h2 className="font-display text-lg uppercase tracking-widest text-primary mb-2">
            Join the Community
          </h2>
          <p className="font-serif text-cream-muted mb-4">
            Compare moon signs, share readings, and find your lunar tribe.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={REDDIT_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                Join our Reddit Community
              </Button>
            </a>
          </div>
          <p className="text-xs text-cream-muted/60 mt-4 italic">
            More communities (Instagram, TikTok, Discord) coming as Moonday Live grows.
          </p>
        </GlassmorphismCard>
      </main>

      <Footer />
    </div>
  );
}
