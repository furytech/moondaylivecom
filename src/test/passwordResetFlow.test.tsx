import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import { supabase } from "@/integrations/supabase/client";
import * as AuthContextModule from "../contexts/AuthContext";

describe("Password Reset Flow", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockAuth = {
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
  };

  const renderWithProviders = (component: React.ReactNode) =>
    render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{component}</BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue(mockAuth);
  });

  describe("1. Forgot Password Confirmation", () => {
    it("shows inline success message and single Return to Sign In button on submit", async () => {
      vi.spyOn(supabase.auth, "resetPasswordForEmail").mockResolvedValue({
        data: {},
        error: null,
      });

      renderWithProviders(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText("you@cosmos.com");
      const submitButton = screen.getByRole("button", { name: /Send Recovery Link/i });

      fireEvent.change(emailInput, { target: { value: "traveler@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Recovery link sent — check your email.")
        ).toBeDefined();
      });

      // Confirm single Return to Sign In button is present
      const returnButton = screen.getByRole("button", { name: "Return to Sign In" });
      expect(returnButton).toBeDefined();

      // Ensure form input is replaced
      expect(screen.queryByPlaceholderText("you@cosmos.com")).toBeNull();
    });
  });

  describe("2. Password Reset Page", () => {
    it("renders Reset Your Password view when recovery session is present", async () => {
      // Simulate active session from recovery link
      vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
        data: {
          session: {
            access_token: "test-token",
            refresh_token: "test-refresh",
            expires_in: 300,
            token_type: "bearer",
            user: { id: "user-123", email: "traveler@example.com" } as any,
          },
        },
        error: null,
      });

      vi.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn(), id: "sub-1" } },
      });

      renderWithProviders(<ResetPassword />);

      await waitFor(() => {
        expect(screen.getByText("Reset Your Password")).toBeDefined();
      });

      expect(screen.getByPlaceholderText("Minimum 8 characters")).toBeDefined();
      expect(screen.getByPlaceholderText("Confirm new password")).toBeDefined();
      expect(screen.getByRole("button", { name: "Set New Password" })).toBeDefined();
    });

    it("validates minimum 8 characters and password match", async () => {
      vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
        data: {
          session: {
            access_token: "test-token",
            refresh_token: "test-refresh",
            expires_in: 300,
            token_type: "bearer",
            user: { id: "user-123", email: "traveler@example.com" } as any,
          },
        },
        error: null,
      });
      vi.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn(), id: "sub-1" } },
      });

      renderWithProviders(<ResetPassword />);

      await waitFor(() => {
        expect(screen.getByText("Reset Your Password")).toBeDefined();
      });

      const newPassInput = screen.getByPlaceholderText("Minimum 8 characters");
      const confirmInput = screen.getByPlaceholderText("Confirm new password");
      const submitBtn = screen.getByRole("button", { name: "Set New Password" });

      // Test too short
      fireEvent.change(newPassInput, { target: { value: "short" } });
      expect(screen.getByText("Password must be at least 8 characters")).toBeDefined();
      expect(submitBtn.hasAttribute("disabled")).toBe(true);

      // Test mismatch
      fireEvent.change(newPassInput, { target: { value: "validPassword123" } });
      fireEvent.change(confirmInput, { target: { value: "differentPassword" } });
      expect(screen.getByText("Passwords must match")).toBeDefined();
      expect(submitBtn.hasAttribute("disabled")).toBe(true);

      // Test matching >= 8 chars
      fireEvent.change(confirmInput, { target: { value: "validPassword123" } });
      expect(screen.getByText("Passwords match ✓")).toBeDefined();
      expect(submitBtn.hasAttribute("disabled")).toBe(false);
    });

    it("shows success message on successful password update", async () => {
      vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
        data: {
          session: {
            access_token: "test-token",
            refresh_token: "test-refresh",
            expires_in: 300,
            token_type: "bearer",
            user: { id: "user-123", email: "traveler@example.com" } as any,
          },
        },
        error: null,
      });
      vi.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn(), id: "sub-1" } },
      });
      vi.spyOn(supabase.auth, "updateUser").mockResolvedValue({
        data: { user: { id: "user-123" } as any },
        error: null,
      });
      vi.spyOn(supabase.auth, "signOut").mockResolvedValue({ error: null });

      renderWithProviders(<ResetPassword />);

      await waitFor(() => {
        expect(screen.getByText("Reset Your Password")).toBeDefined();
      });

      const newPassInput = screen.getByPlaceholderText("Minimum 8 characters");
      const confirmInput = screen.getByPlaceholderText("Confirm new password");
      const submitBtn = screen.getByRole("button", { name: "Set New Password" });

      fireEvent.change(newPassInput, { target: { value: "secureCelestial123" } });
      fireEvent.change(confirmInput, { target: { value: "secureCelestial123" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Password updated — sign in with your new password.")
        ).toBeDefined();
      });
    });
  });

  describe("3. Expired Link Handling", () => {
    it("displays expired link message with logo and link back to forgot password form", async () => {
      // No recovery session present
      vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
        data: { session: null },
        error: null,
      });
      vi.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn(), id: "sub-1" } },
      });

      renderWithProviders(<ResetPassword />);

      await waitFor(() => {
        expect(
          screen.getByText(/This link has expired\./i)
        ).toBeDefined();
        expect(screen.getByText("Request a new one.")).toBeDefined();
      });

      const logo = screen.getByAltText("Moonday Live Logo");
      expect(logo.getAttribute("src")).toBe("/assets/MoondayLive-Logo.png");

      const requestLink = screen.getByRole("link", { name: "Request a new one." });
      expect(requestLink.getAttribute("href")).toBe("/forgot-password");

      const requestButton = screen.getByRole("button", { name: "Request a New Link" });
      expect(requestButton).toBeDefined();
    });
  });
});
