import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import PageLayout from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { calculateMoonSign } from "@/lib/moonSign";

interface PortalProps {
  defaultMode?: "login" | "signup";
}

const Portal = ({ defaultMode = "login" }: PortalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/blueprint", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!isLogin && !birthday) {
      setError("Please enter your birthday — it's needed to chart your moon sign.");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/blueprint", { replace: true });
      } else {
        // Calculate moon sign from birthday so we can save it on signup
        const birthDate = new Date(`${birthday}T12:00:00`);
        const moonSign = calculateMoonSign(birthDate);
        await signUp(email, password, birthday, moonSign.sign);
        setSignupSuccess(true);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const rawMessage = error.message || "Unknown error";
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: rawMessage,
        variant: "destructive",
      });
      if (rawMessage.includes("User already registered")) {
        setError("This email is already registered. Please sign in.");
      } else if (rawMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password. If you recently signed up, please verify your email first.");
      } else if (rawMessage.includes("Email not confirmed")) {
        setError("Please check your email to confirm your account before signing in.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <PageLayout showLogo={false}>
        <GlassmorphismCard className="max-w-md w-full mt-4 animate-fade-up stagger-1">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-primary/30 flex items-center justify-center">
              <span className="text-3xl">✨</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-[0.06em] mb-4">
              Verify Your Email
            </h1>
            <p className="font-serif text-lg text-cream-muted/80 mb-6 leading-relaxed">
              A celestial confirmation link has been sent to your inbox. Please verify your email to unlock your moon sign.
            </p>
            <p className="font-serif text-base text-primary mb-6">{email}</p>
            <p className="font-serif text-sm text-cream-muted/50">
              Check your spam folder if you don't see it within a few minutes.
            </p>
            <button
              onClick={() => {
                setSignupSuccess(false);
                setIsLogin(true);
              }}
              className="mt-8 font-serif text-base text-cream-muted/70 hover:text-primary transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </GlassmorphismCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout showLogo={false}>
      {/* Back link, in-flow (no fixed header) */}
      <div className="w-full max-w-md mb-4 self-center">
        <button
          onClick={() => navigate("/")}
          className="font-serif text-sm text-cream-muted/60 hover:text-primary transition-colors"
        >
          ← Back
        </button>
      </div>

      <GlassmorphismCard className="max-w-md w-full animate-fade-up stagger-1">
        <div className="text-center mb-8">
          <p className="font-serif text-sm text-primary/60 uppercase tracking-[0.2em] mb-3">
            The Ritual Invitation
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-[0.06em] mb-2">
            {isLogin ? "Welcome Back" : "Join the Cosmos"}
          </h1>
          <p className="font-serif text-base text-cream-muted/70">
            {isLogin ? "Enter your celestial credentials" : "Begin your lunar journey"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl"
          />
          {!isLogin && (
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl"
            />
          )}
          {!isLogin && (
            <div className="space-y-2">
              <label htmlFor="birthday" className="block font-serif text-xs text-primary/70 uppercase tracking-[0.2em] pl-1">
                Birthday
              </label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1900-01-01"
                className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl [color-scheme:dark]"
              />
              <p className="font-serif text-xs text-cream-muted/50 pl-1">
                Used to chart your moon sign — saved to your profile.
              </p>
            </div>
          )}
          {error && (
            <p className="text-destructive text-base font-serif text-center py-2">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500"
          >
            {loading ? <MoonLoader size="sm" /> : isLogin ? "Enter the Portal" : "Accept the Invitation"}
          </Button>
        </form>

        {isLogin && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setError("Please enter your email address first");
                  return;
                }
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                  });
                  if (error) throw error;
                  toast({
                    title: "Reset Link Sent",
                    description: "Check your email for a password reset link.",
                  });
                } catch (err: unknown) {
                  const error = err as { message?: string };
                  setError(error.message || "Failed to send reset email");
                }
              }}
              className="font-serif text-sm text-primary/70 hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="font-serif text-base text-cream-muted/70 hover:text-primary transition-colors"
          >
            {isLogin ? "New here? Accept the invitation" : "Already initiated? Sign in"}
          </button>
        </div>
      </GlassmorphismCard>
    </PageLayout>
  );
};

export default Portal;
