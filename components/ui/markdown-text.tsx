import { parseMarkdown, type Inline } from "@/lib/markdown"

function Spans({ spans }: { spans: Inline[] }) {
  return (
    <>
      {spans.map((s, i) => {
        if (s.type === "bold") return <strong key={i} className="font-semibold">{s.value}</strong>
        if (s.type === "italic") return <em key={i} className="italic">{s.value}</em>
        if (s.type === "code") {
          return (
            <code key={i} className="px-1 py-0.5 rounded text-[0.85em] font-mono"
              style={{ background: "rgba(127,127,127,0.16)" }}>
              {s.value}
            </code>
          )
        }
        return <span key={i} className="whitespace-pre-wrap">{s.value}</span>
      })}
    </>
  )
}

/** Renders AI Markdown as React nodes — never as raw HTML. */
export function MarkdownText({ children }: { children: string }) {
  const blocks = parseMarkdown(children)
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        if (b.type === "bullet") {
          return (
            <ul key={i} className="list-disc pl-4 space-y-1">
              {b.items.map((item, j) => <li key={j}><Spans spans={item} /></li>)}
            </ul>
          )
        }
        if (b.type === "numbered") {
          return (
            <ol key={i} className="list-decimal pl-4 space-y-1">
              {b.items.map((item, j) => <li key={j}><Spans spans={item} /></li>)}
            </ol>
          )
        }
        return <p key={i}><Spans spans={b.spans} /></p>
      })}
    </div>
  )
}
