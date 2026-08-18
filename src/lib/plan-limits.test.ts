import { describe, expect, it } from "vitest";
import { isOverCollectionLimit, isOverItemLimit } from "./plan-limits";

describe("isOverItemLimit", () => {
  it("returns false just under the free-tier item limit", () => {
    expect(isOverItemLimit(false, 49)).toBe(false);
  });

  it("returns true at the free-tier item limit", () => {
    expect(isOverItemLimit(false, 50)).toBe(true);
  });

  it("returns true just over the free-tier item limit", () => {
    expect(isOverItemLimit(false, 51)).toBe(true);
  });

  it("always returns false for pro users regardless of count", () => {
    expect(isOverItemLimit(true, 51)).toBe(false);
  });
});

describe("isOverCollectionLimit", () => {
  it("returns false just under the free-tier collection limit", () => {
    expect(isOverCollectionLimit(false, 2)).toBe(false);
  });

  it("returns true at the free-tier collection limit", () => {
    expect(isOverCollectionLimit(false, 3)).toBe(true);
  });

  it("returns true just over the free-tier collection limit", () => {
    expect(isOverCollectionLimit(false, 4)).toBe(true);
  });

  it("always returns false for pro users regardless of count", () => {
    expect(isOverCollectionLimit(true, 4)).toBe(false);
  });
});
