import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Blueprint from "../pages/Blueprint";
import * as AuthContextModule from "../contexts/AuthContext";
import * as useLunarForecastModule from "../hooks/useLunarForecast";

let profile: Record<string, unknown>;
const updateUser = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => {
  const combo = {
    combination_title: "Test Archetype",
    luminous_expression: ["Warm and open-hearted, you notice what others miss and say so kindly.", "Curious"],
    combination_synthesis: "First synthesis sentence. Second synthesis sentence. Third synthesis sentence.",
    solar_essence: "A solar essence that continues for a good while longer than eight words.",
    lunar_essence: "Lunar essence text.",
    shadow_synthesis: "Shadow.",
    default_behaviors: [],
  };
  const from = (table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.update = () => chain;
    chain.maybeSingle = async () => ({ data: table === "user_profiles" ? profile : combo, error: null });
    chain.then = (resolve: (v: unknown) => void) => resolve({ error: null });
    return chain;
  };
  return {
    supabase: {
      from,
      rpc: async () => ({ data: false, error: null }),
      functions: { invoke: vi.fn() },
      auth: {
        updateUser: (...a: unknown[]) => updateUser(...a),
        getSession: async () => ({ data: { session: null } }),
      },
    },
  };
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

const Where = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <p data-testid="search">{loc.search}</p>
      <button onClick={() => navigate(-1)}>history back</button>
    </div>
  );
};

function renderBlueprint(opts: { subscribed?: boolean; tab?: string | null; visited?: boolean; ageDays?: number }) {
  const subscribed = opts.subscribed ?? false;
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
    user: {
      id: "u1",
      created_at: opts.ageDays === undefined ? undefined : new Date(Date.now() - opts.ageDays * 86400000).toISOString(),
      user_metadata: opts.visited ? { blueprint_visited_at: "2026-10-01T00:00:00Z" } : {},
    },
    session: { access_token: "t" },
    loading: false,
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
  const url = opts.tab === undefined || opts.tab === null ? "/blueprint" : `/blueprint?tab=${opts.tab}`;
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/blueprint"
            element={
              <>
                <Blueprint />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

const follows = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const tab = (name: string) => screen.getByRole("tab", { name });

describe("Blueprint tabs", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("moonday.onboarding.dismissed", "1");
    localStorage.setItem("moonday:nameAsked:u1", "1");
    updateUser.mockClear();
  });

  it("shows two always-visible, 44px tabs in a two-column bar that cannot scroll sideways and stays sticky", async () => {
    renderBlueprint({ visited: true, tab: "today" });
    const list = await screen.findByRole("tablist", { name: "Blueprint" });
    expect(list.className).toMatch(/grid-cols-2/);
    expect(list.className).not.toMatch(/overflow/);
    expect(list.parentElement?.className).toMatch(/sticky/);
    for (const name of ["Today", "My Blueprint"]) {
      expect(tab(name).className).toMatch(/min-h-11/);
    }
  });

  it("opens My Blueprint on a first-ever visit and Today on every later visit, and writes the tab into the URL", async () => {
    const first = renderBlueprint({ tab: null });
    await waitFor(() => expect(tab("My Blueprint")).toHaveAttribute("aria-selected", "true"));
    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent("?tab=blueprint"));
    // the visit is remembered on the account
    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({ data: { blueprint_visited_at: expect.any(String) } })
    );
    first.unmount();

    renderBlueprint({ tab: null, visited: true });
    await waitFor(() => expect(tab("Today")).toHaveAttribute("aria-selected", "true"));
    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent("?tab=today"));
  });

  it("opens the tab the URL asks for, and falls back to the default for anything else", async () => {
    const a = renderBlueprint({ visited: true, tab: "blueprint" });
    await waitFor(() => expect(tab("My Blueprint")).toHaveAttribute("aria-selected", "true"));
    a.unmount();
    const b = renderBlueprint({ tab: "today" });
    await waitFor(() => expect(tab("Today")).toHaveAttribute("aria-selected", "true"));
    b.unmount();
    renderBlueprint({ visited: true, tab: "nonsense" });
    await waitFor(() => expect(tab("Today")).toHaveAttribute("aria-selected", "true"));
  });

  it("switches tabs, keeps them in history, and back/forward move between them", async () => {
    renderBlueprint({ visited: true, tab: "today" });
    await screen.findByRole("tabpanel");
    fireEvent.click(tab("My Blueprint"));
    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent("?tab=blueprint"));
    expect(tab("My Blueprint")).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: "history back" }));
    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent("?tab=today"));
    expect(tab("Today")).toHaveAttribute("aria-selected", "true");
  });

  describe("Today (free member)", () => {
    it("reads Moon, Triad state and forecast first, then one faded peek and one upgrade card, then the come-back line", async () => {
      renderBlueprint({ visited: true, tab: "today" });
      const panel = await screen.findByRole("tabpanel");
      const moon = within(panel).getByRole("heading", { name: /^(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)$/ });
      const triad = within(panel).getByText(/of 1,728/);
      const forecast = within(panel).getByText("Daily Lunar Forecast");
      const body = within(panel).getByText("Your energy today");
      const peek = within(panel).getByTestId("locked-section-preview");
      const gate = within(panel).getByText("Now you know who you are.");
      const back = within(panel).getByText(/^Come back tomorrow: the Moon enters \w+/);

      expect(follows(moon, triad)).toBe(true);
      expect(follows(triad, forecast)).toBe(true);
      expect(follows(forecast, body)).toBe(true);
      expect(follows(body, peek)).toBe(true);
      expect(follows(peek, gate)).toBe(true);
      expect(follows(gate, back)).toBe(true);
      expect(within(panel).getAllByText("Unlock Luminary — $6.88/month")).toHaveLength(1);
    });

    it("keeps the combination title and the natal sections off the Today tab", async () => {
      renderBlueprint({ visited: true, tab: "today" });
      const panel = await screen.findByRole("tabpanel");
      expect(within(panel).queryByText("Test Archetype")).toBeNull();
      expect(within(panel).queryByText("Strengths")).toBeNull();
      expect(within(panel).queryByRole("navigation", { name: "Jump to a section" })).toBeNull();
    });
  });

  describe("My Blueprint (free member)", () => {
    it("shows the title once as the hero, then the Jump to index, the free sections, one faded peek and one upgrade card", async () => {
      renderBlueprint({ visited: true, tab: "blueprint" });
      const panel = await screen.findByRole("tabpanel");
      const hero = await within(panel).findByRole("heading", { level: 1, name: "Test Archetype" });
      expect(within(panel).getAllByText("Test Archetype")).toHaveLength(1);

      const index = within(panel).getByRole("navigation", { name: "Jump to a section" });
      const strengths = within(panel).getByRole("heading", { name: "Strengths" });
      const birthMoon = within(panel).getByRole("heading", { name: "Your Birth Moon" });
      const preview = within(panel).getByText("Blueprint Preview");
      const peek = within(panel).getByTestId("locked-section-preview");
      const gate = within(panel).getByText("Now you know who you are.");

      expect(follows(hero, index)).toBe(true);
      expect(follows(index, strengths)).toBe(true);
      expect(follows(strengths, birthMoon)).toBe(true);
      expect(follows(birthMoon, preview)).toBe(true);
      expect(follows(preview, peek)).toBe(true);
      expect(follows(peek, gate)).toBe(true);
      expect(within(panel).getAllByText("Now you know who you are.")).toHaveLength(1);
      // the daily Triad number and the forecast live on Today, not here
      expect(within(panel).queryByText(/of 1,728/)).toBeNull();
      expect(within(panel).queryByText("Daily Lunar Forecast")).toBeNull();
    });

    it("lays the index out as a wrapping grid of 44px buttons and gives every section a Back to top", async () => {
      renderBlueprint({ visited: true, tab: "blueprint" });
      const panel = await screen.findByRole("tabpanel");
      const index = await within(panel).findByRole("navigation", { name: "Jump to a section" });
      const list = within(index).getByRole("list");
      expect(list.className).toMatch(/grid-cols-2/);
      expect(list.className).not.toMatch(/overflow/);
      const labels = within(index).getAllByRole("button").map((b) => b.textContent);
      expect(labels).toEqual(["Strengths", "Birth Moon", "Preview"]);
      within(index).getAllByRole("button").forEach((b) => expect(b.className).toMatch(/min-h-11/));
      expect(within(panel).getAllByRole("button", { name: /Back to top/ }).length).toBeGreaterThanOrEqual(3);
    });

    it("jumps to a section from the index", async () => {
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      renderBlueprint({ visited: true, tab: "blueprint" });
      const panel = await screen.findByRole("tabpanel");
      fireEvent.click(await within(panel).findByRole("button", { name: "Birth Moon" }));
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    });
  });

  describe("design rules", () => {
    it("keeps the share nudge and the Share Your Moon Sign button on whichever tab is open", async () => {
      const today = renderBlueprint({ ageDays: 2, tab: "today" });
      const todayPanel = await screen.findByRole("tabpanel");
      expect(await within(todayPanel).findByRole("region", { name: "Share your Moon sign" })).toBeInTheDocument();
      expect(within(todayPanel).getByRole("button", { name: /Share Your Moon Sign/ })).toBeInTheDocument();
      today.unmount();
      localStorage.clear();
      localStorage.setItem("moonday.onboarding.dismissed", "1");
      localStorage.setItem("moonday:nameAsked:u1", "1");

      renderBlueprint({ ageDays: 2, tab: "blueprint" });
      const panel = await screen.findByRole("tabpanel");
      expect(await within(panel).findByRole("region", { name: "Share your Moon sign" })).toBeInTheDocument();
      expect(within(panel).getByRole("button", { name: /Share Your Moon Sign/ })).toBeInTheDocument();
    });

    it("shows the daily Triad number as live data (amber), not gold, and the hero title is the only gold", async () => {
      renderBlueprint({ visited: true, tab: "today" });
      const triadLine = await screen.findByText(/of 1,728/);
      expect(triadLine.className).toMatch(/text-amber/);
      expect(triadLine.getAttribute("style") ?? "").not.toMatch(/c9a84c|d4af37/i);
    });

    it("left-aligns the forecast copy and uses no rounded-full pills for text on either tab", async () => {
      const a = renderBlueprint({ visited: true, tab: "today" });
      const panel = await screen.findByRole("tabpanel");
      for (const text of [/First body sentence/, /Luminary shows how the \w+ Moon meets your/]) {
        expect(within(panel).getByText(text).closest("p")?.className).toMatch(/text-left/);
      }
      const pillsWithText = (root: HTMLElement) =>
        [...root.querySelectorAll("button, a, span, div")].filter(
          (e) => /rounded-full/.test(e.className) && e.children.length === 0 && (e.textContent ?? "").trim().length > 0
        );
      expect(pillsWithText(panel)).toEqual([]);
      a.unmount();

      renderBlueprint({ visited: true, tab: "blueprint" });
      const natal = await screen.findByRole("tabpanel");
      await within(natal).findByRole("heading", { level: 1, name: "Test Archetype" });
      expect(pillsWithText(natal)).toEqual([]);
    });

    it("makes every button and link on both tabs at least 44px (min-h-11 or taller)", async () => {
      for (const t of ["today", "blueprint"]) {
        const r = renderBlueprint({ visited: true, tab: t });
        const panel = await screen.findByRole("tabpanel");
        await within(panel).findAllByRole("button");
        const short = [...panel.querySelectorAll("button, a")].filter((e) => !/min-h-|py-3|py-4/.test(e.className));
        expect(short.map((e) => (e.textContent ?? "").trim())).toEqual([]);
        r.unmount();
      }
    });
  });

  describe("Luminary member", () => {
    it("sees no upgrade card or peek on either tab, the full natal sections, and the deeper daily readings on request", async () => {
      const today = renderBlueprint({ subscribed: true, visited: true, tab: "today" });
      const todayPanel = await screen.findByRole("tabpanel");
      await within(todayPanel).findByText("Your emotional field");
      expect(within(todayPanel).queryByText("Now you know who you are.")).toBeNull();
      expect(within(todayPanel).queryByTestId("locked-section-preview")).toBeNull();
      const more = within(todayPanel).getByRole("button", { name: "More for today" });
      expect(more).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(more);
      expect(await within(todayPanel).findByText("Daily Ritual")).toBeInTheDocument();
      today.unmount();

      renderBlueprint({ subscribed: true, visited: true, tab: "blueprint" });
      const panel = await screen.findByRole("tabpanel");
      await within(panel).findByRole("heading", { level: 1, name: "Test Archetype" });
      expect(within(panel).queryByText("Now you know who you are.")).toBeNull();
      expect(within(panel).getByRole("heading", { name: "Synthesis" })).toBeInTheDocument();
      expect(within(panel).getByRole("heading", { name: "Essence" })).toBeInTheDocument();
      expect(within(panel).getByRole("heading", { name: "Your Next Resets" })).toBeInTheDocument();
      const labels = within(within(panel).getByRole("navigation", { name: "Jump to a section" }))
        .getAllByRole("button")
        .map((b) => b.textContent);
      expect(labels).toEqual(["Strengths", "Birth Moon", "Synthesis", "Essence", "Lunar Return"]);
    });
  });
});
