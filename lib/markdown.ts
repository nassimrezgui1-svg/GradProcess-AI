// Minimal Markdown tokeniser for AI replies.
//
// Ava's answers come back as Markdown, which used to render literally —
// "**My recommendation:**" showed the asterisks. Rather than pull in a full
// Markdown library (and its XSS surface) for a handful of constructs, this
// parses only what the model actually emits and the UI renders the result as
// React nodes, so no HTML is ever injected.

export type Inline =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }

export type Block =
  | { type: "paragraph"; spans: Inline[] }
  | { type: "bullet"; items: Inline[][] }
  | { type: "numbered"; items: Inline[][] }

// Order matters: ** before *, so bold wins over italic.
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of text.matchAll(INLINE_RE)) {
    const i = m.index ?? 0
    if (i > last) out.push({ type: "text", value: text.slice(last, i) })
    const tok = m[0]
    if (tok.startsWith("**")) out.push({ type: "bold", value: tok.slice(2, -2) })
    else if (tok.startsWith("`")) out.push({ type: "code", value: tok.slice(1, -1) })
    else out.push({ type: "italic", value: tok.slice(1, -1) })
    last = i + tok.length
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) })
  return out.length ? out : [{ type: "text", value: text }]
}

const BULLET_RE = /^\s*[-*•]\s+(.*)$/
const NUMBER_RE = /^\s*\d+[.)]\s+(.*)$/

export function parseMarkdown(input: string): Block[] {
  const blocks: Block[] = []
  const lines = (input ?? "").replace(/\r\n/g, "\n").split("\n")

  let para: string[] = []
  let bullets: Inline[][] = []
  let numbers: Inline[][] = []

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "paragraph", spans: parseInline(para.join("\n")) })
      para = []
    }
  }
  const flushBullets = () => {
    if (bullets.length) { blocks.push({ type: "bullet", items: bullets }); bullets = [] }
  }
  const flushNumbers = () => {
    if (numbers.length) { blocks.push({ type: "numbered", items: numbers }); numbers = [] }
  }
  const flushAll = () => { flushPara(); flushBullets(); flushNumbers() }

  for (const line of lines) {
    const bullet = line.match(BULLET_RE)
    const number = line.match(NUMBER_RE)

    if (bullet) {
      flushPara(); flushNumbers()
      bullets.push(parseInline(bullet[1]))
    } else if (number) {
      flushPara(); flushBullets()
      numbers.push(parseInline(number[1]))
    } else if (line.trim() === "") {
      flushAll()
    } else {
      flushBullets(); flushNumbers()
      // Strip heading markers — Ava sometimes emits "### Heading"; the bubble
      // has no heading scale, so keep the words and drop the hashes.
      para.push(line.replace(/^#{1,6}\s+/, ""))
    }
  }
  flushAll()
  return blocks
}
