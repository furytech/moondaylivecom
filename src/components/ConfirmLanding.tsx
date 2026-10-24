import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  GRACE_MS,
  advancedRecently,
  arrivedViaConfirmLink,
  clearConfirmLanding,
  confirmOutcome,
  type ConfirmOutcome,
} from "@/lib/confirmLanding";

/** Shown on the tab a confirmation link opens. It confirms, then either continues to the Blueprint or, when
 *  the "Check your inbox" tab already moved the member on, says this tab can be closed. */
const ConfirmLanding = ({ arrived = arrivedViaConfirmLink() }: { arrived?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(arrived);
  const [outcome, setOutcome] = useState<ConfirmOutcome | null>(null);

  // Nothing ever signs in (expired or reused link): stop covering the page.
  useEffect(() => {
    if (!active || user) return;
    const t = setTimeout(() => {
      clearConfirmLanding();
      setActive(false);
    }, 8000);
    return () => clearTimeout(t);
  }, [active, user]);

  useEffect(() => {
    if (!active || !user) return;
    const t = setTimeout(() => {
      const result = confirmOutcome(advancedRecently());
      if (result === "continue") {
        clearConfirmLanding();
        setActive(false);
        navigate("/blueprint", { replace: true });
      } else {
        setOutcome(result);
      }
    }, GRACE_MS);
    return () => clearTimeout(t);
  }, [active, user, navigate]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4" role="status" aria-live="polite">
      <div className="max-w-md w-full text-center space-y-4">
        <MailCheck className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
        <h1 className="font-sans text-2xl normal-case tracking-normal font-semibold text-foreground">
          {user ? "You're confirmed" : "Confirming your email"}
        </h1>
        {outcome === "close-tab" ? (
          <>
            <p className="text-base text-cream/90 text-center">You're confirmed. You can close this tab.</p>
            <Link
              to="/blueprint"
              onClick={() => { clearConfirmLanding(); setActive(false); }}
              className="inline-flex items-center justify-center min-h-11 px-5 text-primary underline underline-offset-4"
            >
              Or continue here
            </Link>
          </>
        ) : (
          <p className="text-base text-cream/90 text-center">{user ? "Opening your Blueprint…" : "One moment…"}</p>
        )}
      </div>
    </div>
  );
};

export default ConfirmLanding;
