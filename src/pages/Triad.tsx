import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import DailyPulse from "@/components/DailyPulse";

/* ────────────────────────────────────────────────────────────
   Your Three Zodiac Lenses — subscriber page
   All lens education and sign guidance lives inside the
   click-to-expand panels of <DailyPulse />.
   ──────────────────────────────────────────────────────────── */

export default function Triad() {
  const navigate = useNavigate();
  const { subscription, checkSubscription } = useAuth();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login?from=/lenses");
        return;
      }

      // Trust either the user_profiles flag OR the live Stripe-derived subscription.
      const { data: profile } = await supabase
          .from("user_profiles")
          .select("is_subscriber, subscription_status")
          .eq("user_id", session.user.id)
          .maybeSingle();

      const profileSub =
          !!profile?.is_subscriber || profile?.subscription_status === "sovereign";

      if (profileSub || subscription.subscribed) {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      // Final check: revalidate against Stripe in case context is stale.
      await checkSubscription();
      const { data: fresh } = await supabase
          .from("user_profiles")
          .select("is_subscriber, subscription_status")
          .eq("user_id", session.user.id)
          .maybeSingle();

      if (fresh?.is_subscriber || fresh?.subscription_status === "sovereign") {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      navigate("/pricing");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  if (loading || !authorized) {
    return (
        <div className="sov-shell min-h-screen flex items-center justify-center">
          <div className="text-[hsl(var(--sov-ivory)/0.5)] text-xs uppercase tracking-[0.4em]">
            Calibrating
          </div>
        </div>
    );
  }

  return (
      <div className="sov-shell min-h-screen">
        <SEO
            title="Your Three Zodiac Lenses — Tropical, Sidereal & Draconic Moon"
            description="Read today's Moon through three lenses: Tropical (The Persona) shows the social atmosphere, Sidereal (The Wiring) reveals your nervous system's true alignment, and Draconic (The Soul) points to your deeper direction."
            canonical="https://moondaylive.com/lenses"
        />
        <Navigation />
        <main className="pt-[68px] pb-24 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <header className="text-center mb-8">
              <div className="text-[10px] uppercase tracking-[0.5em] text-[hsl(var(--sov-champagne))] mb-2">
                The Lenses
              </div>
              <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[hsl(var(--sov-ivory))]">
                Your Three Zodiac Lenses
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[hsl(var(--sov-ivory)/0.65)] max-w-xl mx-auto leading-relaxed">
                The same Moon, interpreted through three distinct coordinate systems — each revealing a different layer of today's energy. Select a lens to expand its full alignment reading.
              </p>
            </header>

            <DailyPulse />
          </div>
        </main>
        <Footer />
      </div>
  );
}
