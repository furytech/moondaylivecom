import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth, type SignUpOutcome } from "../contexts/AuthContext";

const signUpMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  chain.upsert = async () => ({ error: null });
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: (...args: unknown[]) => signUpMock(...args),
      },
      from: () => chain,
      functions: { invoke: vi.fn() },
    },
  };
});

let signUp: ReturnType<typeof useAuth>["signUp"];
const Capture = () => {
  signUp = useAuth().signUp;
  return null;
};

async function run(user: Record<string, unknown> | null): Promise<SignUpOutcome> {
  signUpMock.mockResolvedValue({ data: { user }, error: null });
  render(
    <MemoryRouter>
      <AuthProvider>
        <Capture />
      </AuthProvider>
    </MemoryRouter>
  );
  await waitFor(() => expect(signUp).toBeDefined());
  return signUp("a@b.co", "pw-random", "1985-11-03", "Cancer", "UTC", "Scorpio", undefined, { passwordPending: true });
}

describe("signUp outcomes", () => {
  beforeEach(() => signUpMock.mockReset());

  it("creates a new account and marks the password as not chosen yet", async () => {
    const outcome = await run({
      id: "u1",
      identities: [{ id: "i1" }],
      created_at: "2026-10-20T10:00:00Z",
      confirmation_sent_at: "2026-10-20T10:00:01Z",
    });
    expect(outcome.status).toBe("created");
    const options = signUpMock.mock.calls[0][0].options;
    expect(options.data).toMatchObject({ birthday: "1985-11-03", natal_moon_sign: "Cancer", password_pending: true });
  });

  it("reports an email that already has an account (no identities)", async () => {
    const outcome = await run({ id: "ghost", identities: [], created_at: "2026-10-20T10:00:00Z" });
    expect(outcome.status).toBe("existing");
  });

  it("reports an old unconfirmed signup whose link was just sent again", async () => {
    const outcome = await run({
      id: "u2",
      identities: [{ id: "i2" }],
      created_at: "2026-10-18T10:00:00Z",
      confirmation_sent_at: "2026-10-20T10:00:00Z",
    });
    expect(outcome.status).toBe("pending");
  });
});
