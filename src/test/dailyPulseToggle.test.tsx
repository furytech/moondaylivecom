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
});
