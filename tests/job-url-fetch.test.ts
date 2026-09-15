import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { htmlToText, JobPageError, fetchJobPage } from "@/lib/fetch-job-page"

/**
 * The tracker offered a "Paste job URL" field and enabled the extract button
 * with only a URL in it, but nothing fetched the page. The URL string was sent
 * as the job description — so the model was handed a link and asked to read
 * it, or the route rejected it for being under its 30-character minimum.
 *
 * Fetching a user-supplied URL from the server is a request-forgery risk, so
 * every hop is resolved and checked before a connection is opened.
 */

describe("internal addresses are never fetched", () => {
  const forbidden = [
    ["loopback",        "http://127.0.0.1:3000/api/account/export"],
    ["localhost",       "http://localhost:3000/"],
    ["cloud metadata",  "http://169.254.169.254/latest/meta-data/"],
    ["private class A", "http://10.0.0.1/"],
    ["private class C", "http://192.168.1.1/"],
    ["ipv6 loopback",   "http://[::1]/"],
    ["file scheme",     "file:///etc/passwd"],
    ["ftp scheme",      "ftp://example.com/x"],
    ["not a url",       "paste the description here"],
  ] as const

  for (const [name, url] of forbidden) {
    it(`refuses ${name}`, async () => {
      await expect(fetchJobPage(url)).rejects.toBeInstanceOf(JobPageError)
    }, 20_000)
  }
})

describe("page text extraction", () => {
  it("keeps the words and drops the markup", () => {
    const html = `<html><head><style>.a{color:red}</style><script>alert(1)</script></head>
      <body><h1>Graduate Analyst</h1><p>You will build financial models.</p>
      <ul><li>Excel</li><li>SQL</li></ul></body></html>`
    const text = htmlToText(html)
    expect(text).toContain("Graduate Analyst")
    expect(text).toContain("financial models")
    expect(text).toContain("Excel")
    expect(text).not.toContain("alert(1)")
    expect(text).not.toContain("color:red")
    expect(text).not.toMatch(/<[a-z]/i)
  })

  it("decodes the entities a job advert actually contains", () => {
    expect(htmlToText("<p>R&amp;D &quot;team&quot; &lt;lead&gt;</p>")).toBe('R&D "team" <lead>')
  })

  it("puts line breaks where blocks ended, so lists stay readable", () => {
    expect(htmlToText("<li>One</li><li>Two</li>")).toMatch(/One\s*\n\s*Two/)
  })
})

describe("the route and the form agree on what a URL is", () => {
  const root = join(__dirname, "..")
  const route = readFileSync(join(root, "app", "api", "ai", "tracker", "extract-role", "route.ts"), "utf8")
  const tracker = readFileSync(join(root, "app", "(app)", "tracker", "page.tsx"), "utf8")

  it("the route fetches a url rather than reading it as prose", () => {
    expect(route).toMatch(/fetchJobPage\(url\)/)
  })

  it("the form sends the url as a url", () => {
    expect(tracker).not.toMatch(/jdText\.trim\(\) \|\| url\.trim\(\)/)
    expect(tracker).toMatch(/url: link \|\| undefined/)
  })

  it("a url on its own is enough to start extraction", () => {
    expect(tracker).toMatch(/if \(!text && !link\) return/)
  })

  it("explains itself when a page cannot be read", () => {
    expect(route).toMatch(/status: 422/)
  })
})
