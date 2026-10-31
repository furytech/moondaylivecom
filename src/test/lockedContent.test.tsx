import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import DailyForecast, { getBodyPreview } from "../components/DailyForecast";
import DailyRitual from "../components/DailyRitual";
import GreatCycleSection from "../components/GreatCycleSection";
import LunarSignatureSection from "../components/LunarSignatureSection";
import TriadPreview from "../pages/TriadPreview";
import * as forecastHook from "../hooks/useLunarForecast";
import { placeholderFor } from "../lib/lockedPlaceholder";
import { INNER_CIRCLE, PHASE_GUIDANCE } from "../lib/innerCircleDictionary";
import { getDailyRitual } from "../lib/dailyRitual";

vi.mock("@/components/Navigation", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));

afterEach(() => vi.restoreAllMocks());

const moon = { sign: "Gemini", phase: "Waxing Crescent", illumination: 30, phaseEmoji: "🌒" };
const lunar: any = {
  sign: { name: "Gemini", symbol: "♊", element: "Air" },
  phase: { name: "Waxing Crescent", emoji: "🌒", illumination: 30, isWaxing: true },
};

describe("placeholderFor", () => {
  it("returns filler of about the same length and none of the real words", () => {
    const real = "Zebra quartz lantern whispers across the orchard while marmalade clocks wander home.";
    const filler = placeholderFor(real);
    expect(Math.abs(filler.length - real.length)).toBeLessThanOrEqual(12);
    for (const word of ["Zebra", "quartz", "lantern", "orchard", "marmalade", "clocks"]) expect(filler).not.toContain(word);
    expect(placeholderFor("")).toBe("");
    expect(placeholderFor(null)).toBe("");
  });
});

describe("Daily forecast: a Free member's page does not contain the locked text", () => {
  const SECRET_3 = "Zebra marmalade lantern is the third sentence nobody free should read.";
  const SECRET_4 = "Quartz orchard whispers the fourth sentence stay locked.";
  const body = `First free sentence here. Second free sentence here. ${SECRET_3} ${SECRET_4}`;

  it("triad layout: the body preview shows two sentences; the rest is filler for Free and real for Luminary", () => {
    vi.spyOn(forecastHook, "useLunarForecast").mockReturnValue({
      forecast: null,
      triadData: {
        physical_guidance: body,
        emotional_guidance: "Quiet orchard feelings arrive slowly and stay a while longer today.",
        spiritual_guidance: "Marmalade lantern invitation text for members.",
        daily_ritual: "Lantern ritual text for members only.",
        shadow_activation: "Shadow text for members only.",
        integration_invitation: "Integration text for members only.",
      },
      loading: false,
      error: null,
    });

    const free = render(<DailyForecast birthMoonSign="Cancer" currentMoon={moon} natalSunSign="Cancer" isPro={false} />);
    const freeHtml = free.container.innerHTML;
    expect(freeHtml).toContain("First free sentence here. Second free sentence here.");
    expect(freeHtml).not.toContain("Zebra");
    expect(freeHtml).not.toContain("marmalade");
    expect(freeHtml).not.toContain("Quartz orchard");
    expect(freeHtml).not.toContain("Lantern ritual");
    expect(freeHtml).not.toContain("Shadow text");
    expect(freeHtml).not.toContain("Integration text");
    expect(freeHtml).not.toContain("Marmalade lantern invitation");
    const blurred = free.container.querySelector(".blur-\\[4px\\]");
    expect(blurred).toBeTruthy();
    const realLength = `${SECRET_3} ${SECRET_4}`.length;
    expect(Math.abs((blurred!.textContent ?? "").length - realLength)).toBeLessThanOrEqual(12);
    free.unmount();

    const paid = render(<DailyForecast birthMoonSign="Cancer" currentMoon={moon} natalSunSign="Cancer" isPro />);
    const paidHtml = paid.container.innerHTML;
    expect(paidHtml).toContain("Zebra marmalade lantern");
    expect(paidHtml).toContain("Lantern ritual text for members only.");
    expect(paidHtml).toContain("Shadow text for members only.");
    expect(paid.container.querySelector(".blur-\\[4px\\]")).toBeNull();
  });

  it("fallback layout: same rule", () => {
    vi.spyOn(forecastHook, "useLunarForecast").mockReturnValue({
      forecast: { headline: "Headline", forecast: body, energy: "Calm Energy", luckyFocus: "Lucky Thing" },
      triadData: null,
      loading: false,
      error: null,
    });
    const free = render(<DailyForecast birthMoonSign="Cancer" currentMoon={moon} natalSunSign={null} isPro={false} />);
    expect(free.container.innerHTML).toContain("Second free sentence here.");
    expect(free.container.innerHTML).not.toContain("Zebra");
    expect(free.container.innerHTML).not.toContain("Quartz orchard");
    expect(free.container.innerHTML).not.toContain("Lucky Thing");
    free.unmount();
    const paid = render(<DailyForecast birthMoonSign="Cancer" currentMoon={moon} natalSunSign={null} isPro />);
    expect(paid.container.innerHTML).toContain("Zebra marmalade lantern");
    expect(paid.container.innerHTML).toContain("Lucky Thing");
  });

  it("getBodyPreview never returns the locked sentences", () => {
    const { preview, blurredRemainder } = getBodyPreview(body);
    expect(preview).toBe("First free sentence here. Second free sentence here.");
    expect(blurredRemainder).not.toContain("Zebra");
    expect(blurredRemainder.length).toBeGreaterThan(40);
  });
});

describe("Locked sections never render real paid text for a non-subscriber", () => {
  const noop = () => {};

  it("Daily Ritual: the ritual and the Luminary Insight are absent for Free, present for Luminary", () => {
    const ritual = getDailyRitual("Gemini");
    const free = render(<DailyRitual currentMoonSign="Gemini" birthMoonSign="Cancer" moonPhase="Waxing Crescent" isPro={false} onUpgradeClick={noop} />);
    const freeText = free.container.textContent ?? "";
    expect(freeText).not.toContain(ritual.affirmation);
    expect(freeText).not.toContain(ritual.practice);
    for (const crystal of ritual.crystals) expect(freeText).not.toContain(crystal);
    expect(freeText).not.toContain("Why This Matters to You");
    free.unmount();
    const paid = render(<DailyRitual currentMoonSign="Gemini" birthMoonSign="Cancer" moonPhase="Waxing Crescent" isPro onUpgradeClick={noop} />);
    const paidText = paid.container.textContent ?? "";
    expect(paidText).toContain(ritual.affirmation);
    expect(paidText).toContain(ritual.practice);
    expect(paidText).toContain(ritual.crystals[0]);
    expect(paidText).toContain("Why This Matters to You");
  });

  it("Great Cycle: real phase guidance only for a subscriber", () => {
    const g = PHASE_GUIDANCE["Waxing"] ?? Object.values(PHASE_GUIDANCE).find((v) => lunar.phase.name.toLowerCase().includes("crescent")) ;
    const key = Object.keys(PHASE_GUIDANCE).find((k) => lunar.phase.name.toLowerCase().includes(k.toLowerCase())) || "New";
    const real = PHASE_GUIDANCE[key];
    expect(g).toBeDefined();
    const free = render(<GreatCycleSection lunar={lunar} isSubscriber={false} onUpgradeClick={noop} />);
    for (const t of [real.psychological, real.spiritual, real.material]) expect(free.container.textContent).not.toContain(t);
    free.unmount();
    const paid = render(<GreatCycleSection lunar={lunar} isSubscriber onUpgradeClick={noop} />);
    for (const t of [real.psychological, real.spiritual, real.material]) expect(paid.container.textContent).toContain(t);
  });

  it("Lunar Signature: real sign guidance only for a Luminary member", () => {
    const real = INNER_CIRCLE.Gemini;
    const free = render(<LunarSignatureSection lunar={lunar} isPro={false} onUpgradeClick={noop} />);
    for (const t of [real.psychological, real.spiritual, real.material]) expect(free.container.textContent).not.toContain(t);
    free.unmount();
    const paid = render(<LunarSignatureSection lunar={lunar} isPro onUpgradeClick={noop} />);
    for (const t of [real.psychological, real.spiritual, real.material]) expect(paid.container.textContent).toContain(t);
  });

  it("Triad preview page: the blurred paragraphs are filler, the real copy is not in the page", () => {
    const { container } = render(
      <HelmetProvider>
        <MemoryRouter>
          <TriadPreview />
        </MemoryRouter>
      </HelmetProvider>,
    );
    const text = container.textContent ?? "";
    expect(text).not.toContain("engine of your identity");
    expect(text).not.toContain("architecture of your inner life");
    const blurred = container.querySelectorAll("p.blur-sm");
    expect(blurred.length).toBe(2);
    blurred.forEach((p) => expect((p.textContent ?? "").length).toBeGreaterThan(300));
  });
});
