"use client"
import { useMemo } from "react"
import { Check, X } from "lucide-react"
import { PASSWORD_REQUIREMENTS, getPasswordScore, getPasswordStrengthLabel } from "@/lib/security/validation"

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, requirements } = useMemo(() => {
    const reqs = PASSWORD_REQUIREMENTS.map(r => ({ ...r, met: r.test(password) }))
    return { score: reqs.filter(r => r.met).length, requirements: reqs }
  }, [password])

  if (!password) return null

  const strength = getPasswordStrengthLabel(score)

  return (
    <div className="mt-2 space-y-2.5" role="status" aria-label={`Password strength: ${strength.label}`}>
      {/* Strength bars */}
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? strength.color : "#E5E7EB" }}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-xs font-semibold" style={{ color: strength.color }}>
        {strength.label}
      </p>

      {/* Requirements checklist */}
      <ul className="space-y-1" aria-label="Password requirements">
        {requirements.map(req => (
          <li key={req.id} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="w-3 h-3 flex-shrink-0 text-emerald-500" aria-hidden="true" />
            ) : (
              <X className="w-3 h-3 flex-shrink-0 text-gray-300" aria-hidden="true" />
            )}
            <span className={req.met ? "text-emerald-700" : "text-gray-400"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { getPasswordScore, getPasswordStrengthLabel }
