export interface UserProfile {
  name: string
  email: string
  university: string
  degree: string
  graduationYear: string
  targetSector: string
  targetRole: string
  targetCompanies: string
}

const KEY = "gradprocess_profile"

const defaults: UserProfile = {
  name: "",
  email: "",
  university: "",
  degree: "",
  graduationYear: "",
  targetSector: "",
  targetRole: "",
  targetCompanies: "",
}

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return defaults
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(n => n[0].toUpperCase())
    .slice(0, 2)
    .join("") || "?"
}
