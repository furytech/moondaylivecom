import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;

      setSent(true);
      toast({
        title: "Recovery Link Sent ✓",
        description: "A secure reset link has been sent to your inbox. Check your mail to maintain your access.",
      });
    } catch (err: unknown) {
      // Neutral confirmation to avoid email enumeration.
      setSent(true);
      toast({
        title: "Recovery Link Sent ✓",
        description: "A secure reset link has been sent to your inbox. Check your mail to maintain your access.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title="Forgot Password — Moonday Live"
        description="Reclaim your portal. We'll send a secure password reset link to your inbox."
        noindex
      />
      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <Navigation />

      <main className="flex-1 flex flex-col items-center pt-[68px] pb-6 px-6 relative z-20">
        <GlassmorphismCard className="max-w-md w-full animate-fade-up stagger-1">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="font-serif text-sm text-primary/90 uppercase tracking-[0.2em] mb-2">
              Secure Recovery
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-[0.06em] mb-2">
              Reclaim Your Portal
            </h1>
            <p className="font-serif text-base text-cream-muted/70">
              Enter the email tied to your celestial account and we'll send a secure link to set a new password.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@cosmos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl text-center"
              />

              <Button
                type="submit"
                disabled={!isValidEmail || loading}
                className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500 disabled:opacity-40"
              >
                {loading ? <MoonLoader size="sm" /> : "Send Recovery Link"}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="font-serif text-sm text-cream-muted/70 hover:text-primary transition-colors"
                >
                  ← Return to sign in
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full border border-primary/30 flex items-center justify-center">
                <span className="text-3xl">✦</span>
              </div>
              <p className="font-serif text-base text-cream-muted/80 leading-relaxed">
                A secure reset link has been sent to{" "}
                <span className="text-primary/90">{email}</span>. Check your mail to maintain your access.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500"
                >
                  Return to Portal
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="font-serif text-sm text-cream-muted/60 hover:text-primary transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}
        </GlassmorphismCard>

        {/* Decorative */}
        <div className="mt-12 flex items-center gap-4">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
