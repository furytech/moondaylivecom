import { describe, it, expect, vi, beforeEach } from "vitest";
import { approvePost } from "../lib/blog/posts";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => {
  const updateMock = vi.fn();
  const eqMock = vi.fn();
  const selectMock = vi.fn();
  const singleMock = vi.fn();

  return {
    supabase: {
      from: vi.fn(() => ({
        update: updateMock,
      })),
    },
    updateMock,
    eqMock,
    selectMock,
    singleMock,
  };
});

describe("approvePost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates blog_posts setting published_at to now() and touches no other columns", async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: "test-post-id", published_at: "2026-09-26T12:00:00.000Z" },
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    } as unknown as ReturnType<typeof supabase.from>);

    const result = await approvePost("test-post-id");

    expect(supabase.from).toHaveBeenCalledWith("blog_posts");
    expect(updateMock).toHaveBeenCalledTimes(1);
    
    // Check that ONLY published_at is passed in update
    const updatePayload = updateMock.mock.calls[0][0];
    expect(Object.keys(updatePayload)).toEqual(["published_at"]);
    expect(typeof updatePayload.published_at).toBe("string");
    expect(new Date(updatePayload.published_at).toString()).not.toBe("Invalid Date");

    expect(eqMock).toHaveBeenCalledWith("id", "test-post-id");
    expect(result).toEqual({ id: "test-post-id", published_at: "2026-09-26T12:00:00.000Z" });
  });

  it("throws error if Supabase query fails", async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Supabase error"),
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    } as unknown as ReturnType<typeof supabase.from>);

    await expect(approvePost("test-post-id")).rejects.toThrow("Supabase error");
  });
});
