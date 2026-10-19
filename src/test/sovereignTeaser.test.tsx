import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const auth = vi.hoisted(() => ({ user: null as null | { id: string } }));
const status = vi.hoisted(() => ({ isLuminary: false, ready: true }));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("@/hooks/useLuminaryStatus", () => ({ useLuminaryStatus: () => status }));

import SovereignTeaser from "../components/SovereignTeaser";

const renderTeaser = () =>
  render(
    <MemoryRouter>
      <SovereignTeaser />
    </MemoryRouter>,
  );

describe("SovereignTeaser", () => {
  beforeEach(() => {
    auth.user = null;
    status.isLuminary = false;
    status.ready = true;
  });

  it("shows logged-out visitors the signup CTA", () => {
    renderTeaser();
    expect(screen.getByRole("link", { name: /Begin Your Reading/ })).toHaveAttribute("href", "/signup");
  });

  it("shows signed-in free users Unlock Luminary → /pricing", () => {
    auth.user = { id: "u1" };
    renderTeaser();
    expect(screen.getByRole("link", { name: /Unlock Luminary/ })).toHaveAttribute("href", "/pricing");
  });

  it("never shows Luminary members the teaser", () => {
    auth.user = { id: "u1" };
    status.isLuminary = true;
    const { container } = renderTeaser();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a signed-in user nothing until membership is known", () => {
    auth.user = { id: "u1" };
    status.ready = false;
    const { container } = renderTeaser();
    expect(container).toBeEmptyDOMElement();
  });
});
