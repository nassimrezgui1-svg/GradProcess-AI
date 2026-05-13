// Client-side audit log helper — sends events to the audit_logs table via Supabase.
// Server-side routes use supabase service client directly.

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "SIGNUP"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "EMAIL_VERIFIED"
  | "ACCOUNT_DELETED"
  | "DATA_EXPORTED"
  | "VIDEO_DOWNLOADED"
  | "VIDEO_DELETED"
  | "TRANSCRIPT_DELETED"
  | "RECORDING_CONSENT_GIVEN"
  | "RECORDING_CONSENT_REVOKED"
  | "PRIVACY_SETTINGS_CHANGED"
  | "CV_UPLOADED"
  | "CV_DELETED"
  | "APPLICATION_CREATED"
  | "APPLICATION_DELETED"
  | "BREAKDOWN_GENERATED"
  | "SUBSCRIPTION_CHANGED"
  | "SESSION_EXPIRED"

export interface AuditEntry {
  action: AuditAction
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, string | number | boolean>
}

/**
 * Log a security or data event. On the client side this hits our own API;
 * on the server side call insertAuditLog() from the service-role client.
 */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    })
  } catch {
    // Audit log failures must never break the main user flow
  }
}
