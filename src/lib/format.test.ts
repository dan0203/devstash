import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./format";

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-14T12:00:00Z");

  it("returns 'just now' for timestamps under a minute old", () => {
    expect(formatRelativeTime(new Date("2026-08-14T11:59:30Z"), now)).toBe("just now");
  });

  it("formats minutes ago", () => {
    expect(formatRelativeTime(new Date("2026-08-14T11:45:00Z"), now)).toBe("15m ago");
  });

  it("formats hours ago", () => {
    expect(formatRelativeTime(new Date("2026-08-14T09:00:00Z"), now)).toBe("3h ago");
  });

  it("formats days ago", () => {
    expect(formatRelativeTime(new Date("2026-08-11T12:00:00Z"), now)).toBe("3d ago");
  });

  it("accepts a date string as well as a Date", () => {
    expect(formatRelativeTime("2026-08-14T11:45:00Z", now)).toBe("15m ago");
  });
});
