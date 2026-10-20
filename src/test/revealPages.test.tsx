import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import * as AuthContextModule from "../contexts/AuthContext";
import YourMoonSign from "../pages/YourMoonSign";
import SharedMoon from "../pages/SharedMoon";
import TransitionQuiz from "../pages/TransitionQuiz";
import Portal from "../pages/Portal";
import { clearRevealState, loadRevealState, saveRevealState } from "../lib/revealState";
import { loadPendingMoonSign } from "../lib/pendingMoonSign";
import { CUSP_COPY } from "../lib/moonCuspQuiz";
import { supabase } from "../integrations/supabase/client";
import { clearSignupDraft, loadSignupDraft, saveSignupDraft } from "../lib/signupDraft";
import { getLocalCuspDay } from "../lib/cuspDay";
import { detectTimezoneOption } from "../lib/timezone";
import { buildSharedMoonPageSeo, moonOgImage, parseShareSign, sharedMoonUrl } from "../lib/sharedMoonSeo";

vi.mock("@/components/Navigation", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));

function auth(user: unknown = null) {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user,
    session: null,
    loading: false,
    subscription: { subscribed: false, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    checkSubscription: vi.fn(),
  } as never);
}

function renderAt(path: string, routes: Array<[string, JSX.Element]>) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {routes.map(([p, el]) => (
            <Route key={p} path={p} element={el} />
          ))}
          <Route path="*" element={<p>elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("/your-moon-sign (the reveal, after account creation)", () => {
  beforeEach(() => {
    clearRevealState();
    auth();
  });

  it("goes home when there is no account behind it", () => {
    renderAt("/your-moon-sign", [["/your-moon-sign", <YourMoonSign />]]);
    expect(screen.getByText("elsewhere")).toBeInTheDocument();
  });

  it("shows the Moon sign, archetype, Sun sign and a locked teaser, then the set-a-password path", () => {
    saveRevealState({ kind: "reveal", email: "a@b.co", birthday: "1985-11-03", sunSign: "Scorpio", moonSign: "Cancer" });
    renderAt("/your-moon-sign", [["/your-moon-sign", <YourMoonSign />]]);

    expect(screen.getByRole("heading", { level: 1, name: "Cancer Moon" })).toBeInTheDocument();
    expect(screen.getByText("The Nurturer · Water")).toBeInTheDocument();
    expect(screen.getByText("Your Sun sign: Scorpio")).toBeInTheDocument();
    expect(screen.getByText("Your Scorpio Sun × Cancer Moon Blueprint is ready.")).toBeInTheDocument();
    expect(screen.getByText(/Confirm it,\s+then set a password to open your Blueprint/)).toBeInTheDocument();
    expect(screen.getByText(/November 3, 1985, is now locked to this account/)).toBeInTheDocument();
    // nothing from the combination profile
    expect(screen.queryByText(/Natal Blueprint|Your Blueprint Identity/)).toBeNull();
  });

  it("shows no new reveal for an email that already started signing up", () => {
    saveRevealState({ kind: "resent", email: "a@b.co" });
    renderAt("/your-moon-sign", [["/your-moon-sign", <YourMoonSign />]]);
    expect(screen.getByRole("heading", { name: "Confirm your email" })).toBeInTheDocument();
    expect(screen.queryByText("Cancer Moon")).toBeNull();
    expect(screen.queryByText("Your Sun sign: Scorpio")).toBeNull();
  });
});

describe("/shared-moon/:sign", () => {
  beforeEach(() => auth());

  it("shows only the sharer's sign and archetype, and invites a visitor to create an account", () => {
    renderAt("/shared-moon/cancer", [["/shared-moon/:sign", <SharedMoon />]]);
    expect(screen.getByRole("heading", { level: 1, name: "Cancer Moon" })).toBeInTheDocument();
    expect(screen.getByText("The Nurturer · Water")).toBeInTheDocument();
    expect(screen.getByText("Find your own Moon sign: create your free account.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find my Moon sign" })).toHaveAttribute("href", "/find-my-moon-sign");
    // no birthday, no Sun sign, no combination content
    expect(screen.queryByText(/Sun/)).toBeNull();
    expect(screen.queryByText(/19\d\d|20\d\d/)).toBeNull();
  });

  it("never sends a signed-in member to signup", () => {
    auth({ id: "u1" });
    renderAt("/shared-moon/leo", [["/shared-moon/:sign", <SharedMoon />]]);
    expect(screen.getByRole("link", { name: "Open your Blueprint" })).toHaveAttribute("href", "/blueprint");
  });

  it("ignores anything that is not a sign", () => {
    renderAt("/shared-moon/ophiuchus", [["/shared-moon/:sign", <SharedMoon />]]);
    expect(screen.getByText("elsewhere")).toBeInTheDocument();
  });

  it("builds one lowercase link and one social image per sign", () => {
    expect(parseShareSign("CANCER")).toBe("Cancer");
    expect(parseShareSign("nope")).toBeNull();
    expect(sharedMoonUrl("Cancer")).toBe("https://moondaylive.com/shared-moon/cancer");
    expect(moonOgImage("Sagittarius")).toBe("https://moondaylive.com/og/moon-sagittarius.png");
    const seo = buildSharedMoonPageSeo("Cancer");
    expect(seo.title).toBe("Cancer Moon: The Nurturer — Moonday Live");
    expect(seo.ogImage).toBe("https://moondaylive.com/og/moon-cancer.png");
    expect(seo.description).not.toMatch(/\d{4}/);
  });
});

describe("/transition-quiz takes no birthday from the URL", () => {
  beforeEach(() => {
    clearSignupDraft();
    auth();
  });

  it("ignores ?birthday= for a visitor with no signup in progress", async () => {
    renderAt("/transition-quiz?birthday=1990-06-16&tz=UTC", [["/transition-quiz", <TransitionQuiz />]]);
    expect(await screen.findByText(/Start with your birthday/)).toBeInTheDocument();
    expect(screen.queryByText(/June 16, 1990/)).toBeNull();
  });

  it("uses the birthday from the current signup, not the one in the URL", async () => {
    const tz = detectTimezoneOption();
    let birthday = "";
    for (let d = 10; d < 30 && !birthday; d++) {
      if (getLocalCuspDay(`1990-06-${d}`, tz).isCuspDay) birthday = `1990-06-${d}`;
    }
    saveSignupDraft({ birthday, timezone: tz, email: "a@b.co" });
    renderAt("/transition-quiz?birthday=1975-01-02", [["/transition-quiz", <TransitionQuiz />]]);
    const day = getLocalCuspDay(birthday, tz);
    expect(await screen.findByText(new RegExp(`${day.from}.{1,3}${day.to}`))).toBeInTheDocument();
    expect(screen.queryByText(/January 2, 1975/)).toBeNull();
  });
});

describe("Moon Cusp Quiz for a visitor whose pending account already exists", () => {
  beforeEach(() => {
    clearSignupDraft();
    clearRevealState();
    localStorage.clear();
    auth();
  });

  it("settles the sign, keeps it for after confirmation, and shows the reveal without creating anything", async () => {
    const tz = detectTimezoneOption();
    let birthday = "";
    for (let d = 10; d < 30 && !birthday; d++) {
      if (getLocalCuspDay(`1990-06-${d}`, tz).isCuspDay) birthday = `1990-06-${d}`;
    }
    saveSignupDraft({ birthday, timezone: tz, email: "cusp@example.com" });
    renderAt("/transition-quiz", [
      ["/transition-quiz", <TransitionQuiz />],
      ["/your-moon-sign", <p>reveal page</p>],
    ]);

    fireEvent.click(await screen.findByRole("button", { name: new RegExp(CUSP_COPY.intro.cta.slice(0, 12)) }));
    for (let i = 0; i < 5; i++) {
      const options = screen.getAllByRole("button").filter((b) => b.className.includes("rounded-2xl"));
      fireEvent.click(options[0]);
    }
    // a close result lets the person choose; a clear one settles itself
    const pick = screen.queryAllByRole("button", { name: /feels like me|Choose|This is me/i })[0];
    if (pick) fireEvent.click(pick);

    await waitFor(() => expect(screen.getByText("reveal page")).toBeInTheDocument());
    const pending = loadPendingMoonSign();
    expect(pending?.birthday).toBe(birthday);
    expect(loadRevealState()).toMatchObject({ kind: "reveal", email: "cusp@example.com", birthday, moonSign: pending?.sign });
    expect(loadSignupDraft()).toBeNull();
  });
});

describe("sign-in page", () => {
  beforeEach(() => auth());

  it("points an existing email to sign-in and offers no account creation", () => {
    renderAt("/login?email=a%40b.co&exists=1", [["/login", <Portal />]]);
    expect(screen.getByText(/already has a Moonday account/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("a@b.co");
    expect(screen.queryByLabelText(/confirm/i)).toBeNull();
    expect(screen.getByRole("link", { name: /Find your moon sign/ })).toHaveAttribute("href", "/find-my-moon-sign");
  });

  it("offers an emailed sign-in link that never creates an account", async () => {
    const otp = vi.spyOn(supabase.auth, "signInWithOtp").mockResolvedValue({ data: { user: null, session: null }, error: null } as never);
    renderAt("/login", [["/login", <Portal />]]);

    fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter your email");
    expect(otp).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "stuck@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If that email has a Moonday account");
    expect(otp).toHaveBeenCalledWith({
      email: "stuck@example.com",
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    });
  });

  it("gives an address with no account the same answer, so it never says who has one", async () => {
    vi.spyOn(supabase.auth, "signInWithOtp").mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Signups not allowed for otp", status: 422 },
    } as never);
    renderAt("/login", [["/login", <Portal />]]);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nobody@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If that email has a Moonday account");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
