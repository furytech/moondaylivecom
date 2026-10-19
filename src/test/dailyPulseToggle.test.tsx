import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DailyPulse from "../components/DailyPulse";

const forYou = {
  social: { label: "Social label", text: "Social text." },
  internal: { label: "Internal label", text: "Internal text." },
  soul: { label: "Soul label", text: "Soul text." },
};

describe("DailyPulse lens cards with For you", () => {
  it("flips Show details / Hide details when a card is tapped", () => {
    render(<DailyPulse at={new Date("2026-03-14T12:00:00Z")} forYou={forYou} />);
    expect(screen.getAllByText("Show details")).toHaveLength(3);
    fireEvent.click(screen.getByText("Social text."));
    expect(screen.getAllByText("Hide details")).toHaveLength(1);
    expect(screen.getAllByText("Show details")).toHaveLength(2);
    fireEvent.click(screen.getByText("Social text."));
    expect(screen.getAllByText("Show details")).toHaveLength(3);
  });

  it("keeps the open card open when the parent re-renders with a new clock object", () => {
    const { rerender } = render(<DailyPulse at={new Date("2026-03-14T12:00:00Z")} forYou={forYou} />);
    fireEvent.click(screen.getByText("Soul text."));
    rerender(<DailyPulse at={new Date("2026-03-14T12:00:00Z")} forYou={{ ...forYou }} />);
    expect(screen.getAllByText("Hide details")).toHaveLength(1);
  });

  it("keeps every lens detail in the HTML while collapsed, hidden until opened", () => {
    const { container } = render(<DailyPulse at={new Date("2026-03-14T12:00:00Z")} forYou={forYou} />);
    const panels = container.querySelectorAll('[role="region"][id^="lens-detail-"]');
    expect(panels).toHaveLength(3);
    panels.forEach((p) => expect((p as HTMLElement).hidden).toBe(true));
    expect(screen.getAllByText("Practice")).toHaveLength(3);

    fireEvent.click(screen.getAllByRole("button", { name: /show details/i })[0]);
    const open = container.querySelectorAll('[role="region"][id^="lens-detail-"]:not([hidden])');
    expect(open).toHaveLength(1);
  });

  it("renders the toggle as a real 44px button with a chevron", () => {
    render(<DailyPulse at={new Date("2026-03-14T12:00:00Z")} forYou={forYou} />);
    const btn = screen.getAllByRole("button", { name: /show details/i })[0];
    expect(btn.className).toContain("min-h-[44px]");
    expect(btn.className).toContain("rounded-xl");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.querySelector("svg")).not.toBeNull();
  });
});
