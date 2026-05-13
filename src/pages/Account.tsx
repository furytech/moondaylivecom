import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import MoonLoader from "@/components/MoonLoader";
import { useToast } from "@/hooks/use-toast";
import { calculateMoonSign } from "@/lib/moonSign";
import { Crown, ExternalLink, LogOut, Moon, Mail, Calendar } from "lucide-react";
import SovereignSecurity from "@/components/SovereignSecurity";

interface ProfileRow {
  email: string | null;
  birthday: string | null;
  moon_sign: string | null;
  subscription_status: string;
  is_subscriber: boolean;
}

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session, signOut, subscription } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [birthday, setBirthday] = useState("");
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Stable starfield
  const stars = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        id: i,
        top: `${(i * 17 + 23) % 100}%`,
        left: `${(i * 31 + 7) % 100}%`,
        delay: `${(i * 0.15) % 3}s`,
        opacity: 0.3 + ((i * 0.07) % 0.5),
      })),
    []
  );

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_profiles")
        .select("email, birthday, moon_sign, subscription_status, is_subscriber")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
      } else if (data) {
        setProfile(data);
        if (data.birthday) setBirthday(data.birthday);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const isPro = profile?.subscription_status === "sovereign" || subscription.subscribed;

  const handleSaveBirthday = async () => {
    if (!user || !birthday) return;
    setSaving(true);
    try {
      const birthDate = new Date(`${birthday}T12:00:00`);
      const moon = calculateMoonSign(birthDate);

      const { error } = await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: user.id,
            email: user.email,
            birthday,
            moon_sign: moon.sign,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      setProfile((prev) => ({
        email: user.email ?? prev?.email ?? null,
        birthday,
        moon_sign: moon.sign,
        subscription_status: prev?.subscription_status ?? "free",
        is_subscriber: prev?.is_subscriber ?? false,
      }));

      toast({
        title: "Profile saved",
        description: `Your moon sign is ${moon.sign}.`,
      });
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Could not save",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: s.top,
              left: s.left,
              animationDelay: s.delay,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      <Navigation />

      <main className="flex-1 flex flex-col items-center pt-[68px] pb-6 px-6 relative z-20">
        <div className="max-w-2xl mx-auto w-full">
          <div className="text-center mb-6 animate-fade-up">
            <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-2 leading-[1.2] pb-1">
              Your Account
            </h1>
            <p className="font-serif text-lg text-cream-muted">
              Manage your profile and subscription.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <MoonLoader size="md" text="Loading your details..." />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile */}
              <GlassmorphismCard className="animate-fade-up stagger-1">
                <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-6">
                  Profile
                </h2>

                <div className="space-y-5">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-display text-xs uppercase tracking-widest text-cream-muted/60 mb-1">
                        Email
                      </p>
                      <p className="font-serif text-base text-foreground break-all">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Birthday + Moon sign */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label
                        htmlFor="birthday"
                        className="block font-display text-xs uppercase tracking-widest text-cream-muted/60 mb-2"
                      >
                        Birthday
                      </label>
                      <input
                        id="birthday"
                        type="date"
                        value={birthday}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full px-4 py-3 bg-background/40 border border-primary/20 rounded-md font-serif text-base text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                      />
                      <p className="font-serif text-xs text-cream-muted/50 mt-2">
                        Used to calculate your natal moon sign.
                      </p>
                    </div>
                  </div>

                  {/* Moon sign display */}
                  {profile?.moon_sign && (
                    <div className="flex items-start gap-3">
                      <Moon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-display text-xs uppercase tracking-widest text-cream-muted/60 mb-1">
                          Birth Moon Sign
                        </p>
                        <p className="font-display text-2xl text-primary">
                          {profile.moon_sign}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveBirthday}
                    disabled={saving || !birthday || birthday === profile?.birthday}
                    className="w-full mt-2 px-6 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/30 rounded-full text-primary/90 hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </GlassmorphismCard>

              {/* Subscription */}
              <GlassmorphismCard className="animate-fade-up stagger-2">
                <h2 className="font-display text-lg tracking-widest uppercase text-foreground text-center mb-6">
                  Subscription
                </h2>

                <div className="text-center">
                  {isPro ? (
                    <>
                      <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-4">
                        <Crown className="w-4 h-4 text-primary" />
                        <span className="font-display text-sm text-primary uppercase tracking-widest">
                          Sovereign Member
                        </span>
                      </div>
                      <p className="font-serif text-base text-cream-muted mb-6">
                        All premium features are unlocked.
                      </p>
                      <button
                        onClick={handleManageSubscription}
                        disabled={portalLoading}
                        className="inline-flex items-center gap-3 font-serif text-base text-cream-muted elegant-hover"
                      >
                        {portalLoading ? (
                          <MoonLoader size="sm" />
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Manage Subscription
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-serif text-base text-cream-muted mb-6">
                        You're on the free plan.
                      </p>
                      <button
                        onClick={() => navigate("/pricing")}
                        className="inline-flex items-center gap-2 px-6 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/30 rounded-full text-primary/90 hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-500"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade to Sovereign
                      </button>
                    </>
                  )}
                </div>
              </GlassmorphismCard>

              {/* Sign out */}
              <div className="text-center pt-4 animate-fade-up stagger-3">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 font-serif text-sm text-cream-muted/70 hover:text-primary transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
