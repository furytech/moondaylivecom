import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import SEO from "@/components/SEO";
import MoonLoader from "@/components/MoonLoader";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, CheckCircle, AlertCircle, Ban } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "already" | "success">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        method: "GET",
        body: { token },
      });

      if (error || !data?.valid) {
        setStatus(data?.reason === "already_unsubscribed" ? "already" : "invalid");
      } else {
        setStatus("valid");
      }
    };


    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setStatus("loading");
    setError(null);

    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });

    if (error) {
      setError("Something went wrong. Please try again or contact support.");
      setStatus("valid");
      return;
    }

    if (data?.success) {
      setStatus("success");
    } else if (data?.reason === "already_unsubscribed") {
      setStatus("already");
    } else {
      setError("We could not process your request.");
      setStatus("valid");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title="Unsubscribe — Moonday Live"
        description="Manage your Moonday Live email preferences."
        noindex
      />
      <Navigation />

      <main className="flex-1 flex flex-col items-center justify-center pt-[68px] pb-6 px-6 relative z-20">
        <div className="max-w-md mx-auto w-full">
          <GlassmorphismCard className="animate-fade-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h1 className="font-display text-2xl text-gold-gradient tracking-wider mb-2">
                Email Preferences
              </h1>
              <p className="font-serif text-sm text-cream-muted">
                Moonday Live notifications and transit alerts
              </p>
            </div>

            {status === "loading" && (
              <div className="flex justify-center py-8">
                <MoonLoader size="md" text="Checking your link..." />
              </div>
            )}

            {status === "invalid" && (
              <div className="text-center py-6">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
                <p className="font-serif text-base text-cream-muted">
                  This unsubscribe link is invalid or has expired.
                </p>
              </div>
            )}

            {status === "already" && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="font-serif text-base text-cream-muted">
                  You are already unsubscribed from Moonday emails.
                </p>
              </div>
            )}

            {status === "valid" && (
              <div className="text-center py-4">
                <Ban className="w-8 h-8 text-primary/70 mx-auto mb-3" />
                <p className="font-serif text-base text-cream-muted mb-6">
                  Click below to stop receiving Moonday Live transit alerts and other email notifications.
                </p>
                {error && (
                  <p className="font-serif text-sm text-destructive mb-4">{error}</p>
                )}
                <button
                  onClick={handleUnsubscribe}
                  className="w-full px-6 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/30 rounded-full text-primary/90 hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-500"
                >
                  Unsubscribe
                </button>
              </div>
            )}

            {status === "success" && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="font-serif text-base text-cream-muted">
                  You have been unsubscribed. You will no longer receive Moonday Live transit alerts.
                </p>
              </div>
            )}
          </GlassmorphismCard>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Unsubscribe;
