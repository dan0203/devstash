import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseJsonBody } from "@/lib/api-request";

const schema = z.object({ email: z.string().email() });

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("parseJsonBody", () => {
  it("returns the parsed data for a valid body", async () => {
    const result = await parseJsonBody(jsonRequest({ email: "a@b.com" }), schema);
    expect(result).toEqual({ data: { email: "a@b.com" } });
  });

  it("returns a 400 NextResponse for an invalid body", async () => {
    const result = await parseJsonBody(jsonRequest({ email: "not-an-email" }), schema);

    expect("response" in result).toBe(true);
    if (!("response" in result)) throw new Error("expected a response");
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toMatchObject({ success: false });
  });
});
