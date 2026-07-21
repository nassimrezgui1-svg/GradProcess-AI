import { describe, it, expect } from "vitest"
import {
  getPasswordScore,
  getPasswordStrengthLabel,
  passwordSchema,
  loginSchema,
  signupSchema,
  analyseCvSchema,
  avaChatSchema,
  validateFileUpload,
  MAX_SIZES,
} from "@/lib/security/validation"

describe("getPasswordScore", () => {
  it("scores an empty password 0", () => {
    expect(getPasswordScore("")).toBe(0)
  })

  it("scores a fully compliant password 5", () => {
    expect(getPasswordScore("Str0ng!Password#2024")).toBe(5)
  })

  it("misses length requirement below 12 chars", () => {
    expect(getPasswordScore("Ab1!x")).toBe(4) // upper, lower, number, symbol — no length
  })

  it("requires a symbol", () => {
    expect(getPasswordScore("Abcdefgh12345")).toBe(4) // no symbol
  })
})

describe("getPasswordStrengthLabel", () => {
  it("labels 0-1 Very Weak and 5 Strong", () => {
    expect(getPasswordStrengthLabel(0).label).toBe("Very Weak")
    expect(getPasswordStrengthLabel(5).label).toBe("Strong")
  })
})

describe("passwordSchema", () => {
  it("rejects short passwords", () => {
    expect(passwordSchema.safeParse("Ab1!").success).toBe(false)
  })
  it("accepts a compliant password", () => {
    expect(passwordSchema.safeParse("Str0ng!Password#2024").success).toBe(true)
  })
})

describe("auth schemas", () => {
  it("loginSchema rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false)
  })
  it("signupSchema lowercases email and trims name", () => {
    const parsed = signupSchema.parse({
      name: "  Nassim  ",
      email: "TEST@Example.COM",
      password: "Str0ng!Password#2024",
    })
    expect(parsed.email).toBe("test@example.com")
    expect(parsed.name).toBe("Nassim")
  })
})

describe("AI API schemas", () => {
  it("analyseCvSchema enforces min lengths", () => {
    expect(analyseCvSchema.safeParse({ cvText: "too short", jobSpec: "also short" }).success).toBe(false)
  })
  it("analyseCvSchema accepts realistic input", () => {
    expect(
      analyseCvSchema.safeParse({
        cvText: "A".repeat(200),
        jobSpec: "B".repeat(100),
      }).success
    ).toBe(true)
  })
  it("avaChatSchema caps history at 20 turns", () => {
    const history = Array.from({ length: 21 }, () => ({ role: "user" as const, content: "hi" }))
    expect(avaChatSchema.safeParse({ message: "hello", history }).success).toBe(false)
  })
})

describe("validateFileUpload", () => {
  it("accepts a small PDF", () => {
    expect(
      validateFileUpload({ name: "cv.pdf", type: "application/pdf", size: 1024 }, "document")
    ).toEqual({ valid: true })
  })

  it("always rejects dangerous extensions regardless of MIME type", () => {
    const result = validateFileUpload(
      { name: "payload.exe", type: "application/pdf", size: 10 },
      "document"
    )
    expect(result.valid).toBe(false)
  })

  it("rejects oversize documents", () => {
    const result = validateFileUpload(
      { name: "cv.pdf", type: "application/pdf", size: MAX_SIZES.document + 1 },
      "document"
    )
    expect(result.valid).toBe(false)
  })
})
