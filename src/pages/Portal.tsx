import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MoonLoader from "@/components/MoonLoader";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { useToast } from "@/hooks/use-toast";
import moonLogo from "@/assets/moon-logo-new.png";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already logged in
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
        await signUp(email, password);
        setSignupSuccess(true);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const rawMessage = error.message || "Unknown error";
      
      // Show raw error in toast for debugging
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
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Decorative stars background */}
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

        <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-10">
          {/* Moon Logo */}
          <div className="animate-float mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden hover-scale-subtle bg-background logo-halo">
              <img
                src={moonLogo}
                alt="Moonday"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <GlassmorphismCard className="max-w-md w-full animate-fade-up stagger-1">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-8 rounded-full border border-primary/30 flex items-center justify-center">
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
                className="mt-10 font-serif text-base text-cream-muted/70 hover:text-primary transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          </GlassmorphismCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Decorative stars background */}
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

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="font-serif text-sm text-cream-muted/60 hover:text-primary transition-colors"
          >
            ← Back
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-10">
        {/* Moon Logo */}
        <div className="animate-float mb-6">
          <div 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer hover-scale-subtle bg-background logo-halo"
            onClick={() => navigate("/")}
          >
            <img
              src={moonLogo}
              alt="Moonday"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Auth Card */}
        <GlassmorphismCard className="max-w-md w-full animate-fade-up stagger-1">
          {/* Title */}
          <div className="text-center mb-10">
            <p className="font-serif text-sm text-primary/60 uppercase tracking-[0.2em] mb-4">
              The Ritual Invitation
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-[0.06em] mb-3">
              {isLogin ? "Welcome Back" : "Join the Cosmos"}
            </h1>
            <p className="font-serif text-lg text-cream-muted/70">
              {isLogin 
                ? "Enter your celestial credentials" 
                : "Begin your lunar journey"}
            </p>
          </div>

          {/* Form */}
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

            {error && (
              <p className="text-destructive text-base font-serif text-center py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500"
            >
              {loading ? (
                <MoonLoader size="sm" />
              ) : isLogin ? (
                "Enter the Portal"
              ) : (
                "Accept the Invitation"
              )}
            </Button>
          </form>

          {/* Forgot Password Link */}
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

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="font-serif text-base text-cream-muted/70 hover:text-primary transition-colors"
            >
              {isLogin 
                ? "New here? Accept the invitation" 
                : "Already initiated? Sign in"}
            </button>
          </div>
        </GlassmorphismCard>

        {/* Decorative element */}
        <div className="mt-12 flex items-center gap-4">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </main>
    </div>
  );
};

export default Portal;
