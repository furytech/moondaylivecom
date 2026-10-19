import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

describe("Accordion (FAQ, Transit pages)", () => {
  it("keeps collapsed answers in the HTML, hidden, instead of mounting them on click", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>First question</AccordionTrigger>
          <AccordionContent>First answer</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Second question</AccordionTrigger>
          <AccordionContent>Second answer</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const answer = screen.getByText("Second answer");
    const panel = answer.closest('[data-state]') as HTMLElement;
    expect(panel.getAttribute("data-state")).toBe("closed");
    expect(panel.className).toContain("data-[state=closed]:hidden");

    const trigger = screen.getByRole("button", { name: "Second question" });
    expect(trigger.className).toContain("min-h-[44px]");
    expect(trigger.className).toContain("rounded-xl");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.getAttribute("data-state")).toBe("open");
  });
});
