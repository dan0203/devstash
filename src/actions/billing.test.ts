import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock factories are hoisted above imports/const declarations, so the
// mocks they reference must be created via vi.hoisted().
const {
  mockAuth,
  mockGetStripeCustomerContext,
  mockSetStripeCustomerId,
  mockCustomersCreate,
  mockCheckoutSessionsCreate,
  mockBillingPortalSessionsCreate,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetStripeCustomerContext: vi.fn(),
  mockSetStripeCustomerId: vi.fn(),
  mockCustomersCreate: vi.fn(),
  mockCheckoutSessionsCreate: vi.fn(),
  mockBillingPortalSessionsCreate: vi.fn(),
}));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

vi.mock(import("@/lib/db/billing"), () => ({
  getStripeCustomerContext: mockGetStripeCustomerContext,
  setStripeCustomerId: mockSetStripeCustomerId,
}) as never);

vi.mock(import("@/lib/stripe"), () => ({
  stripe: {
    customers: { create: mockCustomersCreate },
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
    billingPortal: { sessions: { create: mockBillingPortalSessionsCreate } },
  },
  STRIPE_PRICE_IDS: { monthly: "price_monthly", yearly: "price_yearly" },
}) as never);

import { createCheckoutSession, createPortalSession } from "./billing";

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a new Stripe customer when the user has none yet", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetStripeCustomerContext.mockResolvedValue({
      stripeCustomerId: null,
      email: "demo@devstash.io",
      name: "Demo User",
    });
    mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    const result = await createCheckoutSession("monthly");

    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "demo@devstash.io", name: "Demo User" })
    );
    expect(mockSetStripeCustomerId).toHaveBeenCalledWith("user-1", "cus_new");
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new",
        mode: "subscription",
        line_items: [{ price: "price_monthly", quantity: 1 }],
      })
    );
    expect(result).toEqual({ success: true, url: "https://checkout.stripe.com/session" });
  });

  it("reuses an existing Stripe customer without creating a new one", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetStripeCustomerContext.mockResolvedValue({
      stripeCustomerId: "cus_existing",
      email: "demo@devstash.io",
      name: "Demo User",
    });
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    const result = await createCheckoutSession("yearly");

    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" })
    );
    expect(result).toEqual({ success: true, url: "https://checkout.stripe.com/session" });
  });
});

describe("createPortalSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createPortalSession();

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockBillingPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the user has no Stripe customer yet", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetStripeCustomerContext.mockResolvedValue({
      stripeCustomerId: null,
      email: "demo@devstash.io",
      name: "Demo User",
    });

    const result = await createPortalSession();

    expect(result).toEqual({ success: false, error: "No billing account found" });
    expect(mockBillingPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("delegates to Stripe's Billing Portal and returns its URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetStripeCustomerContext.mockResolvedValue({
      stripeCustomerId: "cus_existing",
      email: "demo@devstash.io",
      name: "Demo User",
    });
    mockBillingPortalSessionsCreate.mockResolvedValue({ url: "https://billing.stripe.com/session" });

    const result = await createPortalSession();

    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" })
    );
    expect(result).toEqual({ success: true, url: "https://billing.stripe.com/session" });
  });
});
