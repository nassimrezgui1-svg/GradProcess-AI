/**
 * Who may use the product.
 *
 * Access requires a paying subscription. Signing up creates the account but
 * grants nothing: the trigger gives new subscriptions the status "incomplete",
 * which fails the check below until Stripe reports a payment. Accounts that
 * existed before that change already carry "active" and keep their access.
 *
 * Pure functions so the rules can be tested without constructing a request.
 */

/** Subscription statuses that grant access to the product. */
const ACTIVE_STATUSES = new Set(["active", "trialing"])

/**
 * Fails closed: an unknown, missing or null status grants nothing. A paywall
 * that errors open is not a paywall.
 */
export function hasProductAccess(status: string | null | undefined): boolean {
  return typeof status === "string" && ACTIVE_STATUSES.has(status)
}

/**
 * Paths a signed-in user reaches without a subscription.
 *
 * Billing is how they pay, onboarding is account setup, and the marketing and
 * auth pages must never be gated or a blocked user has nowhere to go.
 */
const ALWAYS_ALLOWED = [
  "/billing",
  "/onboarding",
  "/pricing",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]

export function requiresSubscription(pathname: string): boolean {
  return !ALWAYS_ALLOWED.some(p => pathname === p || pathname.startsWith(p + "/"))
}

/** Where to send a signed-in user who has not paid. */
export const PAYWALL_REDIRECT = "/pricing?gate=1"
