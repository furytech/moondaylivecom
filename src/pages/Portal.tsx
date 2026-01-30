import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import moonLogo from "@/assets/moon-logo-new.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MoonLoader from "@/components/MoonLoader";
import CelestialBackground from "@/components/CelestialBackground";
import GlassmorphismCard from "@/components/GlassmorphismCard";

const Portal = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/pricing");
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
        navigate("/pricing");
      } else {
        await signUp(email, password);
        setSignupSuccess(true);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.message?.includes("User already registered")) {
        setError("This email is already registered. Please sign in.");
      } else if (error.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password");
      } else if (error.message?.includes("Email not confirmed")) {
        setError("Please check your email to confirm your account");
      } else {
        setError(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <CelestialBackground />

        <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
          <div className="w-full max-w-md text-center">
            <div className="flex justify-center mb-12 animate-fade-up">
              <img
                src={moonLogo}
                alt="Moonday"
                className="w-44 h-auto cursor-pointer hover-scale-subtle drop-shadow-2xl"
                onClick={() => navigate("/")}
              />
            </div>

            <GlassmorphismCard className="animate-fade-up stagger-1">
              <div className="w-24 h-24 rounded-full glass-card flex items-center justify-center mx-auto mb-8 shadow-glow">
                <span className="text-5xl">✨</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-4">
                Check Your Email
              </h1>
              <p className="font-serif text-xl text-cream-muted mb-6">
                We've sent a confirmation link to <strong className="text-primary">{email}</strong>
              </p>
              <p className="font-serif text-lg text-cream-muted/70">
                Click the link in your email to activate your account, then return here to begin your lunar journey.
              </p>

              <button
                onClick={() => {
                  setSignupSuccess(false);
                  setIsLogin(true);
                }}
                className="mt-10 font-serif text-lg text-cream-muted elegant-hover"
              >
                ← Back to sign in
              </button>
            </GlassmorphismCard>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <CelestialBackground />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-12 animate-fade-up">
            <div 
              className="cursor-pointer hover-scale-subtle"
              onClick={() => navigate("/")}
            >
              <img
                src={moonLogo}
                alt="Moonday"
                className="w-44 h-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Ritual Invitation Card */}
          <GlassmorphismCard className="animate-fade-up stagger-1">
            {/* Title */}
            <div className="text-center mb-10">
              <p className="font-serif text-sm text-primary/70 uppercase tracking-widest mb-3">
                The Ritual Invitation
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-gold-gradient tracking-wider mb-3">
                {isLogin ? "Welcome Back" : "Join the Cosmos"}
              </h1>
              <p className="font-serif text-xl text-cream-muted">
                {isLogin 
                  ? "Enter your celestial credentials" 
                  : "Begin your lunar journey"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-lg rounded-xl"
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-lg rounded-xl"
                />
              </div>

              {!isLogin && (
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-lg rounded-xl"
                  />
                </div>
              )}

              {error && (
                <p className="text-destructive text-lg font-serif text-center py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 font-display text-base tracking-widest uppercase glass-card hover:shadow-glow text-primary border-0 transition-all duration-500 rounded-xl"
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

            {/* Toggle */}
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="font-serif text-lg text-cream-muted elegant-hover"
              >
                {isLogin 
                  ? "New here? Accept the invitation" 
                  : "Already initiated? Sign in"}
              </button>
            </div>
          </GlassmorphismCard>

          {/* Decorative element */}
          <div className="flex justify-center mt-10">
            <div className="flex items-center gap-3">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="w-2 h-2 rotate-45 border border-primary/30" />
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portal;
