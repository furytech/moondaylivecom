import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const auth = vi.hoisted(() => ({ user: null as null | { id: string } }));
const status = vi.hoisted(() => ({ isLuminary: false, ready: true }));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("@/hooks/useLuminaryStatus", () => ({ useLuminaryStatus: () => status }));
vi.mock("@/components/Navigation", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/DailyPulse", () => ({ default: () => null }));
vi.mock("@/components/SovereignTeaser", () => ({ default: () => null }));

import Pulse from "../pages/Pulse";

const renderPulse = () =>
  render(
    <MemoryRouter>
      <Pulse />
    </MemoryRouter>,
  );

describe("Pulse → Lenses link", () => {
  beforeEach(() => {
    auth.user = null;
    status.isLuminary = false;
    status.ready = true;
  });

  it("keeps the existing link for logged-out visitors", () => {
    renderPulse();
    const link = screen.getByRole("link", { name: /Personalize the Lenses/ });
    expect(link).toHaveAttribute("href", "/lenses");
  });

  it("sends Luminary members to their Lenses", () => {
    auth.user = { id: "u1" };
    status.isLuminary = true;
    renderPulse();
    expect(screen.getByRole("link", { name: "Open your Lenses →" })).toHaveAttribute("href", "/lenses");
  });

  it("sends signed-in free users to /pricing as Unlock Luminary", () => {
    auth.user = { id: "u1" };
    renderPulse();
    expect(screen.getByRole("link", { name: "Unlock Luminary" })).toHaveAttribute("href", "/pricing");
  });

  it("shows no link until the membership check has finished", () => {
    auth.user = { id: "u1" };
    status.ready = false;
    renderPulse();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
