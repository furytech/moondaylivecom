import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { differsFromUTC, zoneAbbreviation } from "@/lib/timezone";
import { cn } from "@/lib/utils";

interface UTCNoticeProps {
  /** Override the zone (e.g. an admin previewing another member's clock). */
  timezone?: string;
  className?: string;
}

/**
 * A small "i" marker shown only when the reader's timezone is not UTC.
 * Moon content is scheduled and published on UTC; this tells them so.
 */
export const UTCNotice = ({ timezone, className }: UTCNoticeProps) => {
  const { timezone: profileZone } = useUserTimezone();
  const zone = timezone ?? profileZone;

  if (!differsFromUTC(zone)) return null;

  const abbr = zoneAbbreviation(zone);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Moon times are published on UTC. Your clock is ${abbr}.`}
            className={cn(
              "inline-flex items-center justify-center rounded-full text-primary/70 hover:text-primary transition-colors align-middle",
              className
            )}
          >
            <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[16rem] bg-navy-dark border-primary/30 text-cream-muted text-xs leading-relaxed"
        >
          Moon content is calculated and published on <strong className="text-primary">UTC</strong>.
          You're set to <strong className="text-primary">{abbr}</strong>, so times shown in your
          clock may fall on a different calendar day.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UTCNotice;
