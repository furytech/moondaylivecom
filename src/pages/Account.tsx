import ManageMembershipButton from "@/components/ManageMembershipButton";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import MoonLoader from "@/components/MoonLoader";
import { useToast } from "@/hooks/use-toast";
import { calculateMoonSignAsync, calculateSunSign } from "@/lib/moonSign";
import { getLocalCuspDay } from "@/lib/cuspDay";
import { Crown, LogOut, Moon, Mail, Calendar as CalendarIcon, Bell, Globe, User as UserIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONE_OPTIONS, detectTimezoneOption, zoneAbbreviation, isValidTimezone } from "@/lib/timezone";
import { cacheTimezone } from "@/hooks/useUserTimezone";
import UTCNotice from "@/components/UTCNotice";
import { Switch } from "@/components/ui/switch";

import SovereignSecurity from "@/components/SovereignSecurity";
import SEO from "@/components/SEO";
import { format, parseISO } from "date-fns";

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1).padStart(2, "0");
  return { value: d, label: String(i + 1) };
});

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => {
  const y = String(CURRENT_YEAR - i);
  return { value: y, label: y };
});

interface ProfileRow {
  first_name?: string | null;
  email: string | null;
  birthday: string | null;
  moon_sign: string | null;
  subscription_status: string;
  is_subscriber: boolean;
  moon_alert_frequency: string | null;
  timezone: string | null;
}


const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session, signOut, subscription } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const birthday =
    birthYear && birthMonth && birthDay
      ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
      : "";
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alertFrequency, setAlertFrequency] = useState<"all" | "natal">("all");
  const [frequencySaving, setFrequencySaving] = useState(false);
  const [timezone, setTimezone] = useState<string>("UTC");
  const [timezoneSaving, setTimezoneSaving] = useState(false);


  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

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
        .select("first_name, email, birthday, moon_sign, subscription_status, is_subscriber, moon_alert_frequency, timezone")
        .eq("user_id", user.id)
        .maybeSingle();


      if (error) {
        console.error("Error loading profile:", error);
      } else if (data) {
        setProfile(data);
        if (data.birthday) {
          const parts = data.birthday.split("T")[0].split("-");
          if (parts.length === 3) {
            setBirthYear(parts[0]);
            setBirthMonth(parts[1]);
            setBirthDay(parts[2]);
          }
        }
        setAlertFrequency(
          data.moon_alert_frequency === "natal" ? "natal" : "all"
        );
        const saved = data.timezone && isValidTimezone(data.timezone) ? data.timezone : null;
        setTimezone(saved ?? detectTimezoneOption());
        if (saved) cacheTimezone(saved);
      }

      setLoading(false);
    };
    load();
  }, [user]);

  // Was the birthday a day the Moon changed signs (in the member's own timezone)?
  const isCuspBirthday = useMemo(() => {
    if (!profile?.birthday) return false;
    try {
      return getLocalCuspDay(profile.birthday, timezone).isCuspDay;
    } catch {
      return false;
    }
  }, [profile?.birthday, timezone]);

  const isPro =
    profile?.subscription_status === "luminary" ||
    profile?.subscription_status === "sovereign" ||
    Boolean(profile?.is_subscriber) ||
    subscription.subscribed;

  const handleSaveBirthday = async () => {
    if (!user || !birthday) return;
    setSaving(true);
    try {
      const birthDate = new Date(`${birthday}T12:00:00`);
      const moon = await calculateMoonSignAsync(birthDate);
      const sunSign = calculateSunSign(birthDate);

      // Only write the computed Moon sign when none is saved yet; a sign chosen
      // in the Moon Cusp Quiz is changed only by retaking the quiz.
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("natal_moon_sign")
        .eq("user_id", user.id)
        .maybeSingle();
      const savedMoon = existing?.natal_moon_sign || null;
      const moonToKeep = savedMoon ?? moon.sign;

      const payload = {
        user_id: user.id,
        email: user.email ?? "",
        birthday,
        natal_sun_sign: sunSign,
        ...(savedMoon ? {} : { moon_sign: moon.sign, natal_moon_sign: moon.sign }),
      };

      const { error } = await supabase
        .from("user_profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      setProfile((prev) => ({
        email: user.email ?? prev?.email ?? null,
        birthday,
        moon_sign: savedMoon ? (prev?.moon_sign ?? savedMoon) : moon.sign,
        natal_moon_sign: moonToKeep,
        natal_sun_sign: sunSign,
        subscription_status: prev?.subscription_status ?? "free",
        is_subscriber: prev?.is_subscriber ?? false,
        moon_alert_frequency: prev?.moon_alert_frequency ?? "all",
        timezone: prev?.timezone ?? timezone,
      }));

      toast({
        title: "Profile saved",
        description: `Your sun sign is ${sunSign} and moon sign is ${moonToKeep}.`,
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

  const handleTimezoneChange = async (value: string) => {
    if (!user) return;
    setTimezoneSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ timezone: value })
        .eq("user_id", user.id);

      if (error) throw error;

      setTimezone(value);
      cacheTimezone(value);
      setProfile((prev) => (prev ? { ...prev, timezone: value } : prev));
      toast({
        title: "Timezone saved",
        description:
          value === "UTC"
            ? "Moon times will be shown in UTC — the same clock we publish on."
            : `Moon times will be shown in ${zoneAbbreviation(value)}. Content is still published on UTC.`,
      });
    } catch (err) {
      console.error("Timezone save error:", err);
      toast({
        title: "Could not save timezone",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimezoneSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleFrequencyChange = async (value: "all" | "natal") => {
    if (!user) return;
    setFrequencySaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ moon_alert_frequency: value })
        .eq("user_id", user.id);

      if (error) throw error;

      setAlertFrequency(value);
      setProfile((prev) => (prev ? { ...prev, moon_alert_frequency: value } : prev));
      toast({
        title: "Alert preference saved",
        description: value === "all"
          ? "You will receive every Moon ingress alert."
          : "You will only receive alerts for your natal Moon sign.",
      });
    } catch (err) {
      console.error("Frequency save error:", err);
      toast({
        title: "Could not save preference",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setFrequencySaving(false);
    }
  };

  return (

    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title="Account — Moonday Live"
        description="Manage your Moonday Live account, birth details, subscription, and Luminary Security settings."
        noindex
      />
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
                  {/* First Name */}
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-display text-xs uppercase tracking-widest text-cream-muted/60 mb-1">
                        First Name
                      </p>
                      <p className="font-serif text-base text-foreground">
                        {profile?.first_name || (user?.user_metadata?.first_name as string) || "Not provided"}
                      </p>
                    </div>
                  </div>

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
                    <CalendarIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label
                        htmlFor="birthday"
                        className="block font-display text-xs uppercase tracking-widest text-cream-muted/60 mb-2"
                      >
                        Birthday
                      </label>

                      {profile?.birthday ? (
                        <>
                          <div
                            id="birthday"
                            className="w-full px-4 py-3 bg-background/40 border border-primary/20 rounded-md font-serif text-base text-foreground flex items-center justify-between opacity-90"
                          >
                            <span>{format(parseISO(profile.birthday), "MMMM d, yyyy")}</span>
                            <CalendarIcon className="w-4 h-4 text-primary/40" />
                          </div>
                          <p className="font-serif text-xs text-cream-muted/50 mt-2">
                            Your birthday is locked once set. It anchors your natal moon sign and cannot be changed from here. If you need to correct it, please contact support.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {/* Month dropdown */}
                            <Select value={birthMonth} onValueChange={setBirthMonth}>
                              <SelectTrigger
                                id="birthMonth"
                                aria-label="Birth Month"
                                className="w-full h-12 px-2.5 sm:px-3 rounded-xl bg-background/40 border border-primary/20 text-xs sm:text-sm text-foreground text-left focus:border-primary/65 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                              >
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent className="bg-navy-dark border-primary/30 max-h-60">
                                {MONTH_OPTIONS.map((m) => (
                                  <SelectItem key={m.value} value={m.value} className="text-foreground">
                                    {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Day dropdown */}
                            <Select value={birthDay} onValueChange={setBirthDay}>
                              <SelectTrigger
                                id="birthDay"
                                aria-label="Birth Day"
                                className="w-full h-12 px-2.5 sm:px-3 rounded-xl bg-background/40 border border-primary/20 text-xs sm:text-sm text-foreground text-left focus:border-primary/65 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                              >
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                              <SelectContent className="bg-navy-dark border-primary/30 max-h-60">
                                {DAY_OPTIONS.map((d) => (
                                  <SelectItem key={d.value} value={d.value} className="text-foreground">
                                    {d.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Year dropdown */}
                            <Select value={birthYear} onValueChange={setBirthYear}>
                              <SelectTrigger
                                id="birthYear"
                                aria-label="Birth Year"
                                className="w-full h-12 px-2.5 sm:px-3 rounded-xl bg-background/40 border border-primary/20 text-xs sm:text-sm text-foreground text-left focus:border-primary/65 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                              >
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent className="bg-navy-dark border-primary/30 max-h-60">
                                {YEAR_OPTIONS.map((y) => (
                                  <SelectItem key={y.value} value={y.value} className="text-foreground">
                                    {y.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="font-serif text-xs text-cream-muted/50 mt-2">
                            Used to calculate your natal moon sign. This can only be set once.
                          </p>
                        </>
                      )}
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
                        {isCuspBirthday && profile.birthday && (
                          <button
                            type="button"
                            onClick={() => navigate("/transition-quiz")}
                            className="mt-2 font-sans text-[15px] text-primary underline underline-offset-4 hover:text-primary/80 transition-colors text-left"
                          >
                            Retake the Moon-change quiz
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timezone */}
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-display text-xs uppercase tracking-widest text-cream-muted/60 mb-2 flex items-center gap-1.5">
                        Timezone
                        <UTCNotice timezone={timezone} />
                      </p>
                      <Select
                        value={timezone}
                        onValueChange={handleTimezoneChange}
                        disabled={timezoneSaving}
                      >
                        <SelectTrigger className="w-full h-11 rounded-xl bg-background/40 border border-primary/20 text-left">
                          <SelectValue placeholder="Select your timezone" />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-dark border-primary/30 max-h-72">
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-cream-muted/60 mt-2 leading-relaxed">
                        Moon content is calculated and published on{" "}
                        <span className="text-primary/90">UTC</span>
                        {timezone !== "UTC" && (
                          <> — your times display in {zoneAbbreviation(timezone)}</>
                        )}
                        .
                      </p>
                    </div>
                  </div>



                  {!profile?.birthday && (
                    <button
                      onClick={handleSaveBirthday}
                      disabled={saving || !birthday}
                      className="w-full mt-2 px-6 py-3 font-display text-xs tracking-[0.2em] uppercase border border-primary/30 rounded-full text-primary/90 hover:text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                  )}
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
                          Luminary Member
                        </span>
                      </div>
                      <p className="font-serif text-base text-cream-muted mb-6">
                        All premium features are unlocked.
                      </p>
                      <ManageMembershipButton />
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
                        Unlock Luminary
                      </button>
                    </>
                  )}
                </div>

                {isPro && (
                  <div className="mt-8 pt-6 border-t border-primary/10">
                    <div className="flex items-start gap-3 mb-4">
                      <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-display text-xs uppercase tracking-widest text-cream-muted/60 mb-1">
                          Moon Ingress Alerts
                        </p>
                        <p className="font-serif text-sm text-cream-muted/80 mb-4">
                          Choose how often we email you when the Moon is about to change signs.
                        </p>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-primary/10">
                          <span className="font-serif text-sm text-foreground">
                            {alertFrequency === "all"
                              ? "All ingresses"
                              : "Only my natal sign ingress"}
                          </span>
                          <Switch
                            checked={alertFrequency === "natal"}
                            onCheckedChange={(checked) =>
                              handleFrequencyChange(checked ? "natal" : "all")
                            }
                            disabled={frequencySaving}
                            aria-label="Toggle natal-only Moon ingress alerts"
                          />
                        </div>
                        <p className="font-serif text-xs text-cream-muted/50 mt-2">
                          {alertFrequency === "all"
                            ? "You will get an alert roughly 2 hours before every Moon sign change."
                            : "You will only get an alert when the Moon enters your birth Moon sign."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </GlassmorphismCard>


              {/* Sovereign Security (2FA) */}
              <SovereignSecurity />

              {/* Admin panel access */}
              {isAdmin && (
                <GlassmorphismCard className="animate-fade-up">
                  <div className="text-center">
                    <h2 className="font-display text-xl text-gold-gradient tracking-wider mb-3">
                      Administrator
                    </h2>
                    <p className="font-serif text-sm text-cream-muted/70 mb-5">
                      Access Moonday Mission Control and administrative operations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => navigate("/admin")}
                        className="px-5 py-2.5 font-display text-xs tracking-[0.2em] uppercase border border-primary/40 rounded-full text-primary hover:bg-primary/10 transition-all"
                      >
                        Mission Control Admin
                      </button>
                    </div>
                  </div>
                </GlassmorphismCard>
              )}


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
