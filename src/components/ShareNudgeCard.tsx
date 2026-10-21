import { useState } from "react";
import { Copy, Facebook, Mail, Share2, Twitter } from "lucide-react";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { emailShareUrl, facebookShareUrl, shareLink, shareMessage, shareTitle, twitterShareUrl } from "@/lib/shareMoon";
import { toast } from "@/hooks/use-toast";

interface ShareNudgeCardProps {
  /** The member's own Moon sign */
  sign: string;
  /** Called on every share press; `completed` is false when the person backed out of the share sheet */
  onShareClick: (method: string, completed: boolean) => void;
  onDismiss: () => void;
}

const optionClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 font-sans text-[15px] normal-case tracking-normal transition-colors";

/** A soft, dismissible invitation to share the member's own Moon sign. Warm, never pushy. */
const ShareNudgeCard = ({ sign, onShareClick, onDismiss }: ShareNudgeCardProps) => {
  const [options, setOptions] = useState(false);
  const [thanked, setThanked] = useState(false);
  const url = shareLink(sign);

  const handleShare = async () => {
    // Phones: the native share sheet. Desktop: show the options.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, text: shareMessage(sign), url });
        onShareClick("native", true);
        setThanked(true);
      } catch {
        onShareClick("native", false); // backed out of the sheet
      }
      return;
    }
    setOptions(true);
  };

  const finish = (method: string) => {
    onShareClick(method, true);
    setThanked(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Anyone who opens it sees your Moon sign and can find their own." });
      finish("copy");
    } catch {
      toast({ title: "Could not copy", description: url, variant: "destructive" });
    }
  };

  const open = (method: string, href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
    finish(method);
  };

  if (thanked) {
    return (
      <GlassmorphismCard className="mt-8 animate-fade-up" size="sm">
        <p role="status" className="font-serif text-base text-cream-muted text-left">
          Thank you for sharing. It means a lot.
        </p>
      </GlassmorphismCard>
    );
  }

  return (
    <GlassmorphismCard className="mt-8 animate-fade-up" size="sm">
      <section aria-label="Share your Moon sign" className="space-y-4 text-left">
        <div className="space-y-1">
          <h2 className="font-sans text-lg normal-case tracking-normal font-semibold text-foreground text-center">
            Know someone who'd love this?
          </h2>
          <p className="font-serif text-base text-cream-muted text-left">Share your Moon sign with them.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 min-h-12 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-[15px] font-medium normal-case tracking-normal rounded-xl transition-all duration-300 inline-flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" /> Share
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 min-h-12 px-5 py-3 border border-primary/30 text-primary hover:bg-primary/10 font-sans text-[15px] normal-case tracking-normal rounded-xl transition-all duration-300"
          >
            Maybe later
          </button>
        </div>

        {options && (
          <div className="grid grid-cols-2 gap-3" aria-label="Share options">
            <button type="button" onClick={handleCopy} className={optionClass}>
              <Copy className="w-4 h-4" aria-hidden="true" /> Copy link
            </button>
            <button type="button" onClick={() => open("x", twitterShareUrl(sign))} className={optionClass}>
              <Twitter className="w-4 h-4" aria-hidden="true" /> X
            </button>
            <button type="button" onClick={() => open("facebook", facebookShareUrl(sign))} className={optionClass}>
              <Facebook className="w-4 h-4" aria-hidden="true" /> Facebook
            </button>
            <button type="button" onClick={() => open("email", emailShareUrl(sign))} className={optionClass}>
              <Mail className="w-4 h-4" aria-hidden="true" /> Email
            </button>
          </div>
        )}
      </section>
    </GlassmorphismCard>
  );
};

export default ShareNudgeCard;
