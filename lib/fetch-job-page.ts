import dns from "node:dns/promises"
import net from "node:net"

/**
 * Fetches a job advert and returns its readable text.
 *
 * The tracker offered a "Paste job URL" field and enabled the extract button
 * with only a URL in it, but nothing ever fetched the page: the URL string
 * itself was handed to the model as though it were the job description, so the
 * model guessed from the slug or the route rejected it for being under its
 * 30-character minimum.
 *
 * This fetches user-supplied URLs from the server, which is a request-forgery
 * risk if taken naively — an attacker could aim it at the cloud metadata
 * endpoint or anything else inside the network. Every hop is therefore resolved
 * and checked against private address space before a connection is made, and
 * the response is capped in both size and time.
 */

const MAX_BYTES = 1_500_000
const TIMEOUT_MS = 12_000
const MAX_REDIRECTS = 3

export class JobPageError extends Error {
  constructor(message: string, readonly kind: "invalid" | "blocked" | "unreachable" | "unreadable") {
    super(message)
    this.name = "JobPageError"
  }
}

/** True for anything that is not a public internet address. */
function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number)
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true          // link-local, incl. cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
    return false
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase()
    if (v === "::1" || v === "::") return true
    if (v.startsWith("fc") || v.startsWith("fd")) return true  // unique local
    if (v.startsWith("fe80")) return true                       // link-local
    if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7))
    return false
  }
  return true
}

async function assertPublic(target: URL) {
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    throw new JobPageError("That link is not a web address.", "invalid")
  }
  let addresses
  try {
    addresses = await dns.lookup(target.hostname, { all: true })
  } catch {
    throw new JobPageError("That address could not be found.", "unreachable")
  }
  if (addresses.some(a => isPrivateAddress(a.address))) {
    throw new JobPageError("That address is not reachable.", "blocked")
  }
}

/** Strips a page down to the text a person would read. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function fetchJobPage(rawUrl: string): Promise<string> {
  let target: URL
  try {
    target = new URL(rawUrl.trim())
  } catch {
    throw new JobPageError("That does not look like a web address.", "invalid")
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(target)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(target, {
        redirect: "manual",          // every hop is re-checked rather than followed blindly
        signal: controller.signal,
        headers: {
          // Job boards serve very different markup to an unidentified client.
          "User-Agent": "Mozilla/5.0 (compatible; GradProcessAI/1.0; +https://gradprocessai.com)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-GB,en;q=0.9",
        },
      })
    } catch {
      throw new JobPageError("That page could not be opened. Paste the job description instead.", "unreachable")
    } finally {
      clearTimeout(timer)
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location")
      if (!location) throw new JobPageError("That page could not be opened.", "unreachable")
      target = new URL(location, target)
      continue
    }

    if (!res.ok) {
      throw new JobPageError(
        res.status === 403 || res.status === 401
          ? "That site blocks automated readers. Paste the job description instead."
          : `That page returned an error (${res.status}). Paste the job description instead.`,
        "unreachable"
      )
    }

    const type = res.headers.get("content-type") ?? ""
    if (!type.includes("html") && !type.includes("text")) {
      throw new JobPageError("That link is not a web page. Paste the job description instead.", "unreadable")
    }

    const buffer = await res.arrayBuffer()
    const html = new TextDecoder().decode(buffer.slice(0, MAX_BYTES))
    const text = htmlToText(html)

    // Many boards render the advert with JavaScript, leaving almost nothing in
    // the HTML. Saying so is more use than handing the model an empty page.
    if (text.length < 200) {
      throw new JobPageError(
        "That page did not contain readable text — it probably loads the advert with JavaScript. Paste the job description instead.",
        "unreadable"
      )
    }
    return text
  }

  throw new JobPageError("That link redirected too many times.", "unreachable")
}
