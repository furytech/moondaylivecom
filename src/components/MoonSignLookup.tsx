import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateMoonSignAsync, MoonSignResult } from "@/lib/moonSign";
import MoonLoader from "@/components/MoonLoader";
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";

interface MoonSignLookupProps {
  onMoonSignCalculated: (result: MoonSignResult & { birthDate: Date; birthTime?: string; birthCity?: string }) => void;
  isPro: boolean;
  onUpgradeClick: () => void;
}

const MoonSignLookup = ({ onMoonSignCalculated, isPro, onUpgradeClick }: MoonSignLookupProps) => {
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const days = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!birthMonth || !birthDay || !birthYear) {
      setError("Please select your birth date");
      return;
    }

    // Pro users need to provide time and city for saving
    if (isPro && (!birthTime || !birthCity)) {
      setError("Please provide your birth time and city for your profile");
      return;
    }

    setLoading(true);

    try {
      const birthDate = new Date(
        parseInt(birthYear),
        parseInt(birthMonth) - 1,
        parseInt(birthDay)
      );

      const result = await calculateMoonSignAsync(birthDate);
      
      onMoonSignCalculated({
        ...result,
        birthDate,
        birthTime: birthTime || undefined,
        birthCity: birthCity || undefined,
      });
    } catch (err) {
      console.error("Error calculating moon sign:", err);
      setError("Failed to calculate moon sign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Birth Date Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-primary/80">
          <Calendar className="w-4 h-4" />
          Birth Date
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Select value={birthMonth} onValueChange={setBirthMonth}>
            <SelectTrigger className="bg-navy-medium/50 border-primary/20 text-foreground h-12">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-background border-primary/30 max-h-60">
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value} className="text-foreground">
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={birthDay} onValueChange={setBirthDay}>
            <SelectTrigger className="bg-navy-medium/50 border-primary/20 text-foreground h-12">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent className="bg-background border-primary/30 max-h-60">
              {days.map((day) => (
                <SelectItem key={day.value} value={day.value} className="text-foreground">
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={birthYear} onValueChange={setBirthYear}>
            <SelectTrigger className="bg-navy-medium/50 border-primary/20 text-foreground h-12">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-background border-primary/30 max-h-60">
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value} className="text-foreground">
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Birth Time - Optional for free, required for Pro */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-primary/80">
          <Clock className="w-4 h-4" />
          Birth Time {!isPro && <span className="text-cream-muted/50">(optional)</span>}
        </label>
        <Input
          type="time"
          value={birthTime}
          onChange={(e) => setBirthTime(e.target.value)}
          className="bg-navy-medium/50 border-primary/20 text-foreground h-12"
          placeholder="Enter birth time"
        />
      </div>

      {/* Birth City - Optional for free, required for Pro */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-primary/80">
          <MapPin className="w-4 h-4" />
          Birth City {!isPro && <span className="text-cream-muted/50">(optional)</span>}
        </label>
        <Input
          type="text"
          value={birthCity}
          onChange={(e) => setBirthCity(e.target.value)}
          className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground h-12"
          placeholder="e.g., New York, NY"
        />
      </div>

      {error && (
        <p className="text-destructive text-sm font-serif text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 font-display text-sm tracking-widest uppercase border border-primary/30 rounded-xl text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-500 flex items-center justify-center gap-3"
      >
        {loading ? (
          <MoonLoader size="sm" />
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Reveal My Moon Sign
          </>
        )}
      </button>

      {!isPro && (
        <p className="text-center font-serif text-sm text-cream-muted/50">
          <button
            type="button"
            onClick={onUpgradeClick}
            className="text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
          >
            Upgrade to Pro
          </button>
          {" "}to save your profile and unlock daily forecasts
        </p>
      )}
    </form>
  );
};

export default MoonSignLookup;
