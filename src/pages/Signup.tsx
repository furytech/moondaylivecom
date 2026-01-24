import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import moonLogo from "@/assets/moon-logo-new.png";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState<Date>();
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required to continue");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!birthDate) {
      return;
    }

    // TODO: Store in Firebase when configured
    console.log("Signup data:", { email, birthDate });

    // Navigate to results with data
    navigate("/results", {
      state: {
        birthDate: birthDate.toISOString(),
        email: email.trim()
      }
    });
  };

  const isFormValid = email.trim() && birthDate && validateEmail(email);

  return (
    <div className="min-h-screen gradient-navy-radial flex flex-col">
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

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo */}
        <div className="animate-float mb-6">
          <img
            src={moonLogo}
            alt="Moon Sign Quiz Logo"
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-gold-gradient text-center mb-2 tracking-wider">
          Your Celestial Details
        </h1>

        {/* Subtitle */}
        <p className="font-serif text-base md:text-lg text-cream-muted text-center max-w-md mb-10 leading-relaxed">
          Enter your birth date and email to unlock the secrets of your Moon sign
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          {/* Birthday Picker */}
          <div className="space-y-2">
            <label className="font-display text-sm tracking-widest uppercase text-gold-light">
              Date of Birth
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-serif h-12 bg-navy-dark/50 border-gold-medium/30 hover:bg-navy-medium/50 hover:border-gold-medium/50 transition-all",
                    !birthDate && "text-cream-muted"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-gold-medium" />
                  {birthDate ? (
                    <span className="text-cream">{format(birthDate, "MMMM d, yyyy")}</span>
                  ) : (
                    <span>Select your birth date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 bg-navy-dark border-gold-medium/30" 
                align="center"
              >
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="font-display text-sm tracking-widest uppercase text-gold-light">
              Email Address <span className="text-gold-medium">*</span>
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className={cn(
                "h-12 font-serif bg-navy-dark/50 border-gold-medium/30 placeholder:text-cream-muted/50 text-cream focus:border-gold-medium focus:ring-gold-medium/20",
                emailError && "border-red-500/50"
              )}
              required
            />
            {emailError && (
              <p className="text-sm text-red-400 font-serif">{emailError}</p>
            )}
          </div>

          {/* Art Deco decorative line */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gold-medium/50 to-transparent" />
            <div className="w-1.5 h-1.5 rotate-45 border border-gold-medium/50" />
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gold-medium/50 to-transparent" />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={cn(
              "w-full group relative px-10 py-4 font-display text-base tracking-widest uppercase overflow-hidden art-deco-border transition-all duration-500",
              isFormValid
                ? "bg-gold-medium/10 hover:bg-gold-medium/20 cursor-pointer"
                : "bg-transparent opacity-50 cursor-not-allowed"
            )}
          >
            <span className="relative z-10 text-gold-light group-hover:text-gold-pale transition-colors">
              Reveal My Moon Sign
            </span>
            {isFormValid && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-gold" />
            )}
          </button>

          {/* Privacy note */}
          <p className="text-center text-xs text-cream-muted/60 font-serif">
            We respect your privacy and will never share your information
          </p>
        </form>

        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          className="mt-8 font-serif text-sm text-cream-muted/60 hover:text-gold-light transition-colors"
        >
          ← Back to home
        </button>
      </main>

      {/* Art Deco footer accent */}
      <footer className="py-6 border-t border-gold-medium/20">
        <div className="flex justify-center items-center gap-3">
          <div className="w-8 h-px bg-gold-medium/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-gold-medium/50" />
          <div className="w-8 h-px bg-gold-medium/30" />
        </div>
      </footer>
    </div>
  );
};

export default Signup;
