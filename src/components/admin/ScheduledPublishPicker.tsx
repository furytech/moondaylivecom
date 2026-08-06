import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ScheduledPublishPickerProps {
  /** ISO timestamp, or null when nothing is scheduled. */
  value?: string | null;
  /** Emits the ISO timestamp (or null when cleared). */
  onChange: (isoValue: string | null) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local "HH:mm" for the given instant, defaulting to 09:00 when unset. */
const timeValue = (date: Date | null) => (date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "09:00");

const formatLabel = (date: Date) =>
  date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const ScheduledPublishPicker = ({ value, onChange }: ScheduledPublishPickerProps) => {
  const parsed = value ? new Date(value) : null;
  const current = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;

  const applyDate = (day?: Date) => {
    if (!day) return;
    const [h, m] = timeValue(current).split(":").map(Number);
    const next = new Date(day);
    next.setHours(h, m, 0, 0);
    onChange(next.toISOString());
  };

  const applyTime = (raw: string) => {
    if (!raw) return;
    const [h, m] = raw.split(":").map(Number);
    const next = current ? new Date(current) : new Date();
    next.setHours(h, m, 0, 0);
    onChange(next.toISOString());
  };

  const isFuture = current ? current.getTime() > Date.now() : false;

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !current && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {current ? formatLabel(current) : <span>Pick a date &amp; time</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={current ?? undefined}
            onSelect={applyDate}
            defaultMonth={current ?? undefined}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="flex items-center gap-2 border-t border-border/50 p-3">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Time</label>
            <input
              type="time"
              value={timeValue(current)}
              onChange={(e) => applyTime(e.target.value)}
              className="flex-1 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {current
            ? isFuture
              ? "Future date — the post will be marked Scheduled."
              : "Now or past — the post will be marked Published."
            : "No schedule set."}
        </span>
        {current && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default ScheduledPublishPicker;
