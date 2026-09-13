import { afterEach, describe, expect, it, vi } from "vitest";
import { isRegistrationEnabled } from "./registration";

describe("isRegistrationEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when REGISTRATION_ENABLED is unset", () => {
    vi.stubEnv("REGISTRATION_ENABLED", "");
    expect(isRegistrationEnabled()).toBe(false);
  });

  it("returns false for any value other than the literal string 'true'", () => {
    vi.stubEnv("REGISTRATION_ENABLED", "false");
    expect(isRegistrationEnabled()).toBe(false);
  });

  it("returns true when REGISTRATION_ENABLED is exactly 'true'", () => {
    vi.stubEnv("REGISTRATION_ENABLED", "true");
    expect(isRegistrationEnabled()).toBe(true);
  });
});
