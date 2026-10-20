import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Blueprint from "../pages/Blueprint";
import * as AuthContextModule from "../contexts/AuthContext";
import * as useLunarForecastModule from "../hooks/useLunarForecast";

let profile: Record<string, unknown>;
const updates: Array<Record<string, unknown>> = [];
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
      functions: { invoke: vi.fn() },
      auth: { updateUser: (...a: unknown[]) => updateUser(...a) },
    },
  };
});

vi.mock("@/components/Navigation", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));

function renderBlueprint(opts: { firstName?: string | null; passwordPending?: boolean; birthday?: string | null }) {
  profile = {
    first_name: opts.firstName ?? null,
    moon_sign: "Libra",
    natal_moon_sign: "Libra",
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
      <MemoryRouter>
        <Blueprint />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("Blueprint first visit", () => {
  beforeEach(() => {
    updates.length = 0;
    updateUser.mockClear();
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

    expect(await screen.findByText("Welcome back, Maya")).toBeInTheDocument();
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

  it("does not ask a member who already has a name", async () => {
    renderBlueprint({ firstName: "Maya" });
    expect(await screen.findByText("Welcome back, Maya")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "What should we call you?" })).toBeNull();
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
