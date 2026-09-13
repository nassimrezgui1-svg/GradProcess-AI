import { describe, it, expect } from "vitest"
import { execFileSync } from "node:child_process"
import { join } from "node:path"

/**
 * The Reports page stopped rendering entirely — React threw "Rendered more
 * hooks than during the previous render" and the user got Next's error screen
 * with a Try again button. A useMemo had been added below `if (!scores) return
 * null`, so it was skipped on the first render (scores load in an effect) and
 * ran on the next.
 *
 * eslint-config-next already carries react-hooks/rules-of-hooks and flags this
 * exactly. It was missed because Next 16 no longer runs ESLint during
 * `next build`, and the checks being run were tsc, vitest and build. Running
 * the rule here puts it back in the gate.
 */

const root = join(__dirname, "..")

describe("no component calls hooks conditionally", () => {
  it("passes react-hooks/rules-of-hooks across app and components", () => {
    let output = ""
    try {
      output = execFileSync(
        "npx",
        ["eslint", "app", "components", "lib", "--format", "json",
         "--rule", '{"react-hooks/rules-of-hooks":"error"}'],
        { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 180_000 }
      )
    } catch (e: any) {
      // ESLint exits non-zero when it reports errors; the JSON is still on stdout.
      output = e.stdout ?? ""
      if (!output) throw e
    }

    const results = JSON.parse(output) as {
      filePath: string
      messages: { ruleId: string | null; line: number; message: string }[]
    }[]

    const violations = results.flatMap(r =>
      r.messages
        .filter(m => m.ruleId === "react-hooks/rules-of-hooks")
        .map(m => `${r.filePath.replace(root + "/", "")}:${m.line} ${m.message}`)
    )

    expect(violations, `hooks called conditionally:\n${violations.join("\n")}`).toEqual([])
  }, 200_000)
})
