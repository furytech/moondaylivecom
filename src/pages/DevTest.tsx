import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import moonLogo from "@/assets/moon-logo-new.png";

const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const DevTest = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("test@example.com");
  const [birthDate, setBirthDate] = useState<Date>(new Date(1990, 5, 15));
  const [signA, setSignA] = useState("Gemini");
  const [signB, setSignB] = useState("Cancer");

  const testTransitionFlow = () => {
    navigate("/quiz", {
      state: {
        signA,
        signB,
        birthDate: birthDate.toISOString(),
        email
      }
    });
  };

  const testDirectFlow = () => {
    navigate("/results", {
      state: {
        birthDate: birthDate.toISOString(),
        email,
        isTransitionDay: false
      }
    });
  };

  const testResultsWithQuiz = () => {
    navigate("/results", {
      state: {
        birthDate: birthDate.toISOString(),
        email,
        isTransitionDay: true,
        quizResult: {
          primarySign: signA,
          secondarySign: signB,
          confidence: 78,
          primaryScore: 4,
          secondaryScore: 2
        }
      }
    });
  };

  return (
    <div className="min-h-screen gradient-navy-radial flex flex-col">
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
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <main className="flex-1 flex flex-col items-center px-6 py-8 relative z-10">
        {/* Logo */}
        <div className="mb-4">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--navy-dark))] overflow-hidden flex items-center justify-center">
            <img
              src={moonLogo}
              alt="Moon Sign Quiz Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="font-display text-2xl md:text-3xl text-gold-gradient text-center mb-2 tracking-wider">
          Developer Test Mode
        </h1>
        <p className="font-serif text-sm text-cream-muted text-center mb-8">
          Test different user flows without guessing dates
        </p>

        {/* Test Configuration */}
        <div className="w-full max-w-md space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="font-display text-xs tracking-widest uppercase text-gold-light">
              Test Email
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 font-serif bg-navy-dark/50 border-gold-medium/30 text-cream"
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <label className="font-display text-xs tracking-widest uppercase text-gold-light">
              Test Birth Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-serif h-10 bg-navy-dark/50 border-gold-medium/30 hover:bg-navy-medium/50"
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-gold-medium" />
                  <span className="text-cream">{format(birthDate, "MMMM d, yyyy")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-navy-dark border-gold-medium/30" align="center">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={(date) => date && setBirthDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sign Selection for Quiz */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-display text-xs tracking-widest uppercase text-gold-light">
                Sign A (Primary)
              </label>
              <select
                value={signA}
                onChange={(e) => setSignA(e.target.value)}
                className="w-full h-10 px-3 font-serif bg-navy-dark/50 border border-gold-medium/30 text-cream rounded-md"
              >
                {zodiacSigns.map(sign => (
                  <option key={sign} value={sign} className="bg-navy-dark">{sign}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-display text-xs tracking-widest uppercase text-gold-light">
                Sign B (Secondary)
              </label>
              <select
                value={signB}
                onChange={(e) => setSignB(e.target.value)}
                className="w-full h-10 px-3 font-serif bg-navy-dark/50 border border-gold-medium/30 text-cream rounded-md"
              >
                {zodiacSigns.map(sign => (
                  <option key={sign} value={sign} className="bg-navy-dark">{sign}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Art Deco divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-medium/30 to-transparent" />
            <div className="w-1.5 h-1.5 rotate-45 border border-gold-medium/30" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-medium/30 to-transparent" />
          </div>

          {/* Test Buttons */}
          <div className="space-y-3">
            <button
              onClick={testTransitionFlow}
              className="w-full group art-deco-border bg-gold-medium/10 hover:bg-gold-medium/20 p-4 transition-all"
            >
              <span className="font-display text-sm tracking-widest uppercase text-gold-light">
                Test Transition Quiz Flow
              </span>
              <p className="font-serif text-xs text-cream-muted/60 mt-1">
                Simulates a user born during lunar transition
              </p>
            </button>

            <button
              onClick={testDirectFlow}
              className="w-full group art-deco-border bg-navy-dark/30 hover:bg-gold-medium/10 p-4 transition-all"
            >
              <span className="font-display text-sm tracking-widest uppercase text-gold-light">
                Test Direct Results Flow
              </span>
              <p className="font-serif text-xs text-cream-muted/60 mt-1">
                Simulates a user with clear moon sign (no quiz)
              </p>
            </button>

            <button
              onClick={testResultsWithQuiz}
              className="w-full group art-deco-border bg-navy-dark/30 hover:bg-gold-medium/10 p-4 transition-all"
            >
              <span className="font-display text-sm tracking-widest uppercase text-gold-light">
                Test Results With Confidence
              </span>
              <p className="font-serif text-xs text-cream-muted/60 mt-1">
                Preview results page with quiz data (78% confidence)
              </p>
            </button>
          </div>

          {/* Back link */}
          <button
            onClick={() => navigate("/")}
            className="w-full mt-4 font-serif text-sm text-cream-muted/60 hover:text-gold-light transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-gold-medium/20">
        <p className="text-center text-xs font-serif text-cream-muted/40">
          This page is for development only
        </p>
      </footer>
    </div>
  );
};

export default DevTest;
