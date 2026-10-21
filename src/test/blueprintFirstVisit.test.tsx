import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { savePendingMoonSign } from "../lib/pendingMoonSign";
import { HelmetProvider } from "react-helmet-async";
import Blueprint from "../pages/Blueprint";
import * as AuthContextModule from "../contexts/AuthContext";
import * as useLunarForecastModule from "../hooks/useLunarForecast";

let profile: Record<string, unknown>;
let currentNudge: unknown = undefined;
const updates: Array<Record<string, unknown>> = [];
const invoke = vi.fn().mockResolvedValue({ data: null, error: null });
const updateUser = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => {
  const combo = {
    combination_title: "Test Archetype",
    luminous_expression: ["Warm"],
    combination_synthesis: "One. Two. Three.",
    solar_essence: "Solar.",
    lunar_essence: "Lunar.",
    shadow_synthesis: "Shadow.",
    default_behaviors: [],
  };
  const from = (table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.update = (payload: Record<string, unknown>) => {
      updates.push(payload);
      return chain;
    };
    chain.maybeSingle = async () => ({ data: table === "user_profiles" ? profile : combo, error: null });
    chain.then = (resolve: (v: unknown) => void) => resolve({ error: null });
    return chain;
  };
  return {
    supabase: {
      from,
      rpc: async () => ({ data: false, error: null }),
      functions: { invoke: (...a: unknown[]) => invoke(...a) },
      auth: {
        updateUser: (...a: unknown[]) => updateUser(...a),
        getSession: async () => ({ data: { session: { user: { user_metadata: { share_nudge: currentNudge } } } } }),
      },
    },
  };
});

vi.mock("@/components/Navigation", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));

function renderBlueprint(opts: {
  firstName?: string | null;
  passwordPending?: boolean;
  birthday?: string | null;
  noMoonSign?: boolean;
  /** Which tab the URL asks for; null = no tab in the URL. Defaults to My Blueprint. */
  tab?: "today" | "blueprint" | null;
  /** Account age in days; omitted = an older account */
  ageDays?: number;
  shareNudge?: Record<string, unknown>;
}) {
  currentNudge = opts.shareNudge;
  profile = {
    first_name: opts.firstName ?? null,
    moon_sign: opts.noMoonSign ? null : "Libra",
    natal_moon_sign: opts.noMoonSign ? null : "Libra",
    natal_sun_sign: "Scorpio",
    birthday: opts.birthday === undefined ? "1985-11-03" : opts.birthday,
    subscription_status: "free",
    is_subscriber: false,
  };
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: {
      id: "u1",
      created_at: opts.ageDays === undefined ? undefined : new Date(Date.now() - opts.ageDays * 86400000).toISOString(),
      user_metadata: {
        ...(opts.passwordPending ? { password_pending: true } : {}),
        ...(opts.shareNudge ? { share_nudge: opts.shareNudge } : {}),
      },
    },
    session: { access_token: "t" },
    loading: false,
    subscription: { subscribed: false, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    checkSubscription: vi.fn(),
  } as never);
  vi.spyOn(useLunarForecastModule, "useLunarForecast").mockReturnValue({
    forecast: null,
    triadData: null,
    loading: false,
    error: null,
  } as never);
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[opts.tab === null ? "/blueprint" : `/blueprint?tab=${opts.tab ?? "blueprint"}`]}>
        <Routes>
          <Route path="/blueprint" element={<Blueprint />} />
          <Route path="/transition-quiz" element={<p>quiz page</p>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("Blueprint first visit", () => {
  beforeEach(() => {
    updates.length = 0;
    updateUser.mockClear();
    invoke.mockClear();
    updateUser.mockImplementation(async (arg: { data?: { share_nudge?: unknown } }) => {
      if (arg?.data?.share_nudge) currentNudge = arg.data.share_nudge;
      return { error: null };
    });
    localStorage.clear();
    localStorage.setItem("moonday.onboarding.dismissed", "1");
  });

  it("asks a new member what to call them, and greets them with just 'Welcome' until they answer", async () => {
    renderBlueprint({});
    expect(await screen.findByRole("form", { name: "What should we call you?" })).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.queryByText(/Cosmic Traveler|friend/)).toBeNull();
  });

  it("saves the name to the profile and uses it in the greeting", async () => {
    renderBlueprint({});
    fireEvent.change(await screen.findByPlaceholderText("First name"), { target: { value: "Maya" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Welcome, Maya")).toBeInTheDocument(); // first visit
    expect(updates).toContainEqual({ first_name: "Maya" });
    expect(screen.queryByRole("form", { name: "What should we call you?" })).toBeNull();
  });

  it("lets the member skip, and does not ask again on the next visit", async () => {
    const first = renderBlueprint({});
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
    expect(screen.queryByRole("form", { name: "What should we call you?" })).toBeNull();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(updates).toHaveLength(0);
    first.unmount();

    renderBlueprint({});
    await screen.findByText("Test Archetype");
    expect(screen.queryByRole("form", { name: "What should we call you?" })).toBeNull();
  });

  it("does not ask a member who already has a name, and greets the first visit with 'Welcome, <name>'", async () => {
    renderBlueprint({ firstName: "Maya" });
    expect(await screen.findByText("Welcome, Maya")).toBeInTheDocument();
    expect(screen.queryByText("Welcome back, Maya")).toBeNull();
    expect(screen.queryByRole("form", { name: "What should we call you?" })).toBeNull();
  });

  it("says 'Welcome back, <name>' on later visits", async () => {
    const first = renderBlueprint({ firstName: "Maya" });
    await screen.findByText("Welcome, Maya");
    first.unmount();

    renderBlueprint({ firstName: "Maya" });
    expect(await screen.findByText("Welcome back, Maya")).toBeInTheDocument();
  });

  it("does not use up the first-visit greeting while the password step is showing", async () => {
    const first = renderBlueprint({ firstName: "Maya", passwordPending: true });
    await screen.findByRole("heading", { name: "Set a password to open your Blueprint" });
    first.unmount();

    renderBlueprint({ firstName: "Maya" });
    expect(await screen.findByText("Welcome, Maya")).toBeInTheDocument();
  });

  it("applies the quiz result kept for a Moon-change birthday after confirming, then asks for the Blueprint email", async () => {
    savePendingMoonSign({ birthday: "1985-11-03", sign: "Aries" });
    renderBlueprint({ noMoonSign: true });
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("send-blueprint-email", { body: { type: "EMAIL_CONFIRMED" } }));
    expect(updates).toContainEqual({ moon_sign: "Aries", natal_moon_sign: "Aries", natal_sun_sign: "Scorpio" });
    expect(localStorage.getItem("moonday:pendingMoonSign")).toBeNull();
  });

  it("sends a member with no settled Moon sign to the quiz on their own birthday", async () => {
    renderBlueprint({ noMoonSign: true });
    expect(await screen.findByText("quiz page")).toBeInTheDocument();
    expect(updates).toHaveLength(0);
  });

  it("asks for a password before opening the Blueprint of an account made from the birthday + email step", async () => {
    renderBlueprint({ passwordPending: true });
    expect(await screen.findByRole("heading", { name: "Set a password to open your Blueprint" })).toBeInTheDocument();
    expect(screen.queryByText("Test Archetype")).toBeNull();
    expect(screen.queryByRole("form", { name: "What should we call you?" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Set password and open my Blueprint" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("at least 6 characters");
    expect(updateUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a-long-enough-one" } });
    fireEvent.click(screen.getByRole("button", { name: "Set password and open my Blueprint" }));
    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({ password: "a-long-enough-one", data: { password_pending: false } })
    );
  });
});

const nudgeWrites = () =>
  updateUser.mock.calls.map((c) => c[0]?.data?.share_nudge).filter(Boolean) as Array<Record<string, unknown>>;
const card = () => screen.queryByRole("region", { name: "Share your Moon sign" });

describe("Share-your-Moon-sign nudge on the Blueprint", () => {
  beforeEach(() => {
    updates.length = 0;
    updateUser.mockClear();
    localStorage.clear();
    localStorage.setItem("moonday.onboarding.dismissed", "1");
    currentNudge = undefined;
  });

  it("waits until the name prompt is skipped, then shows once, below the Birth Moon card", async () => {
    renderBlueprint({ ageDays: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));
    expect(await screen.findByRole("region", { name: "Share your Moon sign" })).toBeInTheDocument();
    expect(screen.getByText("Know someone who'd love this?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maybe later" })).toBeInTheDocument();
    await waitFor(() => expect(nudgeWrites()[0]).toMatchObject({ shown: 1 }));
  });

  it("is never on screen at the same time as the name prompt", async () => {
    renderBlueprint({ ageDays: 1 });
    await screen.findByRole("form", { name: "What should we call you?" });
    expect(card()).toBeNull();
  });

  it("shows straight away for a new member who already has a name", async () => {
    renderBlueprint({ ageDays: 2, firstName: "Maya" });
    expect(await screen.findByRole("region", { name: "Share your Moon sign" })).toBeInTheDocument();
  });

  it("never shows to an older member, a member who shared, or one who dismissed it twice", async () => {
    const cases: Array<Parameters<typeof renderBlueprint>[0]> = [
      { firstName: "Maya", ageDays: 90 },
      { firstName: "Maya", ageDays: 2, shareNudge: { shown: 1, first_shown_at: new Date().toISOString(), shared_at: new Date().toISOString() } },
      { firstName: "Maya", ageDays: 20, shareNudge: { shown: 1, first_shown_at: new Date(Date.now() - 9 * 86400000).toISOString(), dismissed: 2 } },
    ];
    for (const c of cases) {
      const r = renderBlueprint(c);
      await screen.findByText(/Welcome/);
      await waitFor(() => expect(screen.queryByText("Test Archetype")).not.toBeNull());
      expect(card()).toBeNull();
      r.unmount();
    }
  });

  it("does not show again within 7 days of the first showing, then once as a reminder, then never again", async () => {
    const day = 86400000;
    const early = renderBlueprint({ firstName: "Maya", ageDays: 10, shareNudge: { shown: 1, first_shown_at: new Date(Date.now() - 3 * day).toISOString() } });
    await screen.findByText("Test Archetype");
    expect(card()).toBeNull();
    early.unmount();

    const reminder = renderBlueprint({ firstName: "Maya", ageDays: 10, shareNudge: { shown: 1, first_shown_at: new Date(Date.now() - 8 * day).toISOString() } });
    expect(await screen.findByRole("region", { name: "Share your Moon sign" })).toBeInTheDocument();
    await waitFor(() => expect(nudgeWrites().at(-1)).toMatchObject({ shown: 2 }));
    reminder.unmount();

    renderBlueprint({ firstName: "Maya", ageDays: 20, shareNudge: { shown: 2, first_shown_at: new Date(Date.now() - 15 * day).toISOString() } });
    await screen.findByText("Test Archetype");
    expect(card()).toBeNull();
  });

  it("'Maybe later' closes it and is counted on the account", async () => {
    renderBlueprint({ firstName: "Maya", ageDays: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Maybe later" }));
    expect(card()).toBeNull();
    await waitFor(() => expect(nudgeWrites().at(-1)).toMatchObject({ shown: 1, dismissed: 1 }));
  });

  it("counts a share click on the account and stops nudging once they shared", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    renderBlueprint({ firstName: "Maya", ageDays: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Share" }));

    await waitFor(() => expect(nudgeWrites().at(-1)).toMatchObject({ clicks: 1 }));
    expect(nudgeWrites().at(-1)?.shared_at).toBeTruthy();
    // only the member's own sign and its public link are shared
    const shared = share.mock.calls[0][0];
    expect(shared.url).toBe("https://moondaylive.com/shared-moon/libra");
    expect(JSON.stringify(shared)).not.toMatch(/1985|Scorpio|birthday/i);
    expect(await screen.findByText("Thank you for sharing. It means a lot.")).toBeInTheDocument();
    delete (navigator as { share?: unknown }).share;
  });
});

