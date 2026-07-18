import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MoonLoader from "@/components/MoonLoader";
import SEO from "@/components/SEO";

// The @supabase/supabase-js beta `auth.oauth` namespace isn't in the current
// generated types — narrow it with a local typed wrapper so we still call the
// real SDK methods.
type OAuthResult = {
  data?: {
    client?: { name?: string; client_id?: string };
    redirect_uri?: string;
    scope?: string;
    redirect_url?: string;
    redirect_to?: string;
  } | null;
  error?: { message: string } | null;
};
const oauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
    approveAuthorization: (id: string) => Promise<OAuthResult>;
    denyAuthorization: (id: string) => Promise<OAuthResult>;
  };
}).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";

  const [details, setDetails] = useState<OAuthResult["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id.");
        setLoading(false);
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so login returns the user here.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?from=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data ?? null);
        setLoading(false);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load authorization.");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization failed.");
      setBusy(false);
    }
  }

  const clientName = details?.client?.name ?? "an application";
  const scope = details?.scope ?? "openid email profile";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <SEO title="Authorize Access — Moonday Live" description="Approve or deny access to your Moonday Live account." noindex />
      <Navigation />
      <main className="relative z-10 flex-1 flex items-start justify-center px-6 pt-[88px] pb-16">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-2">
              Sovereign Access
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              Connect {clientName} to your account
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              This lets {clientName} use Moonday Live as you.
            </p>
          </div>

          <div className="p-8 md:p-10 rounded-3xl border border-lilac/20 bg-card/50 backdrop-blur-xl shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)]">
            {loading && (
              <div className="flex justify-center py-6">
                <MoonLoader />
              </div>
            )}

            {!loading && error && (
              <div className="space-y-4 text-center">
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
                <p className="text-sm text-muted-foreground">
                  Close this window and try connecting again from your client.
                </p>
              </div>
            )}

            {!loading && !error && details && (
              <div className="space-y-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <span className="text-foreground/80">Requested permissions:</span>{" "}
                    <span className="text-lilac">{scope}</span>
                  </p>
                  <p className="leading-relaxed">
                    {clientName} will be able to call Moonday Live's enabled tools
                    while you are signed in. This does not bypass Moonday Live's
                    permissions or backend policies.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => decide(true)}
                    className="w-full h-12 bg-lilac hover:bg-lilac-light text-primary-foreground font-medium rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 flex items-center justify-center"
                  >
                    {busy ? <MoonLoader size="sm" /> : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => decide(false)}
                    className="w-full h-12 border border-lilac/30 text-foreground/80 hover:text-foreground rounded-xl text-xs tracking-[0.2em] uppercase transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel connection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OAuthConsent;
