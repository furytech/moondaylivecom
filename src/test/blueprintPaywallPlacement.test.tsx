import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Blueprint from "../pages/Blueprint";
import * as AuthContextModule from "../contexts/AuthContext";
import * as useLunarForecastModule from "../hooks/useLunarForecast";

let profile: Record<string, unknown>;

vi.mock("@/integrations/supabase/client", () => {
  const combo = {
    combination_title: "Test Archetype",
    luminous_expression: ["Warm", "Curious"],
    combination_synthesis: "First synthesis sentence. Second synthesis sentence. Third synthesis sentence.",
    solar_essence: "Solar.",
    lunar_essence: "Lunar.",
    shadow_synthesis: "Shadow.",
    default_behaviors: [],
  };
  const from = (table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.maybeSingle = async () => ({ data: table === "user_profiles" ? profile : combo, error: null });
    return chain;
  };
  return { supabase: { from, rpc: async () => ({ data: false, error: null }), functions: { invoke: vi.fn() } } };
});

vi.mock("@/components/Navigation", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));

const triad = {
  physical_guidance: "First body sentence. Second body sentence. Third body sentence.",
  emotional_guidance: "Air currents invite your watery feelings to express verbally.",
  spiritual_guidance: "Observe the distinction between passing thoughts and sacred intuition.",
  daily_ritual: "Write three pages before sunrise.",
  shadow_activation: "Intellectualizing emotional pain.",
  integration_invitation: "Let logic and instinct hold hands.",
};

function renderBlueprint(subscribed: boolean) {
  profile = {
    first_name: "Maya",
    moon_sign: "Libra",
    natal_moon_sign: "Libra",
    natal_sun_sign: "Scorpio",
    birthday: "1985-11-03",
    subscription_status: subscribed ? "sovereign" : "free",
    is_subscriber: subscribed,
  };
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: { id: "u1", user_metadata: {} },
    session: { access_token: "t" },
    loading: false,
    isSubscribed: subscribed,
    subscription: { subscribed, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    checkSubscription: vi.fn(),
  } as never);
  vi.spyOn(useLunarForecastModule, "useLunarForecast").mockReturnValue({
    forecast: null,
    triadData: triad,
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

const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("Blueprint paywall placement", () => {
  beforeEach(() => {
    localStorage.setItem("moonday.onboarding.dismissed", "1");
  });

  it("puts the single upgrade card after every free section, preceded by a faded peek at the first locked one", async () => {
    renderBlueprint(false);

    const gate = await screen.findByText("Now you know who you are.");
    const hero = screen.getByRole("heading", { level: 1, name: "Test Archetype" });
    const preview = screen.getByText("Blueprint Preview");
    const forecast = screen.getByText("Daily Lunar Forecast");
    const bodyToday = screen.getByText("Your body today");
    const lockedPeek = screen.getByTestId("locked-section-preview");

    // free content first, in order, then the locked peek, then the offer
    expect(follows(hero, preview)).toBe(true);
    expect(follows(preview, forecast)).toBe(true);
    expect(follows(forecast, bodyToday)).toBe(true);
    expect(follows(bodyToday, lockedPeek)).toBe(true);
    expect(follows(lockedPeek, gate)).toBe(true);

    // directly after the peek: nothing but wrapper elements between them
    expect(screen.getAllByText("Now you know who you are.")).toHaveLength(1);
    expect(screen.getAllByText("UNLOCK LUMINARY — $6.88/month")).toHaveLength(1);
  });

  it("shows no upgrade card and no locked peek to Luminary members", async () => {
    renderBlueprint(true);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Test Archetype" })).toBeDefined());
    expect(screen.queryByText("Now you know who you are.")).toBeNull();
    expect(screen.queryByTestId("locked-section-preview")).toBeNull();
    expect(screen.queryByText(/UNLOCK LUMINARY/)).toBeNull();
  });
});
