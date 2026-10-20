import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth, type SignUpOutcome } from "../contexts/AuthContext";

const signUpMock = vi.fn();
const upsertMock = vi.fn(async () => ({ error: null }));

vi.mock("@/integrations/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  chain.upsert = (...a: unknown[]) => upsertMock(...(a as []));
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
  beforeEach(() => {
    signUpMock.mockReset();
    upsertMock.mockClear();
  });

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

  it("never writes a profile or sends anything more when the email already exists or was already started", async () => {
    await run({ id: "ghost", identities: [], created_at: "2026-10-20T10:00:00Z" });
    expect(upsertMock).not.toHaveBeenCalled();
    upsertMock.mockClear();
    await run({
      id: "u2",
      identities: [{ id: "i2" }],
      created_at: "2026-10-18T10:00:00Z",
      confirmation_sent_at: "2026-10-20T10:00:00Z",
    });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("leaves the Moon sign empty for a Moon-change birthday instead of guessing one", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: "u3", identities: [{ id: "i" }], created_at: "2026-10-20T10:00:00Z", confirmation_sent_at: "2026-10-20T10:00:01Z" } },
      error: null,
    });
    render(
      <MemoryRouter>
        <AuthProvider>
          <Capture />
        </AuthProvider>
      </MemoryRouter>
    );
    await waitFor(() => expect(signUp).toBeDefined());
    await signUp("a@b.co", "pw", "1990-06-16", undefined, "UTC", "Gemini", undefined, { passwordPending: true, deferMoonSign: true });
    const data = signUpMock.mock.calls[0][0].options.data;
    expect(data.moon_sign).toBeNull();
    expect(data.natal_moon_sign).toBeNull();
    expect(data.natal_sun_sign).toBe("Gemini");
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
