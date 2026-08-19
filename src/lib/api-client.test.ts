import { afterEach, describe, expect, it, vi } from "vitest";
import { postJson } from "./api-client";

describe("postJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a JSON POST request and returns the parsed response body", async () => {
    const json = vi.fn().mockResolvedValue({ success: true });
    const fetchMock = vi.fn().mockResolvedValue({ json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await postJson<{ success: boolean }>("/api/example", { foo: "bar" });

    expect(fetchMock).toHaveBeenCalledWith("/api/example", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foo: "bar" }),
    });
    expect(result).toEqual({ success: true });
  });
});