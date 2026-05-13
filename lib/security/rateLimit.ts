// In-memory rate limiter. Replace with Upstash Redis for multi-instance production deployments.

interface RateLimitRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitRecord>()

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const record = store.get(key)

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt, retryAfterSeconds: 0 }
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
    retryAfterSeconds: 0,
  }
}

// Pre-configured limiters for common use cases
export const limits = {
  /** 5 AI calls per minute per user */
  aiCall: (userId: string) => rateLimit(`ai:${userId}`, 5, 60_000),
  /** 3 password reset emails per hour per email */
  passwordReset: (email: string) => rateLimit(`reset:${email}`, 3, 3_600_000),
  /** 10 login attempts per 15 minutes per IP */
  login: (ip: string) => rateLimit(`login:${ip}`, 10, 15 * 60_000),
  /** 3 file uploads per minute per user */
  fileUpload: (userId: string) => rateLimit(`upload:${userId}`, 3, 60_000),
  /** 20 API calls per minute per IP (general) */
  api: (ip: string) => rateLimit(`api:${ip}`, 20, 60_000),
}

export function rateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({ error: `Too many requests. Retry in ${result.retryAfterSeconds} seconds.` }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
      },
    }
  )
}
