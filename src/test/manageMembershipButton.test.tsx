import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: { access_token: "tok" } } }) },
    functions: { invoke: (...a: unknown[]) => invoke(...a) },
  },
}));

import ManageMembershipButton, { PORTAL_ERROR_TEXT } from "../components/ManageMembershipButton";

describe("ManageMembershipButton", () => {
  beforeEach(() => {
    invoke.mockReset();
    Object.defineProperty(window, "location", { configurable: true, value: { href: "https://moondaylive.com/account" } });
  });

  it("is labelled 'Manage or cancel membership' with a 44px minimum tap target", () => {
    render(<ManageMembershipButton />);
    const b = screen.getByRole("button", { name: "Manage or cancel membership" });
    expect(b.className).toContain("min-h-[44px]");
  });

  it("goes to the Stripe portal in the same tab on one click", async () => {
    invoke.mockResolvedValue({ data: { url: "https://billing.stripe.com/p/session/x" }, error: null });
    render(<ManageMembershipButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(window.location.href).toBe("https://billing.stripe.com/p/session/x"));
    expect(invoke).toHaveBeenCalledWith("customer-portal", { headers: { Authorization: "Bearer tok" } });
  });

  it("shows a friendly message and re-enables the button when it fails", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("boom") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ManageMembershipButton />);
    fireEvent.click(screen.getByRole("button"));
    expect((await screen.findByRole("alert")).textContent).toBe(PORTAL_ERROR_TEXT);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("shows the message when no portal URL comes back", async () => {
    invoke.mockResolvedValue({ data: {}, error: null });
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ManageMembershipButton />);
    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
