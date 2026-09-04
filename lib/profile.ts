import { readLocal, writeLocal } from "@/lib/db/local"
import { pushProfile } from "@/lib/db/cloud"

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
  return { ...defaults, ...readLocal<Partial<UserProfile>>("gradprocess_profile", {}) }
}

export function saveProfile(profile: UserProfile) {
  writeLocal("gradprocess_profile", profile)
  void pushProfile(profile)
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
