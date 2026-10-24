import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

let authUser: { id: string } | null = null;
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: authUser }) }));

let authListener: ((event: string, session: unknown) => void) | null = null;
const unsubscribe = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authListener = cb;
        return { data: { subscription: { unsubscribe } } };
      },
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));

import ConfirmLanding from "../components/ConfirmLanding";
import { useAdvanceOnConfirm } from "../hooks/useAdvanceOnConfirm";
import {
  ADVANCE_WINDOW_MS,
  GRACE_MS,
  advancedRecently,
  confirmOutcome,
  isConfirmLinkHash,
  markAdvanced,
} from "../lib/confirmLanding";

const Where = () => {
  return <div data-testid="blueprint">blueprint page</div>;
};
const Inbox = () => {
  useAdvanceOnConfirm();
  return <div>Check your inbox</div>;
};

describe("confirmation link detection and hand-off", () => {
  beforeEach(() => localStorage.clear());

  it("recognizes a signup confirmation hash and nothing else", () => {
    expect(isConfirmLinkHash("#access_token=abc&refresh_token=def&type=signup")).toBe(true);
    expect(isConfirmLinkHash("#access_token=abc&type=recovery")).toBe(false);
    expect(isConfirmLinkHash("")).toBe(false);
    expect(isConfirmLinkHash("#type=signup")).toBe(false);
  });

  it("an advance mark counts only inside the window", () => {
    expect(advancedRecently()).toBe(false);
    markAdvanced(1_000_000);
    expect(advancedRecently(1_000_000 + ADVANCE_WINDOW_MS)).toBe(true);
    expect(advancedRecently(1_000_000 + ADVANCE_WINDOW_MS + 1)).toBe(false);
  });

  it("outcome: close the tab when another tab advanced, otherwise continue", () => {
    expect(confirmOutcome(true)).toBe("close-tab");
    expect(confirmOutcome(false)).toBe("continue");
  });
});

describe("the 'Check your inbox' tab", () => {
  beforeEach(() => {
    localStorage.clear();
    authListener = null;
  });

  const renderInbox = () =>
    render(
      <MemoryRouter initialEntries={["/your-moon-sign"]}>
        <Routes>
          <Route path="/your-moon-sign" element={<Inbox />} />
          <Route path="/blueprint" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    );

  it("moves on to the Blueprint when the other tab signs the member in, and marks the hand-off", () => {
    renderInbox();
    expect(screen.getByText("Check your inbox")).toBeTruthy();
    act(() => authListener?.("SIGNED_IN", { user: { id: "u1" } }));
    expect(screen.getByTestId("blueprint")).toBeTruthy();
    expect(advancedRecently()).toBe(true);
  });

  it("stays put for events that are not a sign-in", () => {
    renderInbox();
    act(() => authListener?.("INITIAL_SESSION", null));
    act(() => authListener?.("SIGNED_OUT", null));
    expect(screen.getByText("Check your inbox")).toBeTruthy();
  });
});

describe("the confirmation-link tab", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    authUser = { id: "u1" };
  });
  afterEach(() => {
    vi.useRealTimers();
    authUser = null;
  });

  const renderLink = () =>
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ConfirmLanding arrived />
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/blueprint" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    );

  it("shows 'You're confirmed' and continues to the Blueprint when no other tab advanced", () => {
    renderLink();
    expect(screen.getByText("You're confirmed")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(GRACE_MS + 50); });
    expect(screen.getByTestId("blueprint")).toBeTruthy();
    expect(screen.queryByText("You're confirmed")).toBeNull();
  });

  it("says it can be closed when another tab already advanced", () => {
    markAdvanced();
    renderLink();
    act(() => { vi.advanceTimersByTime(GRACE_MS + 50); });
    expect(screen.getByText("You're confirmed. You can close this tab.")).toBeTruthy();
    expect(screen.queryByTestId("blueprint")).toBeNull();
  });

  it("does nothing when the page was not opened from a confirmation link", () => {
    const { container } = render(
      <MemoryRouter>
        <ConfirmLanding arrived={false} />
      </MemoryRouter>,
    );
    expect(container.textContent).toBe("");
  });
});
