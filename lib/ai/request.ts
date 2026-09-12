/**
 * Client-side calls to the AI endpoints.
 *
 * These requests had no timeout at all: a slow upstream model left the button
 * spinning indefinitely. A September 2026 audit recorded individual calls held
 * open for 41s and 113s, and both STAR generation and psychometric question
 * generation never resolved at all — no response, no error, no way back.
 *
 * Every AI call now fails loudly within a bounded time and says what to do.
 */

/** Generous enough for a real generation (~20-25s observed), short enough to not feel hung. */
export const AI_TIMEOUT_MS = 45_000

export class AiRequestError extends Error {
  constructor(message: string, readonly kind: "timeout" | "http" | "network" | "parse") {
    super(message)
    this.name = "AiRequestError"
  }
}

/**
 * POSTs JSON to an AI route and resolves within AI_TIMEOUT_MS or throws.
 * Callers get a message they can show the user directly.
 */
export async function postAI<T>(
  path: string,
  body: unknown,
  { timeoutMs = AI_TIMEOUT_MS, signal }: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  // Let the caller cancel too (e.g. the user navigates away).
  signal?.addEventListener("abort", () => controller.abort(), { once: true })

  let res: Response
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new AiRequestError(
        `This took longer than ${Math.round(timeoutMs / 1000)} seconds and was stopped. Please try again.`,
        "timeout"
      )
    }
    throw new AiRequestError("Could not reach the server. Check your connection and try again.", "network")
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const message = await res
      .json()
      .then((d: { error?: string }) => d?.error)
      .catch(() => undefined)
    throw new AiRequestError(message || `Request failed (${res.status}). Please try again.`, "http")
  }

  try {
    return (await res.json()) as T
  } catch {
    throw new AiRequestError("The response could not be read. Please try again.", "parse")
  }
}
