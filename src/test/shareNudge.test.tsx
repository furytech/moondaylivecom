import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShareNudgeCard from "../components/ShareNudgeCard";
import { isNewMember, parseShareNudge, shouldShowShareNudge } from "../lib/shareNudge";
import { emailShareUrl, facebookShareUrl, shareLink, shareMessage, twitterShareUrl } from "../lib/shareMoon";

const DAY = 86400000;
const now = new Date("2026-10-21T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * DAY).toISOString();

describe("share nudge rules", () => {
  it("shows once to a new member", () => {
    expect(shouldShowShareNudge({}, ago(1), now)).toBe(true);
    expect(shouldShowShareNudge({}, ago(30), now)).toBe(true);
  });

  it("never shows to an older member or an account with no creation date", () => {
    expect(isNewMember(ago(31), now)).toBe(false);
    expect(shouldShowShareNudge({}, ago(200), now)).toBe(false);
    expect(shouldShowShareNudge({}, undefined, now)).toBe(false);
  });

  it("gives one reminder 7 days after the first showing, never before", () => {
    const first = { shown: 1, first_shown_at: ago(6.9) };
    expect(shouldShowShareNudge(first, ago(10), now)).toBe(false);
    expect(shouldShowShareNudge({ shown: 1, first_shown_at: ago(7) }, ago(10), now)).toBe(true);
    expect(shouldShowShareNudge({ shown: 1, first_shown_at: ago(60) }, ago(70), now)).toBe(true);
  });

  it("never shows a third time", () => {
    expect(shouldShowShareNudge({ shown: 2, first_shown_at: ago(30) }, ago(35), now)).toBe(false);
  });

  it("never shows once they shared, or dismissed it twice", () => {
    expect(shouldShowShareNudge({ shown: 1, first_shown_at: ago(9), shared_at: ago(2) }, ago(10), now)).toBe(false);
    expect(shouldShowShareNudge({ shown: 1, first_shown_at: ago(9), dismissed: 2 }, ago(10), now)).toBe(false);
    expect(shouldShowShareNudge({ shown: 1, first_shown_at: ago(9), dismissed: 1 }, ago(10), now)).toBe(true);
  });

  it("reads only well-formed metadata", () => {
    expect(parseShareNudge(null)).toEqual({});
    expect(parseShareNudge({ shown: "2", dismissed: -1, shared_at: "nope", clicks: 3 })).toMatchObject({ clicks: 3 });
    expect(parseShareNudge({ shown: "2", dismissed: -1, shared_at: "nope" }).shown).toBeUndefined();
    expect(parseShareNudge({ shown: "2", dismissed: -1, shared_at: "nope" }).shared_at).toBeUndefined();
  });
});

describe("what gets shared", () => {
  it("is only the member's own sign and its public link", () => {
    expect(shareLink("Cancer")).toBe("https://moondaylive.com/shared-moon/cancer");
    const all = [shareMessage("Cancer"), twitterShareUrl("Cancer"), facebookShareUrl("Cancer"), emailShareUrl("Cancer")].join(" ");
    expect(decodeURIComponent(all)).toContain("Cancer Moon");
    expect(all).not.toMatch(/19\d\d|20\d\d|Sun|birthday/i);
  });
});

describe("ShareNudgeCard", () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "share");
  afterEach(() => {
    if (original) Object.defineProperty(navigator, "share", original);
    else delete (navigator as { share?: unknown }).share;
  });
  beforeEach(() => {
    delete (navigator as { share?: unknown }).share;
  });

  it("is warm and short, with Share and Maybe later at tap size", () => {
    render(<ShareNudgeCard sign="Cancer" onShareClick={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText("Know someone who'd love this?")).toBeInTheDocument();
    expect(screen.getByText("Share your Moon sign with them.")).toBeInTheDocument();
    for (const name of ["Share", "Maybe later"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/min-h-12/);
    }
  });

  it("uses the native share sheet on phones", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    const onShareClick = vi.fn();
    render(<ShareNudgeCard sign="Cancer" onShareClick={onShareClick} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(onShareClick).toHaveBeenCalledWith("native", true));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: "https://moondaylive.com/shared-moon/cancer" }));
  });

  it("counts a click but not a share when the person backs out of the sheet", async () => {
    Object.defineProperty(navigator, "share", { value: vi.fn().mockRejectedValue(new DOMException("x", "AbortError")), configurable: true });
    const onShareClick = vi.fn();
    render(<ShareNudgeCard sign="Cancer" onShareClick={onShareClick} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(onShareClick).toHaveBeenCalledWith("native", false));
    expect(screen.queryByText(/Thank you/)).toBeNull();
  });

  it("offers Copy link and common options on desktop, each at tap size", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const onShareClick = vi.fn();
    render(<ShareNudgeCard sign="Cancer" onShareClick={onShareClick} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    for (const name of ["Copy link", "X", "Facebook", "Email"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/min-h-11/);
    }
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("https://moondaylive.com/shared-moon/cancer"));
    expect(onShareClick).toHaveBeenCalledWith("copy", true);
  });

  it("dismisses with Maybe later", () => {
    const onDismiss = vi.fn();
    render(<ShareNudgeCard sign="Cancer" onShareClick={vi.fn()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
