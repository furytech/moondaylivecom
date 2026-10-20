import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { MailCheck, Sun } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import LockedBlueprintTeaser from "@/components/LockedBlueprintTeaser";
import { seoProps } from "@/lib/seo";
import { loadRevealState } from "@/lib/revealState";
import { getMoonSignByName } from "@/lib/moonSign";
import { getMoonSignDeepDive } from "@/lib/moonSignContent";
import { formatBirthdayLong } from "@/lib/cuspDay";

const GOLD = "#d4af37";

/** The reveal, shown straight after the account is created. Nothing here can be reached without an email. */
const YourMoonSign = () => {
  const state = useMemo(() => loadRevealState(), []);
  if (!state) return <Navigate to="/" replace />;

  const moon = getMoonSignByName(state.moonSign);
  const dive = getMoonSignDeepDive(state.moonSign);

  const inbox = (
    <div className="rounded-2xl border border-lilac/25 bg-card/50 p-5 md:p-6 space-y-3">
      <p className="flex items-center gap-2 text-lilac text-xs tracking-[0.3em] uppercase text-left">
        <MailCheck className="h-4 w-4" aria-hidden="true" />
        Check your inbox
      </p>
      <p className="text-[15px] md:text-base text-cream/90 leading-relaxed text-left">
        We sent a confirmation link to <span className="text-foreground break-all">{state.email}</span>. Confirm it,
        then set a password to open your Blueprint.
      </p>
      <p className="text-xs text-muted-foreground/80 leading-relaxed text-left">
        Check your spam folder if it doesn't arrive within a few minutes.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
      <SEO {...seoProps("/your-moon-sign")} />
      <Navigation />

      <main className="relative z-10 flex-1 flex items-start justify-center px-4 sm:px-6 pt-[68px] pb-16">
        <div className="max-w-md w-full space-y-6">
          {state.kind === "resent" || !moon ? (
            <section className="mt-6 space-y-6 animate-fade-up">
              <div className="text-center space-y-2">
                <p className="text-lilac text-xs tracking-[0.3em] uppercase">Almost there</p>
                <h1 className="font-display text-3xl font-semibold tracking-tight">Confirm your email</h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  This email already started signing up, so we sent the link again.
                </p>
              </div>
              {inbox}
              <p className="text-sm text-muted-foreground text-left">
                Already confirmed?{" "}
                <Link to={`/login?email=${encodeURIComponent(state.email)}`} className="inline-flex items-center min-h-11 text-lilac underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </section>
          ) : (
            <section className="mt-6 space-y-6 animate-fade-up">
              <div className="p-5 sm:p-8 rounded-3xl border border-lilac/20 bg-card/50 space-y-5">
                <div className="text-center space-y-1">
                  <p className="text-lilac text-xs tracking-[0.3em] uppercase">Your Moon sign</p>
                  <p className="text-5xl leading-none pt-2" aria-hidden="true" style={{ color: GOLD }}>
                    {moon.symbol}
                  </p>
                  <h1
                    className="font-display text-3xl md:text-4xl tracking-wide pt-1"
                    style={{ color: GOLD, textShadow: "0 0 22px rgba(212, 175, 55, 0.35)" }}
                  >
                    {state.moonSign} Moon
                  </h1>
                  {dive && (
                    <p className="text-sm text-muted-foreground tracking-wide">
                      {dive.archetype} · {moon.element}
                    </p>
                  )}
                </div>

                <p className="text-[15px] md:text-base text-cream/90 leading-relaxed text-left">
                  {moon.description} {moon.emotionalStyle}
                </p>

                <p className="border-t border-lilac/15 pt-4 text-sm text-muted-foreground leading-relaxed text-left flex items-center gap-2">
                  <Sun className="h-4 w-4 shrink-0 text-lilac" aria-hidden="true" />
                  <span>Your Sun sign: {state.sunSign}</span>
                </p>
              </div>

              <LockedBlueprintTeaser sunSign={state.sunSign} moonSign={state.moonSign} />

              {inbox}

              <p className="text-xs text-muted-foreground/80 leading-relaxed text-left">
                Your birthday, {formatBirthdayLong(state.birthday)}, is now locked to this account. We never ask for
                your birth time or place. Corrections go through support@moondaylive.com.
              </p>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default YourMoonSign;
