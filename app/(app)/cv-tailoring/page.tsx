"use client"
import { useState, useRef } from "react"
import { Topbar } from "@/components/layout/topbar"
import { KeywordTags } from "@/components/cv/keyword-tags"
import { BulletRewriter } from "@/components/cv/bullet-rewriter"
import { ModuleBars } from "@/components/charts/module-bars"
import { demoATSScore } from "@/lib/mock-data"
import { cn, getScoreColor, getScoreLabel } from "@/lib/utils"
import { Upload, FileText, Loader2, Copy, Check, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react"
import { analyseCVAgainstJobSpec } from "@/lib/ai/service"
import { saveCVScore } from "@/lib/scores"

interface AnalysisResult {
  overall: number
  passLikelihood: string
  breakdown: Record<string, number>
  matchedKeywords: string[]
  missingKeywords: string[]
  weakBullets: string[]
  rewrittenBullets: string[]
  tailoredSummary: string
  formattingWarnings: string[]
  missingItems: string[]
}

const CARD: React.CSSProperties = {
  background: "rgba(8,14,30,0.6)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 20,
}

function ScoreRingCV({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const isHigh = score >= 75
  const isMid  = score >= 40
  const gradStart = isHigh ? "#38BDF8" : isMid ? "#FBBF24" : "#F87171"
  const gradEnd   = isHigh ? "#6366F1" : isMid ? "#F97316" : "#EF4444"

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="cvsg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
          <filter id="cvglow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke="url(#cvsg)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          filter="url(#cvglow)"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white tabular-nums">{score}</span>
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>/100</span>
      </div>
    </div>
  )
}

export default function CVTailoringPage() {
  const [cvText, setCvText] = useState("")
  const [jobSpec, setJobSpec] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult>({
    ...demoATSScore,
    breakdown: demoATSScore.breakdown as Record<string, number>,
  })
  const [showDemo, setShowDemo] = useState(true)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>("keywords")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    setUploadError(null)
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/parse-cv", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setCvText(data.text)
      setUploadedFileName(file.name)
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const clearFile = () => {
    setCvText("")
    setUploadedFileName(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAnalyse = async () => {
    if (!cvText.trim() || !jobSpec.trim()) return
    setLoading(true)
    try {
      const analysis = await analyseCVAgainstJobSpec(cvText, jobSpec)
      setResult({
        overall: analysis.overallScore,
        passLikelihood: analysis.passLikelihood,
        breakdown: analysis.breakdown as Record<string, number>,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
        weakBullets: analysis.weakBullets,
        rewrittenBullets: analysis.rewrittenBullets,
        tailoredSummary: analysis.tailoredSummary,
        formattingWarnings: analysis.formattingWarnings,
        missingItems: analysis.missingItems,
      })
      saveCVScore({ score: analysis.overallScore, date: new Date().toISOString(), jobSpec: jobSpec.slice(0, 120) })
      setShowDemo(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCopySummary = () => {
    navigator.clipboard.writeText(result.tailoredSummary)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }

  const breakdownData = Object.entries(result.breakdown).map(([key, val]) => ({
    name: key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
    score: val as number,
  }))

  const passStyle =
    result.passLikelihood === "Strong match"
      ? { color: "#34D399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }
      : result.passLikelihood === "Medium risk"
      ? { color: "#FBBF24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }
      : { color: "#F87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }

  const toggleSection = (key: string) => setExpandedSection(expandedSection === key ? null : key)

  const canAnalyse = cvText.trim() && jobSpec.trim() && !loading

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#020817" }}>
      <Topbar title="CV Tailoring & ATS Scoring" />
      <div className="flex-1 p-6 space-y-5">

        {/* Demo banner */}
        {showDemo && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "#818CF8" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-semibold text-white">Demo mode</span> — showing a sample analysis. Paste your CV and job description below to get your real score.
            </p>
          </div>
        )}

        {/* Input row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CV Upload */}
          <div style={CARD} className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Your CV</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
            {uploadedFileName ? (
              <div className="rounded-xl p-4 mb-4 flex items-center justify-between"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 flex-shrink-0" style={{ color: "#34D399" }} />
                  <div>
                    <p className="text-sm font-medium text-white">{uploadedFileName}</p>
                    <p className="text-xs" style={{ color: "#34D399" }}>
                      Extracted — {cvText.length.toLocaleString()} characters
                    </p>
                  </div>
                </div>
                <button onClick={clearFile} className="transition-opacity hover:opacity-70">
                  <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl p-6 mb-4 text-center cursor-pointer transition-all duration-200"
                style={{
                  border: dragOver ? "2px dashed #38BDF8" : "2px dashed rgba(255,255,255,0.1)",
                  background: dragOver ? "rgba(56,189,248,0.06)" : "rgba(255,255,255,0.02)",
                }}
                onMouseEnter={e => {
                  if (!dragOver) e.currentTarget.style.borderColor = "rgba(56,189,248,0.4)"
                }}
                onMouseLeave={e => {
                  if (!dragOver) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
                }}
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" style={{ color: "#38BDF8" }} />
                    <p className="text-sm font-medium" style={{ color: "#38BDF8" }}>Extracting text...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
                    <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Drag & drop your CV here</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>PDF, DOCX or TXT — or click to browse</p>
                  </>
                )}
              </div>
            )}
            {uploadError && (
              <p className="text-xs mb-3 flex items-center gap-1" style={{ color: "#F87171" }}>
                <AlertTriangle className="w-3 h-3" /> {uploadError}
              </p>
            )}
            <textarea
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              placeholder="Or paste your CV text here..."
              className="w-full h-48 text-sm rounded-xl p-3 resize-none focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(56,189,248,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Job Description */}
          <div style={CARD} className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Job Description / Person Spec</h3>
            <textarea
              value={jobSpec}
              onChange={e => setJobSpec(e.target.value)}
              placeholder="Paste the job description or person specification here..."
              className="w-full h-64 text-sm rounded-xl p-3 resize-none focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <button
              onClick={handleAnalyse}
              disabled={!canAnalyse}
              className="mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={canAnalyse
                ? {
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    color: "#fff",
                    boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.2)",
                    cursor: "not-allowed",
                  }
              }
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
                : <><Sparkles className="w-4 h-4" /> Analyse CV Against Job Spec</>
              }
            </button>
          </div>
        </div>

        {/* Score + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Score ring card */}
          <div style={CARD} className="p-8 flex flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: "rgba(255,255,255,0.35)" }}>ATS Pass Score</p>
            <ScoreRingCV score={result.overall} />
            <span className="mt-5 text-xs font-semibold px-4 py-1.5 rounded-full" style={passStyle}>
              {result.passLikelihood}
            </span>
            <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              {getScoreLabel(result.overall)}
            </p>
          </div>

          {/* Breakdown chart */}
          <div style={CARD} className="lg:col-span-2 p-6">
            <h3 className="text-sm font-semibold text-white mb-5">Score Breakdown</h3>
            <ModuleBars data={breakdownData} horizontal dark />
          </div>
        </div>

        {/* Keywords accordion */}
        <div style={CARD} className="overflow-hidden">
          <button
            onClick={() => toggleSection("keywords")}
            className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.15)" }}>
                <CheckCircle className="w-4 h-4" style={{ color: "#34D399" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Keyword Analysis</h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {result.matchedKeywords.length} matched · {result.missingKeywords.length} missing
                </p>
              </div>
            </div>
            {expandedSection === "keywords"
              ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              : <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            }
          </button>
          {expandedSection === "keywords" && (
            <div className="px-6 pb-6 space-y-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#34D399" }}>
                  Matched ({result.matchedKeywords.length})
                </p>
                <KeywordTags keywords={result.matchedKeywords} variant="matched" dark />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#F87171" }}>
                  Missing ({result.missingKeywords.length}) — add these to improve your score
                </p>
                <KeywordTags keywords={result.missingKeywords} variant="missing" dark />
              </div>
            </div>
          )}
        </div>

        {/* Bullet rewrites accordion */}
        <div style={CARD} className="overflow-hidden">
          <button
            onClick={() => toggleSection("bullets")}
            className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(56,189,248,0.12)" }}>
                <FileText className="w-4 h-4" style={{ color: "#38BDF8" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Weak Bullet Rewrites</h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {result.weakBullets.length} bullet{result.weakBullets.length !== 1 ? "s" : ""} improved by AI
                </p>
              </div>
            </div>
            {expandedSection === "bullets"
              ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              : <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            }
          </button>
          {expandedSection === "bullets" && (
            <div className="px-6 pb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="pt-5">
                <BulletRewriter original={result.weakBullets} rewritten={result.rewrittenBullets} dark />
              </div>
            </div>
          )}
        </div>

        {/* Tailored summary */}
        <div style={CARD} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">AI-Tailored Professional Summary</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Optimised for this specific role
              </p>
            </div>
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                color: copiedSummary ? "#34D399" : "rgba(255,255,255,0.45)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSummary ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-sm leading-relaxed rounded-xl p-4"
            style={{
              color: "rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.03)",
              borderLeft: "3px solid #6366F1",
              paddingLeft: "16px",
            }}>
            {result.tailoredSummary}
          </p>
        </div>

        {/* Warnings + Missing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-2">
          <div style={CARD} className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(251,191,36,0.12)" }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#FBBF24" }} />
              </div>
              <h3 className="text-sm font-semibold text-white">Formatting Warnings</h3>
            </div>
            <ul className="space-y-2.5">
              {result.formattingWarnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#FBBF24" }} />
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div style={CARD} className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(248,113,113,0.12)" }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
              </div>
              <h3 className="text-sm font-semibold text-white">Missing Items</h3>
            </div>
            <ul className="space-y-2.5">
              {result.missingItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#F87171" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
