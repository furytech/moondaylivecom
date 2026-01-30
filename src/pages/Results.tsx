import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { calculateMoonSignAsync, getMoonSignByName, MoonSignResult } from "@/lib/moonSign";
import { QuizResult } from "@/lib/transitionQuiz";
import moonLogo from "@/assets/moon-logo-new.png";

interface LocationState {
  birthDate?: string;
  email?: string;
  quizResult?: QuizResult;
  isTransitionDay?: boolean;
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [moonSign, setMoonSign] = useState<MoonSignResult | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isTransitionDay, setIsTransitionDay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMoonSign = async () => {
      const state = location.state as LocationState | null;
      
      if (!state?.birthDate) {
        navigate("/signup");
        return;
      }

      const birthDate = new Date(state.birthDate);
      
      // Check if this came from the transition quiz
      if (state.isTransitionDay && state.quizResult) {
        setIsTransitionDay(true);
        setQuizResult(state.quizResult);
        const signData = getMoonSignByName(state.quizResult.primarySign);
        if (signData) {
          setMoonSign(signData);
        }
      } else {
        // Use async accurate calculation
        const result = await calculateMoonSignAsync(birthDate);
        setMoonSign(result);
      }
      
      // Extract name from email for personalization
      if (state.email) {
        const namePart = state.email.split("@")[0];
        setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      }
      
      setIsLoading(false);
    };

    loadMoonSign();
  }, [location.state, navigate]);

  if (isLoading || !moonSign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gold-light font-display text-xl">
          Consulting the cosmos...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
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
      <main className="flex-1 flex flex-col items-center px-6 py-12 relative z-10">
        {/* Logo */}
        <div className="animate-float mb-8">
          <div 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden cursor-pointer hover-scale-subtle"
            onClick={() => navigate("/")}
          >
            <img
              src={moonLogo}
              alt="Moonday"
              className="w-full h-full object-cover drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Personalized greeting */}
        <p className="font-serif text-cream-muted text-center mb-2">
          {userName ? `${userName}, your inner world is guided by...` : "Your inner world is guided by..."}
        </p>

        {/* Moon Sign Symbol */}
        <div className="text-7xl md:text-8xl mb-4 animate-glow">
          {moonSign.symbol}
        </div>

        {/* Moon Sign Name */}
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-gold-gradient text-center mb-2 tracking-wider">
          {moonSign.sign} Moon
        </h1>

        {/* Element badge */}
        <div className="flex items-center gap-2 mb-8">
          <span className="font-display text-sm tracking-widest uppercase text-cream-muted/80">
            {moonSign.element} Element
          </span>
        </div>

        {/* Confidence section (for transition day results) */}
        {isTransitionDay && quizResult && (
          <div className="max-w-md w-full mb-8">
            <div className="art-deco-border bg-navy-dark/40 p-6">
              <h3 className="font-display text-sm tracking-widest uppercase text-gold-light mb-4 text-center">
                Cosmic Confidence
              </h3>
              
              {/* Confidence meter */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-serif text-cream-muted mb-2">
                  <span>Match Strength</span>
                  <span className="text-gold-light">{quizResult.confidence}%</span>
                </div>
                <div className="h-2 bg-navy-dark/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-medium to-gold-light transition-all duration-1000"
                    style={{ width: `${quizResult.confidence}%` }}
                  />
                </div>
              </div>
              
              {/* Primary and Secondary */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs font-display tracking-widest uppercase text-cream-muted/60 mb-1">
                    Primary Match
                  </p>
                  <p className="font-serif text-gold-light">{quizResult.primarySign}</p>
                </div>
                <div>
                  <p className="text-xs font-display tracking-widest uppercase text-cream-muted/60 mb-1">
                    Secondary Resonance
                  </p>
                  <p className="font-serif text-cream-muted">{quizResult.secondarySign}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Art Deco divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-gold-medium to-transparent" />
          <div className="w-2 h-2 rotate-45 border border-gold-medium" />
          <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-gold-medium to-transparent" />
        </div>

        {/* Description card */}
        <div className="max-w-2xl w-full art-deco-border bg-navy-dark/30 p-6 md:p-8 mb-8">
          <p className="font-serif text-lg md:text-xl text-cream leading-relaxed text-center">
            {moonSign.description}
          </p>
        </div>

        {/* Traits section */}
        <div className="max-w-2xl w-full mb-8">
          <h2 className="font-display text-lg tracking-widest uppercase text-gold-light text-center mb-4">
            Your Emotional Traits
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {moonSign.traits.map((trait, index) => (
              <span
                key={index}
                className="px-4 py-2 font-serif text-sm text-cream border border-gold-medium/30 bg-navy-dark/50"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Emotional style section */}
        <div className="max-w-xl w-full art-deco-border bg-navy-medium/20 p-6 mb-10">
          <h3 className="font-display text-sm tracking-widest uppercase text-gold-light mb-3 text-center">
            How You Process Emotions
          </h3>
          <p className="font-serif text-cream-muted text-center leading-relaxed">
            {moonSign.emotionalStyle}
          </p>
        </div>

        {/* Art Deco divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-8 h-px bg-gold-medium/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-gold-medium/50" />
          <div className="w-8 h-px bg-gold-medium/30" />
        </div>

        {/* CTA section */}
        <div className="text-center space-y-4">
          <p className="font-serif text-cream-muted/80 max-w-md">
            Want to explore more about your celestial blueprint?
          </p>
          <button
            onClick={() => navigate("/")}
            className="group relative px-8 py-3 font-display text-sm tracking-widest uppercase overflow-hidden art-deco-border bg-transparent hover:bg-gold-medium/10 transition-all duration-500"
          >
            <span className="relative z-10 text-gold-light group-hover:text-gold-pale transition-colors">
              Start Over
            </span>
          </button>
        </div>
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

export default Results;
