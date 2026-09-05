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
  /** Set once the onboarding questions have been answered or skipped. */
  onboardingComplete: boolean
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
  onboardingComplete: false,
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

/** Records that the user has been through onboarding, so we stop routing them there. */
export function markOnboardingComplete() {
  saveProfile({ ...loadProfile(), onboardingComplete: true })
}

/** True when a signed-in user has never answered the onboarding questions. */
export function needsOnboarding(): boolean {
  const p = loadProfile()
  return !p.onboardingComplete && !p.targetSector && !p.targetRole
}
