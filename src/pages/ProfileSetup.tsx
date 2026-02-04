import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageLayout from "@/components/PageLayout";
import { calculateMoonSignAsync, checkTransitionDay } from "@/lib/moonSign";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MoonLoader from "@/components/MoonLoader";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [birthDate, setBirthDate] = useState<Date>();
  const [birthHour, setBirthHour] = useState<string>("");
  const [birthMinute, setBirthMinute] = useState<string>("");
  const [birthCity, setBirthCity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Generate hour options (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  // Generate minute options (00, 15, 30, 45)
  const minutes = ["00", "15", "30", "45"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!birthDate) {
      setError("Please select your birth date");
      return;
    }

    if (!user) {
      setError("You must be logged in to set up your profile");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if this is a transition day
      const transitionCheck = await checkTransitionDay(birthDate);
      
      if (transitionCheck.isTransitionDay) {
        // Navigate to quiz for transition day with redirect back to blueprint
        navigate("/quiz", {
          state: {
            signA: transitionCheck.signAtStart,
            signB: transitionCheck.signAtEnd,
            birthDate: birthDate.toISOString(),
            email: user.email,
            redirectTo: "/blueprint",
            isProfileSetup: true
          }
        });
        return;
      }

      // Calculate moon sign directly using accurate ephemeris
      const moonSign = await calculateMoonSignAsync(birthDate);

      // Build birth time string if provided
      const birthTime = birthHour && birthMinute ? `${birthHour}:${birthMinute}:00` : null;

      // Update user profile in database
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          birthday: format(birthDate, "yyyy-MM-dd"),
          moon_sign: moonSign.sign,
          birth_time: birthTime,
          birth_city: birthCity.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Navigate back to blueprint to see the personalized forecast
      navigate("/blueprint");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout showFooter={false}>
      {/* Decorative element */}
      <div className="flex items-center justify-center gap-3 mb-6 animate-fade-up">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-display text-sm text-primary uppercase tracking-widest">
          Complete Your Profile
        </span>
        <Sparkles className="w-5 h-5 text-primary" />
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-gold-gradient text-center mb-2 tracking-wider animate-fade-up stagger-1">
        Reveal Your Birth Moon
      </h1>

      {/* Subtitle */}
      <p className="font-serif text-base md:text-lg text-cream-muted text-center max-w-md mb-10 leading-relaxed animate-fade-up stagger-2">
        Enter your birth details to unlock your personalized Daily Forecast and discover how today's moon interacts with your natal moon
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 animate-fade-up stagger-3">
        {/* Birthday Picker */}
        <div className="space-y-2">
          <label className="font-display text-sm tracking-widest uppercase text-gold-light flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
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
              className="w-auto p-0 bg-navy-dark border-gold-medium/30 z-[100]" 
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

        {/* Birth Time (Optional) */}
        <div className="space-y-2">
          <label className="font-display text-sm tracking-widest uppercase text-gold-light flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time of Birth
            <span className="text-cream-muted/50 font-serif text-xs normal-case tracking-normal">(optional)</span>
          </label>
          <div className="flex gap-3">
            <Select value={birthHour} onValueChange={setBirthHour}>
              <SelectTrigger className="flex-1 h-12 bg-navy-dark/50 border-gold-medium/30 hover:bg-navy-medium/50 hover:border-gold-medium/50 font-serif">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent className="bg-navy-dark border-gold-medium/30 max-h-[200px] z-[100]">
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour} className="font-serif text-cream hover:bg-gold-medium/20">
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="flex items-center text-gold-medium text-xl">:</span>
            <Select value={birthMinute} onValueChange={setBirthMinute}>
              <SelectTrigger className="flex-1 h-12 bg-navy-dark/50 border-gold-medium/30 hover:bg-navy-medium/50 hover:border-gold-medium/50 font-serif">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent className="bg-navy-dark border-gold-medium/30 z-[100]">
                {minutes.map((min) => (
                  <SelectItem key={min} value={min} className="font-serif text-cream hover:bg-gold-medium/20">
                    {min}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-cream-muted/50 font-serif">
            If unknown, we'll use noon as the default
          </p>
        </div>

        {/* Birth City (Optional) */}
        <div className="space-y-2">
          <label className="font-display text-sm tracking-widest uppercase text-gold-light flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Birth City
            <span className="text-cream-muted/50 font-serif text-xs normal-case tracking-normal">(optional)</span>
          </label>
          <Input
            type="text"
            value={birthCity}
            onChange={(e) => setBirthCity(e.target.value)}
            placeholder="e.g., New York, London"
            className="h-12 bg-navy-dark/50 border-gold-medium/30 hover:bg-navy-medium/50 hover:border-gold-medium/50 font-serif text-cream placeholder:text-cream-muted/50"
            maxLength={100}
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 font-serif text-center">{error}</p>
        )}

        {/* Art Deco decorative line */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-gold-medium/50 to-transparent" />
          <div className="w-1.5 h-1.5 rotate-45 border border-gold-medium/50" />
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-gold-medium/50 to-transparent" />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!birthDate || isSubmitting}
          className={cn(
            "w-full group relative px-10 py-4 font-display text-base tracking-widest uppercase overflow-hidden art-deco-border transition-all duration-500",
            birthDate && !isSubmitting
              ? "bg-gold-medium/10 hover:bg-gold-medium/20 cursor-pointer"
              : "bg-transparent opacity-50 cursor-not-allowed"
          )}
        >
          <span className="relative z-10 text-gold-light group-hover:text-gold-pale transition-colors flex items-center justify-center gap-3">
            {isSubmitting ? (
              <>
                <MoonLoader size="sm" />
                Consulting the cosmos...
              </>
            ) : (
              "Unlock My Forecast"
            )}
          </span>
          {birthDate && !isSubmitting && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-gold" />
          )}
        </button>

        {/* Info note */}
        <p className="text-center text-xs text-cream-muted/60 font-serif">
          Your birth moon sign reveals your emotional blueprint and inner nature
        </p>
      </form>

      {/* Back link */}
      <button
        onClick={() => navigate("/blueprint")}
        className="mt-8 font-serif text-sm text-cream-muted/60 hover:text-gold-light transition-colors"
      >
        ← Back to Blueprint
      </button>
    </PageLayout>
  );
};

export default ProfileSetup;
