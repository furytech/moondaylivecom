import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import moonLogo from "@/assets/moon-logo-new.png";
import { 
  selectQuestionsForSigns, 
  calculateQuizResult, 
  QuizQuestion 
} from "@/lib/transitionQuiz";
import { getMoonSignByName } from "@/lib/moonSign";
import { saveUserSignup } from "@/lib/userService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TransitionQuiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B'>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [signA, setSignA] = useState<string>("");
  const [signB, setSignB] = useState<string>("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [email, setEmail] = useState<string>("");
  const [redirectTo, setRedirectTo] = useState<string>("/results");
  const [isProfileSetup, setIsProfileSetup] = useState(false);

  useEffect(() => {
    const state = location.state as { 
      signA?: string; 
      signB?: string; 
      birthDate?: string;
      email?: string;
      redirectTo?: string;
      isProfileSetup?: boolean;
    } | null;
    
    if (!state?.signA || !state?.signB || !state?.birthDate) {
      navigate("/signup");
      return;
    }
    
    setSignA(state.signA);
    setSignB(state.signB);
    setBirthDate(new Date(state.birthDate));
    setEmail(state.email || "");
    setRedirectTo(state.redirectTo || "/results");
    setIsProfileSetup(state.isProfileSetup || false);
    
    const selectedQuestions = selectQuestionsForSigns(state.signA, state.signB, 5);
    setQuestions(selectedQuestions);
  }, [location.state, navigate]);

  const handleAnswer = (answer: 'A' | 'B') => {
    const currentQuestion = questions[currentIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleComplete = async () => {
    const result = calculateQuizResult(signA, signB, answers);
    const moonSignData = getMoonSignByName(result.primarySign);
    
    // If this is a profile setup flow, update user_profiles instead
    if (isProfileSetup && user && birthDate && moonSignData) {
      try {
        await supabase
          .from("user_profiles")
          .update({
            birthday: format(birthDate, "yyyy-MM-dd"),
            moon_sign: moonSignData.sign,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);
        
        // Navigate back to blueprint
        navigate("/blueprint");
        return;
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
    
    // Standard signup flow - save to signups table
    if (birthDate && email && moonSignData) {
      try {
        await saveUserSignup(email, birthDate, moonSignData);
      } catch (error) {
        console.error("Error saving quiz result:", error);
      }
    }
    
    // Navigate to results with quiz data
    navigate("/results", {
      state: {
        birthDate: birthDate?.toISOString(),
        email,
        quizResult: result,
        isTransitionDay: true
      }
    });
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen gradient-navy-radial flex items-center justify-center">
        <div className="animate-pulse text-gold-light font-display text-xl">
          Preparing your cosmic questions...
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + (isComplete ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
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
      <main className="flex-1 flex flex-col items-center pt-20 pb-6 px-6 relative z-10">
        {/* Logo */}
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

        {/* Title */}
        <h1 className="font-display text-2xl md:text-3xl text-gold-gradient text-center mb-2 tracking-wider">
          The Moon Was Shifting...
        </h1>

        <p className="font-serif text-sm md:text-base text-cream-muted text-center max-w-md mb-6">
          You were born during a lunar transition between{" "}
          <span className="text-gold-light">{signA}</span> and{" "}
          <span className="text-gold-light">{signB}</span>. 
          Let's discover which energy resonates more deeply with your soul.
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-md mb-8">
          <div className="flex justify-between text-xs font-display text-cream-muted/60 mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1 bg-navy-dark/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gold-medium to-gold-light transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {!isComplete ? (
          /* Question Card */
          <div className="w-full max-w-lg">
            <div className="art-deco-border bg-navy-dark/40 p-6 md:p-8 mb-6">
              <p className="font-serif text-lg md:text-xl text-cream text-center leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              <button
                onClick={() => handleAnswer('A')}
                className="w-full group art-deco-border bg-navy-dark/30 hover:bg-gold-medium/10 p-5 transition-all duration-300"
              >
                <span className="font-serif text-cream group-hover:text-gold-light transition-colors">
                  {currentQuestion.optionA.text}
                </span>
              </button>

              <button
                onClick={() => handleAnswer('B')}
                className="w-full group art-deco-border bg-navy-dark/30 hover:bg-gold-medium/10 p-5 transition-all duration-300"
              >
                <span className="font-serif text-cream group-hover:text-gold-light transition-colors">
                  {currentQuestion.optionB.text}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Completion state */
          <div className="w-full max-w-md text-center">
            <div className="art-deco-border bg-navy-dark/40 p-8 mb-8">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="font-display text-xl text-gold-light mb-3">
                Your Path Is Clear
              </h2>
              <p className="font-serif text-cream-muted">
                The stars have aligned. Your true Moon sign awaits...
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="group relative px-10 py-4 font-display text-base tracking-widest uppercase overflow-hidden art-deco-border bg-gold-medium/10 hover:bg-gold-medium/20 transition-all duration-500"
            >
              <span className="relative z-10 text-gold-light group-hover:text-gold-pale transition-colors">
                Reveal My Moon Sign
              </span>
            </button>
          </div>
        )}

        {/* Back link */}
        {!isComplete && (
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              } else {
                navigate("/signup");
              }
            }}
            className="mt-8 font-serif text-sm text-cream-muted/60 hover:text-gold-light transition-colors"
          >
            ← {currentIndex > 0 ? "Previous question" : "Back to signup"}
          </button>
        )}
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

export default TransitionQuiz;
