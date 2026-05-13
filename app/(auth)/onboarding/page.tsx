"use client"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { sectors, competencies } from "@/lib/mock-data"
import { CheckCircle, ArrowRight, GraduationCap, ChevronDown } from "lucide-react"

type Step = 1 | 2 | 3 | 4

interface OnboardingData {
  targetSector: string
  targetRole: string
  targetCompanies: string
  university: string
  degree: string
  graduationYear: string
  biggestWeakness: string
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [data, setData] = useState<OnboardingData>({
    targetSector: "",
    targetRole: "",
    targetCompanies: "",
    university: "",
    degree: "",
    graduationYear: "",
    biggestWeakness: "",
  })

  const update = (key: keyof OnboardingData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const steps = [
    { num: 1, label: "Target Role" },
    { num: 2, label: "Companies" },
    { num: 3, label: "Education" },
    { num: 4, label: "Profile" },
  ]

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
              step > s.num ? "bg-green-500 text-white" :
              step === s.num ? "bg-blue-600 text-white" :
              "bg-white/20 text-white/40"
            )}>
              {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
            </div>
            <span className={cn("text-xs font-medium hidden sm:block", step === s.num ? "text-white" : "text-white/40")}>{s.label}</span>
            {i < steps.length - 1 && <div className={cn("flex-1 h-px", step > s.num ? "bg-green-500" : "bg-white/10")} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8">
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Step 1 of 4</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Target sector & role</h2>
            <p className="text-sm text-gray-500 mb-6">This personalises your preparation to your specific goal</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Target Sector</label>
                <div className="relative">
                  <select
                    value={data.targetSector}
                    onChange={e => update("targetSector", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a sector...</option>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Target Role Title</label>
                <input
                  value={data.targetRole}
                  onChange={e => update("targetRole", e.target.value)}
                  placeholder="e.g. Graduate Analyst – Financial Services Consulting"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Step 2 of 4</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Target companies</h2>
            <p className="text-sm text-gray-500 mb-6">We&apos;ll tailor your preparation to these firms specifically</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Companies (comma-separated)</label>
              <textarea
                value={data.targetCompanies}
                onChange={e => update("targetCompanies", e.target.value)}
                placeholder="e.g. McKinsey, Deloitte, Goldman Sachs, HSBC"
                className="w-full h-28 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-2">Add all the firms you plan to apply to — we&apos;ll tailor your STAR answers, sector knowledge, and CV to each one.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Step 3 of 4</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your education</h2>
            <p className="text-sm text-gray-500 mb-6">Used to personalise your profile and scoring</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">University</label>
                <input
                  value={data.university}
                  onChange={e => update("university", e.target.value)}
                  placeholder="e.g. University of Edinburgh"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Degree</label>
                <input
                  value={data.degree}
                  onChange={e => update("degree", e.target.value)}
                  placeholder="e.g. Finance & Economics BSc"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Graduation Year</label>
                <div className="relative">
                  <select
                    value={data.graduationYear}
                    onChange={e => update("graduationYear", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select year...</option>
                    {[2025, 2026, 2027, 2028].map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Step 4 of 4</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your biggest challenge</h2>
            <p className="text-sm text-gray-500 mb-6">Help us focus your preparation on what matters most</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">What&apos;s your biggest weakness in applications?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Psychometric tests", "Video interviews", "STAR answers",
                    "Commercial awareness", "CV writing", "Assessment centres"
                  ].map(w => (
                    <button
                      key={w}
                      onClick={() => update("biggestWeakness", w)}
                      className={cn(
                        "py-2.5 px-3 text-sm rounded-xl border-2 font-medium transition-all text-left",
                        data.biggestWeakness === w
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400">CV upload is available on the CV Tailoring page after setup.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(prev => (prev - 1) as Step)}
              className="px-5 py-2.5 text-gray-600 font-medium text-sm hover:text-gray-800 transition-colors"
            >
              Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={() => setStep(prev => (prev + 1) as Step)}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Start my preparation <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
