import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FindMoonSign from "../pages/FindMoonSign";
import * as AuthContextModule from "../contexts/AuthContext";
import { clearSignupDraft, loadSignupDraft, saveSignupDraft } from "../lib/signupDraft";
import { getLocalCuspDay } from "../lib/cuspDay";
import { detectTimezoneOption } from "../lib/timezone";

const Where = () => {
  const loc = useLocation();
  return (
    <p>
      at {loc.pathname}
      {loc.search}
    </p>
  );
};

function renderReveal() {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: null,
    session: null,
    loading: false,
    isSubscribed: false,
    subscription: { subscribed: false, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    checkSubscription: vi.fn(),
  } as never);
  const queryClient = new QueryClient();
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/find-my-moon-sign"]}>
          <Routes>
            <Route path="/find-my-moon-sign" element={<FindMoonSign />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

/** First birthday in a run of days that is (or is not) a Moon-change day in this machine's detected zone. */
function findBirthday(wantCusp: boolean) {
  const tz = detectTimezoneOption();
  for (let d = 10; d < 30; d++) {
    const birthday = `1990-06-${d}`;
    if (getLocalCuspDay(birthday, tz).isCuspDay === wantCusp) return birthday;
  }
  throw new Error("no matching birthday");
}

// The picker is prefilled from the saved draft, which is how a visitor returns here via "Change".
describe("Find my Moon sign (reveal before signup)", () => {
  beforeEach(() => clearSignupDraft());

  it("asks only for a birthday until one is chosen", () => {
    renderReveal();
    expect(screen.getByRole("heading", { name: "Find your Moon sign" })).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.queryByText("Create your free account to open it")).toBeNull();
  });

  it("reveals Moon sign, archetype, Sun sign and a locked Blueprint teaser with no combination content", async () => {
    const birthday = findBirthday(false);
    saveSignupDraft({ birthday, timezone: detectTimezoneOption(), moonSign: null });
    renderReveal();

    expect(await screen.findByText("Your Moon sign")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Moon$/ })).toBeInTheDocument();
    expect(screen.getByText(/^Your Sun sign: /)).toBeInTheDocument();
    expect(screen.getByText(/^The .+ · (Fire|Earth|Air|Water)$/)).toBeInTheDocument();
    expect(screen.getByText(/Sun × \w+ Moon Blueprint is ready\./)).toBeInTheDocument();
    expect(screen.queryByText(/Your Blueprint Identity|Natal Blueprint/)).toBeNull();
  });

  it("carries the birthday and Moon sign to signup", async () => {
    const birthday = findBirthday(false);
    saveSignupDraft({ birthday, timezone: detectTimezoneOption(), moonSign: null });
    renderReveal();

    fireEvent.click(await screen.findByRole("button", { name: "Create your free account to open it" }));
    await waitFor(() => expect(screen.getByText(/^at \/signup/)).toBeInTheDocument());
    expect(loadSignupDraft()).toMatchObject({ birthday, moonSign: expect.any(String) });
  });

  it("shows both candidate Moon signs on a Moon-change birthday and routes to the quiz, not the teaser", async () => {
    const birthday = findBirthday(true);
    const day = getLocalCuspDay(birthday, detectTimezoneOption());
    saveSignupDraft({ birthday, timezone: detectTimezoneOption(), moonSign: null });
    renderReveal();

    expect(await screen.findByText("Moon-change birthday")).toBeInTheDocument();
    expect(screen.getByText(day.from)).toBeInTheDocument();
    expect(screen.getByText(day.to)).toBeInTheDocument();
    expect(screen.queryByText("Create your free account to open it")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Take the Moon quiz/ }));
    await waitFor(() =>
      expect(screen.getByText(new RegExp(`^at /transition-quiz\\?birthday=${birthday}`))).toBeInTheDocument()
    );
  });

  it("keeps a settled quiz result when the visitor comes back via Change", async () => {
    const birthday = findBirthday(true);
    const day = getLocalCuspDay(birthday, detectTimezoneOption());
    saveSignupDraft({ birthday, timezone: detectTimezoneOption(), moonSign: day.to });
    renderReveal();

    expect(await screen.findByRole("heading", { level: 2, name: `${day.to} Moon` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create your free account to open it" })).toBeInTheDocument();
  });
});
