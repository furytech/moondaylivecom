import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MIN_BIRTH_YEAR } from "@/lib/birthdayReveal";

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ value: String(i + 1).padStart(2, "0"), label }));

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1),
}));

export interface BirthdayParts {
  month: string;
  day: string;
  year: string;
}

interface BirthdayPickerProps {
  value: BirthdayParts;
  onChange: (next: BirthdayParts) => void;
}

const triggerClass =
  "w-full h-12 px-2.5 sm:px-3 rounded-xl bg-background/40 border border-lilac/20 text-sm text-foreground text-left focus:border-lilac/60 focus:ring-2 focus:ring-lilac/20 transition-all duration-300";

/** Month, day and year as one birthday control. No default year: a pre-filled year would give strangers the wrong Moon sign. */
const BirthdayPicker = ({ value, onChange }: BirthdayPickerProps) => {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - MIN_BIRTH_YEAR + 1 }, (_, i) => String(currentYear - i));

  return (
    <div className="grid grid-cols-[1.4fr_1fr_1.1fr] gap-2 sm:gap-3">
      <Select value={value.month} onValueChange={(month) => onChange({ ...value, month })}>
        <SelectTrigger id="birthMonth" aria-label="Birth month" className={triggerClass}>
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent className="bg-navy-dark border-lilac/30 max-h-60">
          {MONTH_OPTIONS.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-foreground">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.day} onValueChange={(day) => onChange({ ...value, day })}>
        <SelectTrigger id="birthDay" aria-label="Birth day" className={triggerClass}>
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent className="bg-navy-dark border-lilac/30 max-h-60">
          {DAY_OPTIONS.map((d) => (
            <SelectItem key={d.value} value={d.value} className="text-foreground">
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.year} onValueChange={(year) => onChange({ ...value, year })}>
        <SelectTrigger id="birthYear" aria-label="Birth year" className={triggerClass}>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="bg-navy-dark border-lilac/30 max-h-60">
          {yearOptions.map((y) => (
            <SelectItem key={y} value={y} className="text-foreground">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BirthdayPicker;
