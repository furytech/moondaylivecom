import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MoonLoader from "@/components/MoonLoader";

export const PORTAL_ERROR_TEXT =
  "We couldn't open your membership page just now. Please try again in a moment, or email support@moondaylive.com and we'll cancel it for you.";

interface ManageMembershipButtonProps {
  className?: string;
}

/** One-click path to Stripe's customer portal (cancel, update card, invoices).
 *  Same-tab redirect; shows a plain-language message if it fails. Paid members only. */
const ManageMembershipButton = ({ className = "" }: ManageMembershipButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("no session");
      const { data, error: fnError } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fnError) throw fnError;
      if (!data?.url) throw new Error("no portal url");
      window.location.href = data.url;
    } catch (err) {
      console.error("Portal error:", err);
      setError(PORTAL_ERROR_TEXT);
      setLoading(false);
    }
  };

  return (
    <div className={`text-center ${className}`}>
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-6 py-3 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 font-sans text-[15px] md:text-base text-primary transition-all duration-300 disabled:opacity-50"
      >
        {loading ? (
          <MoonLoader size="sm" />
        ) : (
          <>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Manage or cancel membership
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-left font-sans text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

export default ManageMembershipButton;
