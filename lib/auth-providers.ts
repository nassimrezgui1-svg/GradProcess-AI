/**
 * Whether Google sign-in is actually configured on the Supabase project.
 *
 * The button used to render unconditionally while the provider was disabled.
 * Clicking it — the first control on both the sign-up and sign-in pages — sent
 * the user to a raw JSON error on a supabase.co URL with no way back:
 *
 *   {"code":400,"error_code":"validation_failed",
 *    "msg":"Unsupported provider: provider is not enabled"}
 *
 * Set NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true once the provider is enabled in
 * Supabase (Authentication → Providers → Google) and the Google Cloud OAuth
 * client lists the project's callback as an authorised redirect URI. Until
 * then the button stays hidden, and email sign-up is the only route offered.
 */
export const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"
