import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import * as AuthContextModule from "../contexts/AuthContext";
import YourMoonSign from "../pages/YourMoonSign";
import SharedMoon from "../pages/SharedMoon";
import TransitionQuiz from "../pages/TransitionQuiz";
import Portal from "../pages/Portal";
import { clearRevealState, saveRevealState } from "../lib/revealState";
import { clearSignupDraft, saveSignupDraft } from "../lib/signupDraft";
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
    saveRevealState({ kind: "resent", email: "a@b.co", birthday: "1985-11-03", sunSign: "Scorpio", moonSign: "Cancer" });
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

describe("sign-in page", () => {
  beforeEach(() => auth());

  it("points an existing email to sign-in and offers no account creation", () => {
    renderAt("/login?email=a%40b.co&exists=1", [["/login", <Portal />]]);
    expect(screen.getByText(/already has a Moonday account/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("a@b.co");
    expect(screen.queryByLabelText(/confirm/i)).toBeNull();
    expect(screen.getByRole("link", { name: /Find your moon sign/ })).toHaveAttribute("href", "/find-my-moon-sign");
  });
});
