import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { savePendingMoonSign } from "../lib/pendingMoonSign";
import { HelmetProvider } from "react-helmet-async";
import Blueprint from "../pages/Blueprint";
import * as AuthContextModule from "../contexts/AuthContext";
import * as useLunarForecastModule from "../hooks/useLunarForecast";

let profile: Record<string, unknown>;
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
      auth: { updateUser: (...a: unknown[]) => updateUser(...a) },
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
}) {
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
    user: { id: "u1", user_metadata: opts.passwordPending ? { password_pending: true } : {} },
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
      <MemoryRouter initialEntries={["/blueprint"]}>
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
