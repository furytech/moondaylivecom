import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Portal from "../pages/Portal";
import * as AuthContextModule from "../contexts/AuthContext";

describe("Portal Signup - Birthday 3-Dropdown Fields", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it("renders Month, Day, and Year dropdowns in order on the signup form", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      session: null,
      loading: false,
      isSubscribed: false,
      subscription: {
        subscribed: false,
        status: "free",
        priceId: null,
        subscriptionEnd: null,
        subscriptionStart: null,
      },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      checkSubscription: vi.fn(),
    });

    render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Portal defaultMode="signup" />
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );

    // Verify all three dropdown triggers exist with proper placeholders
    expect(screen.getByText("Month")).toBeDefined();
    expect(screen.getByText("Day")).toBeDefined();
    expect(screen.getByText("Year")).toBeDefined();

    // Verify DOM order: Month precedes Day, Day precedes Year
    const monthTrigger = screen.getByRole("combobox", { name: /Birth Month/i });
    const dayTrigger = screen.getByRole("combobox", { name: /Birth Day/i });
    const yearTrigger = screen.getByRole("combobox", { name: /Birth Year/i });

    expect(monthTrigger).toBeDefined();
    expect(dayTrigger).toBeDefined();
    expect(yearTrigger).toBeDefined();

    expect(
      monthTrigger.compareDocumentPosition(dayTrigger) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      dayTrigger.compareDocumentPosition(yearTrigger) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
