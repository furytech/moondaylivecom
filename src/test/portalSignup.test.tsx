import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Portal from "../pages/Portal";
import * as AuthContextModule from "../contexts/AuthContext";
import { clearSignupDraft, saveSignupDraft } from "../lib/signupDraft";

const signUp = vi.fn().mockResolvedValue(undefined);

function renderSignup(initial = "/signup") {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: null,
    session: null,
    loading: false,
    isSubscribed: false,
    subscription: { subscribed: false, productId: null, priceId: null, subscriptionEnd: null, subscriptionStart: null },
    signIn: vi.fn(),
    signUp,
    signOut: vi.fn(),
    checkSubscription: vi.fn(),
  } as never);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route path="/signup" element={<Portal defaultMode="signup" />} />
            <Route path="/login" element={<Portal defaultMode="login" />} />
            <Route path="/find-my-moon-sign" element={<p>reveal step</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

describe("Signup form", () => {
  beforeEach(() => {
    clearSignupDraft();
    signUp.mockClear();
  });

  it("sends visitors without a birthday to the reveal step first", () => {
    renderSignup("/signup?from=/pricing");
    expect(screen.getByText("reveal step")).toBeInTheDocument();
  });

  it("asks for exactly an email and a password, with the carried birthday read-only", () => {
    saveSignupDraft({ birthday: "1985-03-07", timezone: "America/Chicago", moonSign: "Libra" });
    renderSignup();

    expect(screen.getByRole("heading", { name: "Create your free account" })).toBeInTheDocument();
    expect(screen.getByText("Two details: your email and a password.")).toBeInTheDocument();

    // the only inputs are email and password: no name, confirm password, timezone or birthday pickers
    expect(document.querySelectorAll("input")).toHaveLength(2);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm/i)).toBeNull();
    expect(screen.queryByLabelText(/first name/i)).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();

    expect(screen.getByText("March 7, 1985")).toBeInTheDocument();
    expect(screen.getByText("Pisces Sun · Libra Moon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change" })).toHaveAttribute("href", "/find-my-moon-sign");
  });

  it("shows and hides the password", () => {
    saveSignupDraft({ birthday: "1985-03-07", timezone: "UTC", moonSign: "Libra" });
    renderSignup();
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
  });

  it("signs up with the carried birthday, Moon sign and detected timezone, then shows the confirmation", async () => {
    saveSignupDraft({ birthday: "1985-03-07", timezone: "America/Chicago", moonSign: "Libra" });
    renderSignup();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test+flow@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct horse" } });
    fireEvent.click(screen.getByRole("button", { name: "Create my account" }));

    await waitFor(() => expect(screen.getByText("Verify your email")).toBeInTheDocument());
    expect(signUp).toHaveBeenCalledWith(
      "test+flow@example.com",
      "correct horse",
      "1985-03-07",
      "Libra",
      "America/Chicago",
      "Pisces"
    );
    expect(screen.getByText(/Your birthday \(March 7, 1985\) is saved/)).toBeInTheDocument();
    // the draft is spent
    expect(sessionStorage.getItem("moonday:signupDraft")).toBeNull();
  });

  it("rejects a short password without calling signUp", async () => {
    saveSignupDraft({ birthday: "1985-03-07", timezone: "UTC", moonSign: "Libra" });
    renderSignup();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create my account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("at least 6 characters");
    expect(signUp).not.toHaveBeenCalled();
  });
});
