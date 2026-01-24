import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import moonLogo from "@/assets/moon-logo-new.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MoonLoader from "@/components/MoonLoader";

const Portal = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/blueprint");
    return null;
  }

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
      } else {
        await signUp(email, password);
      }
      navigate("/blueprint");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Invalid email or password");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-pale rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.4 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-10 animate-fade-up">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden cursor-pointer hover-scale-subtle"
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
          <div className="art-deco-border brass-glow bg-card/40 backdrop-blur-sm p-10 md:p-12 animate-fade-up stagger-1">
            {/* Title */}
            <h1 className="font-display text-2xl md:text-4xl text-gold-gradient text-center mb-3 tracking-wider">
              {isLogin ? "Welcome Back" : "Join the Cosmos"}
            </h1>
            <p className="font-serif text-lg text-cream-muted text-center mb-10">
              {isLogin 
                ? "Enter your celestial credentials" 
                : "Begin your lunar journey"}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary h-14 font-serif text-base"
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary h-14 font-serif text-base"
                />
              </div>

              {!isLogin && (
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary h-14 font-serif text-base"
                  />
                </div>
              )}

              {error && (
                <p className="text-destructive text-base font-serif text-center">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 font-display text-sm tracking-widest uppercase bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 brass-glow transition-all duration-300"
              >
                {loading ? (
                  <MoonLoader size="sm" />
                ) : isLogin ? (
                  "Enter the Portal"
                ) : (
                  "Create Account"
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
                className="font-serif text-base text-cream-muted elegant-hover"
              >
                {isLogin 
                  ? "New here? Create an account" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>

          {/* Decorative element */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="w-1.5 h-1.5 rotate-45 border border-primary/30" />
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portal;
