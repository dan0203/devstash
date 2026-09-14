import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock factories are hoisted above imports/const declarations, so the
// mocks they reference must be created via vi.hoisted().
const {
  mockAuth,
  mockGetStripeCustomerContext,
  mockSetStripeCustomerId,
  mockCustomersCreate,
  mockCheckoutSessionsCreate,
  mockBillingPortalSessionsCreate,
  mockTestCustomersCreate,
  mockTestCheckoutSessionsCreate,
  mockTestBillingPortalSessionsCreate,
  mockIsStripeTestModeConfigured,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetStripeCustomerContext: vi.fn(),
  mockSetStripeCustomerId: vi.fn(),
  mockCustomersCreate: vi.fn(),
  mockCheckoutSessionsCreate: vi.fn(),
  mockBillingPortalSessionsCreate: vi.fn(),
  mockTestCustomersCreate: vi.fn(),
  mockTestCheckoutSessionsCreate: vi.fn(),
  mockTestBillingPortalSessionsCreate: vi.fn(),
  mockIsStripeTestModeConfigured: vi.fn(),
}));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

vi.mock(
  import("@/lib/db/billing"),
  () =>
    ({
      getStripeCustomerContext: mockGetStripeCustomerContext,
      setStripeCustomerId: mockSetStripeCustomerId,
    }) as never,
);

vi.mock(
  import("@/lib/stripe"),
  () =>
    ({
      stripe: {
        customers: { create: mockCustomersCreate },
        checkout: { sessions: { create: mockCheckoutSessionsCreate } },
        billingPortal: { sessions: { create: mockBillingPortalSessionsCreate } },
      },
      stripeTest: {
        customers: { create: mockTestCustomersCreate },
        checkout: { sessions: { create: mockTestCheckoutSessionsCreate } },
        billingPortal: { sessions: { create: mockTestBillingPortalSessionsCreate } },
      },
      STRIPE_PRICE_IDS: { monthly: "price_monthly", yearly: "price_yearly" },
      STRIPE_TEST_PRICE_IDS: { monthly: "price_monthly_test", yearly: "price_yearly_test" },
      isStripeTestModeConfigured: mockIsStripeTestModeConfigured,
    }) as never,
);

import { createCheckoutSession, createPortalSession } from "./billing";

describe("createCheckoutSession", () => {
  const originalDemoEmail = process.env.DEMO_ACCOUNT_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEMO_ACCOUNT_EMAIL;
    mockIsStripeTestModeConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    process.env.DEMO_ACCOUNT_EMAIL = originalDemoEmail;
  });

  it("routes the public demo account through the test-mode Stripe client", async () => {
    process.env.DEMO_ACCOUNT_EMAIL = "guest@devstash.io";
    mockAuth.mockResolvedValue({ user: { id: "guest-user" } });
    mockGetStripeCustomerContext.mockResolvedValue({
      stripeCustomerId: null,
      email: "guest@devstash.io",
      name: "Guest",
    });
    mockTestCustomersCreate.mockResolvedValue({ id: "cus_test_new" });
    mockTestCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/test-session" });

    const result = await createCheckoutSession("monthly");

    expect(mockTestCustomersCreate).toHaveBeenCalled();
    expect(mockTestCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_test_new", line_items: [{ price: "price_monthly_test", quantity: 1 }] }),
    );
    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, url: "https://checkout.stripe.com/test-session" });
  });

  it("blocks demo checkout when test mode isn't configured", async () => {
    process.env.DEMO_ACCOUNT_EMAIL = "guest@devstash.io";
    mockIsStripeTestModeConfigured.mockReturnValue(false);
    mockAuth.mockResolvedValue({ user: { id: "guest-user" } });
    mockGetStripeCustomerContext.mockResolvedValue({
      stripeCustomerId: null,
      email: "guest@devstash.io",
      name: "Guest",
    });

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Demo checkout isn't configured right now. Please try again later.",
    });
    expect(mockTestCheckoutSessionsCreate).not.toHaveBeenCalled();
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
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
      expect.objectContaining({ email: "demo@devstash.io", name: "Demo User" }),
    );
    expect(mockSetStripeCustomerId).toHaveBeenCalledWith("user-1", "cus_new");
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new",
        mode: "subscription",
        line_items: [{ price: "price_monthly", quantity: 1 }],
      }),
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
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_existing" }));
    expect(result).toEqual({ success: true, url: "https://checkout.stripe.com/session" });
  });
});

describe("createPortalSession", () => {
  const originalDemoEmail = process.env.DEMO_ACCOUNT_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEMO_ACCOUNT_EMAIL;
  });

  afterEach(() => {
    process.env.DEMO_ACCOUNT_EMAIL = originalDemoEmail;
  });

  it("routes the public demo account through the test-mode billing portal", async () => {
    process.env.DEMO_ACCOUNT_EMAIL = "guest@devstash.io";
    mockAuth.mockResolvedValue({ user: { id: "guest-user" } });
    mockGetStripeCustomerContext.mockResolvedValue({
      stripeCustomerId: "cus_test_existing",
      email: "guest@devstash.io",
      name: "Guest",
    });
    mockTestBillingPortalSessionsCreate.mockResolvedValue({ url: "https://billing.stripe.com/test-session" });

    const result = await createPortalSession();

    expect(mockTestBillingPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_test_existing" }),
    );
    expect(mockBillingPortalSessionsCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, url: "https://billing.stripe.com/test-session" });
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

    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_existing" }));
    expect(result).toEqual({ success: true, url: "https://billing.stripe.com/session" });
  });
});
