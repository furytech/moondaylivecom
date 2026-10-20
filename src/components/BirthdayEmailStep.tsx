import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BirthdayPicker, { type BirthdayParts } from "@/components/BirthdayPicker";
import MoonLoader from "@/components/MoonLoader";
import { buildBirthday, isValidBirthday, revealForBirthday } from "@/lib/birthdayReveal";
import { formatBirthdayLong } from "@/lib/cuspDay";
import { saveSignupDraft } from "@/lib/signupDraft";
import { detectTimezoneOption } from "@/lib/timezone";
import { trackEvent } from "@/lib/analytics";
import { useCreateRevealAccount } from "@/hooks/useCreateRevealAccount";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The only way to see a Sun or Moon sign: give a birthday and an email. Submitting creates the account
 * (the birthday is locked to it) and shows the reveal. Used in the homepage hero, on /find-my-moon-sign
 * and on /birthday-moon-phase.
 */
const BirthdayEmailStep = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createAccount = useCreateRevealAccount();

  const [parts, setParts] = useState<BirthdayParts>({ month: "", day: "", year: "" });
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const birthday = buildBirthday(parts.year, parts.month, parts.day);
  const complete = parts.year !== "" && parts.month !== "" && parts.day !== "";
  const validBirthday = isValidBirthday(birthday);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validBirthday) {
      setError(complete ? "That date doesn't exist. Please check the month and day." : "Please choose your birth month, day and year.");
      return;
    }
    const cleanEmail = email.trim();
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const timezone = detectTimezoneOption();
      const reveal = await revealForBirthday(birthday, timezone);
      trackEvent("moon_reveal_submit", { moon_change_birthday: reveal.isCuspDay });
      if (reveal.isCuspDay || !reveal.moonSign) {
        // Moon-change birthday: the quiz settles the sign, then the account is created.
        saveSignupDraft({ birthday, timezone, email: cleanEmail });
        navigate("/transition-quiz");
        return;
      }
      await createAccount({ email: cleanEmail, birthday, timezone, moonSign: reveal.moonSign });
    } catch (err) {
      const message = (err as { message?: string }).message ?? "";
      setError(
        /rate limit|only request this after/i.test(message)
          ? "Too many attempts. Please wait a minute and try again."
          : message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left" aria-label="Find your Moon sign">
      <div className="space-y-2">
        <p className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1 text-left">Your birthday</p>
        <BirthdayPicker
          value={parts}
          onChange={(next) => {
            setParts(next);
            setError("");
          }}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="reveal-email" className="block text-xs tracking-[0.2em] uppercase text-lilac/80 pl-1">
          Your email
        </label>
        <input
          id="reveal-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          className="w-full h-12 px-4 rounded-xl bg-background/40 border border-lilac/20 text-foreground placeholder:text-muted-foreground/80 focus:border-lilac/60 focus:outline-none focus:ring-2 focus:ring-lilac/20 transition-all duration-300"
        />
      </div>

      {validBirthday && (
        <p
          data-testid="birthday-lock-notice"
          className="rounded-xl border border-lilac/25 bg-lilac/5 px-4 py-3 text-[15px] leading-relaxed text-cream/90 text-left"
        >
          This will be your birthday on Moonday: <span className="text-foreground font-medium">{formatBirthdayLong(birthday)}</span>.
          It's locked once you continue.
        </p>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm text-left">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full min-h-12 px-5 py-3 bg-lilac hover:bg-lilac-light text-primary-foreground font-sans text-[15px] font-medium normal-case tracking-normal rounded-xl transition-all duration-300 shadow-[0_0_40px_-8px_hsl(var(--lilac)/0.7)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {submitting ? <MoonLoader size="sm" /> : "Reveal my Moon sign"}
      </button>

      <p className="text-xs text-muted-foreground/80 leading-relaxed text-left">
        Free. Birthday only: we never ask for your birth time or place. We'll email you a link to confirm.
      </p>

      <p className="text-sm text-muted-foreground text-left">
        Already have an account?{" "}
        <Link to="/login" className="inline-flex items-center min-h-11 text-lilac underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default BirthdayEmailStep;
