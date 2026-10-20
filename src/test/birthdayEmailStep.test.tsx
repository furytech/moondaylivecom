import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import * as AuthContextModule from "../contexts/AuthContext";
import BirthdayEmailStep from "../components/BirthdayEmailStep";
import FindMoonSign from "../pages/FindMoonSign";
import { HelmetProvider } from "react-helmet-async";
import { clearSignupDraft, loadSignupDraft } from "../lib/signupDraft";
import { clearRevealState, loadRevealState } from "../lib/revealState";
import { getLocalCuspDay } from "../lib/cuspDay";
import { detectTimezoneOption } from "../lib/timezone";

// Radix selects are awkward in jsdom: stand in plain inputs for the three birthday controls.
vi.mock("@/components/BirthdayPicker", () => ({
  default: ({ value, onChange }: { value: { month: string; day: string; year: string }; onChange: (v: never) => void }) => (
    <div>
      {(["month", "day", "year"] as const).map((k) => (
        <input
          key={k}
          aria-label={`pick ${k}`}
          value={value[k]}
          onChange={(e) => onChange({ ...value, [k]: e.target.value } as never)}
        />
      ))}
    </div>
  ),
}));
const resend = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { resend: (...a: unknown[]) => resend(...a) } },
}));
vi.mock("@/components/Navigation", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));

const signUp = vi.fn();

const Where = () => {
  const loc = useLocation();
  return (
    <p>
      at {loc.pathname}
      {loc.search}
    </p>
  );
};

function setup(ui: JSX.Element) {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: null,
    session: null,
    loading: false,
    subscription: { subscribed: false, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null },
    signIn: vi.fn(),
    signUp,
    signOut: vi.fn(),
    checkSubscription: vi.fn(),
  } as never);
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/start"]}>
        <Routes>
          <Route path="/start" element={ui} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

function findBirthday(wantCusp: boolean) {
  const tz = detectTimezoneOption();
  for (let d = 10; d < 30; d++) {
    const birthday = `1990-06-${d}`;
    if (getLocalCuspDay(birthday, tz).isCuspDay === wantCusp) return birthday;
  }
  throw new Error("no matching birthday");
}

function fill(birthday: string, email: string) {
  const [y, m, d] = birthday.split("-");
  fireEvent.change(screen.getByLabelText("pick month"), { target: { value: m } });
  fireEvent.change(screen.getByLabelText("pick day"), { target: { value: d } });
  fireEvent.change(screen.getByLabelText("pick year"), { target: { value: y } });
  fireEvent.change(screen.getByLabelText("Your email"), { target: { value: email } });
}

describe("Birthday + email step", () => {
  beforeEach(() => {
    clearSignupDraft();
    clearRevealState();
    signUp.mockReset();
    signUp.mockResolvedValue({ status: "created" });
    resend.mockReset();
    resend.mockResolvedValue({ error: null });
    localStorage.clear();
  });

  it("asks for exactly a birthday and an email, and nothing else", () => {
    setup(<FindMoonSign />);
    expect(screen.getByRole("heading", { name: "Find your Moon sign" })).toBeInTheDocument();
    expect(screen.getByLabelText("Your email")).toBeInTheDocument();
    expect(document.querySelectorAll("input")).toHaveLength(4); // three birthday controls + email
    expect(screen.queryByLabelText(/password/i)).toBeNull();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("shows no sign and creates no account without a valid birthday and email", async () => {
    setup(<BirthdayEmailStep />);
    fireEvent.click(screen.getByRole("button", { name: "Reveal my Moon sign" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("birth month, day and year");

    fill("1985-03-07", "not-an-email");
    fireEvent.click(screen.getByRole("button", { name: "Reveal my Moon sign" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("valid email");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("tells the visitor which date will be locked before they submit", () => {
    setup(<BirthdayEmailStep />);
    expect(screen.queryByTestId("birthday-lock-notice")).toBeNull();
    fill("1985-03-07", "");
    expect(screen.getByTestId("birthday-lock-notice")).toHaveTextContent(
      "This will be your birthday on Moonday: March 7, 1985."
    );
  });

  it("creates the account with a random password and the birthday, then shows the reveal", async () => {
    const birthday = findBirthday(false);
    setup(<BirthdayEmailStep />);
    fill(birthday, "friend+test@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Reveal my Moon sign" }));

    await waitFor(() => expect(screen.getByText(/^at \/your-moon-sign/)).toBeInTheDocument());
    expect(signUp).toHaveBeenCalledTimes(1);
    const [email, password, bd, moon, , sun, name, options] = signUp.mock.calls[0];
    expect(email).toBe("friend+test@example.com");
    expect(password.length).toBeGreaterThanOrEqual(24); // random, never typed or shown
    expect(bd).toBe(birthday);
    expect(moon).toBe(getLocalCuspDay(birthday, detectTimezoneOption()).from);
    expect(sun).toBe("Gemini");
    expect(name).toBeUndefined();
    expect(options).toEqual({ passwordPending: true, deferMoonSign: false });
    expect(loadRevealState()).toMatchObject({ kind: "reveal", email: "friend+test@example.com", birthday });
  });

  it("sends an email that already has an account to sign-in, with no reveal", async () => {
    signUp.mockResolvedValue({ status: "existing" });
    setup(<BirthdayEmailStep />);
    fill(findBirthday(false), "taken@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Reveal my Moon sign" }));

    await waitFor(() => expect(screen.getByText(/^at \/login/)).toBeInTheDocument());
    expect(screen.getByText(/exists=1/)).toBeInTheDocument();
    expect(loadRevealState()).toBeNull();
  });

  it("creates the pending account before the quiz on a Moon-change birthday, with no Moon sign guessed", async () => {
    const birthday = findBirthday(true);
    setup(<BirthdayEmailStep />);
    fill(birthday, "cusp@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Reveal my Moon sign" }));

    await waitFor(() => expect(screen.getByText("at /transition-quiz")).toBeInTheDocument());
    expect(signUp).toHaveBeenCalledTimes(1);
    const [email, , bd, moon, , , , options] = signUp.mock.calls[0];
    expect(email).toBe("cusp@example.com");
    expect(bd).toBe(birthday);
    expect(moon).toBeUndefined(); // never silently picked
    expect(options).toEqual({ passwordPending: true, deferMoonSign: true });
    expect(loadSignupDraft()).toMatchObject({ birthday, email: "cusp@example.com" });
    expect(loadRevealState()).toBeNull(); // nothing is revealed until the quiz has settled the sign
  });

  it("only resends the link when this browser already started a signup for the email, whatever birthday is typed", async () => {
    const first = findBirthday(false);
    const { unmount } = setup(<BirthdayEmailStep />);
    fill(first, "again@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Reveal my Moon sign" }));
    await waitFor(() => expect(screen.getByText(/^at \/your-moon-sign/)).toBeInTheDocument());
    expect(signUp).toHaveBeenCalledTimes(1);
    unmount();

    setup(<BirthdayEmailStep />);
    fill("1992-03-21", "Again@Example.com");
    fireEvent.click(screen.getByRole("button", { name: "Reveal my Moon sign" }));
    await waitFor(() => expect(screen.getByText(/^at \/your-moon-sign/)).toBeInTheDocument());

    expect(signUp).toHaveBeenCalledTimes(1); // the second submit never reached signUp: no birthday or data can travel
    expect(resend).toHaveBeenCalledTimes(1);
    expect(resend.mock.calls[0][0]).toMatchObject({ type: "signup", email: "Again@Example.com" });
    expect(JSON.stringify(resend.mock.calls[0][0])).not.toMatch(/1992|birthday/);
    // and nothing about the new birthday is kept or shown
    expect(loadRevealState()).toEqual({ kind: "resent", email: "Again@Example.com" });
  });
});
