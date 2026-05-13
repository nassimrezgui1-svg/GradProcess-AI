"use client"
import { useState, useRef } from "react"
import { Topbar } from "@/components/layout/topbar"
import { KeywordTags } from "@/components/cv/keyword-tags"
import { BulletRewriter } from "@/components/cv/bullet-rewriter"
import { ModuleBars } from "@/components/charts/module-bars"
import { demoATSScore } from "@/lib/mock-data"
import { cn, getScoreColor, getScoreBg, getScoreLabel } from "@/lib/utils"
import { Upload, FileText, Loader2, Copy, Check, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, X } from "lucide-react"
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

  const passColor =
    result.passLikelihood === "Strong match" ? "text-green-600 bg-green-50 border-green-200" :
    result.passLikelihood === "Medium risk" ? "text-amber-600 bg-amber-50 border-amber-200" :
    "text-red-600 bg-red-50 border-red-200"

  const toggleSection = (key: string) => setExpandedSection(expandedSection === key ? null : key)

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="CV Tailoring & ATS Scoring" />
      <div className="flex-1 p-6 space-y-6">

        {showDemo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> Showing a sample CV analysis. Paste your CV and job description below to get your personalised score.
            </p>
          </div>
        )}

        {/* Input section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CV Upload / Paste */}
          <div className="bg-white rounded-2xl border border-surface-border p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Your CV</h3>
            {/* File upload zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
            {uploadedFileName ? (
              <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{uploadedFileName}</p>
                    <p className="text-xs text-green-600">Extracted successfully — {cvText.length.toLocaleString()} characters</p>
                  </div>
                </div>
                <button onClick={clearFile} className="text-green-500 hover:text-green-700 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 mb-4 text-center transition-colors cursor-pointer",
                  dragOver ? "border-blue-400 bg-blue-50" : "border-surface-border hover:border-blue-300 hover:bg-blue-50/50"
                )}
              >
                {uploadingFile ? (
                  <><Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-blue-600 font-medium">Extracting text...</p></>
                ) : (
                  <><Upload className="w-8 h-8 text-ink-faint mx-auto mb-2" />
                  <p className="text-sm font-medium text-ink-muted">Drag & drop your CV here</p>
                  <p className="text-xs text-ink-faint mt-1">PDF, DOCX or TXT — or click to browse</p></>
                )}
              </div>
            )}
            {uploadError && (
              <p className="text-xs text-red-600 mb-3 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {uploadError}
              </p>
            )}
            <textarea
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              placeholder="Or paste your CV text here..."
              className="w-full h-48 text-sm border border-surface-border rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-ink"
            />
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-2xl border border-surface-border p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Job Description / Person Spec</h3>
            <textarea
              value={jobSpec}
              onChange={e => setJobSpec(e.target.value)}
              placeholder="Paste the job description or person specification here..."
              className="w-full h-64 text-sm border border-surface-border rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-ink"
            />
            <button
              onClick={handleAnalyse}
              disabled={loading || (!cvText.trim() && !jobSpec.trim())}
              className={cn(
                "mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                loading || (!cvText.trim() && !jobSpec.trim())
                  ? "bg-surface-muted text-ink-faint cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</> : "Analyse CV Against Job Spec"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main score */}
          <div className="bg-white rounded-2xl border border-surface-border p-8 flex flex-col items-center text-center">
            <p className="text-sm text-ink-muted font-medium mb-4">ATS Pass Likelihood</p>
            <div className={cn("w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 mb-4",
              result.overall >= 75 ? "border-green-400" : result.overall >= 40 ? "border-amber-400" : "border-red-400"
            )}>
              <span className={cn("text-4xl font-bold", getScoreColor(result.overall))}>{result.overall}</span>
              <span className="text-ink-faint text-xs">/100</span>
            </div>
            <span className={cn("text-sm font-semibold px-3 py-1.5 rounded-full border", passColor)}>
              {result.passLikelihood}
            </span>
            <p className="text-xs text-ink-muted mt-3">{getScoreLabel(result.overall)}</p>
          </div>

          {/* Breakdown chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-border p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Score Breakdown</h3>
            <ModuleBars data={breakdownData} horizontal />
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
          <button
            onClick={() => toggleSection("keywords")}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-sm font-semibold text-ink">Keyword Analysis</h3>
            </div>
            {expandedSection === "keywords" ? <ChevronUp className="w-4 h-4 text-ink-faint" /> : <ChevronDown className="w-4 h-4 text-ink-faint" />}
          </button>
          {expandedSection === "keywords" && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-2">Matched Keywords ({result.matchedKeywords.length})</p>
                <KeywordTags keywords={result.matchedKeywords} variant="matched" />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-700 mb-2">Missing Keywords ({result.missingKeywords.length}) — Add these to improve your score</p>
                <KeywordTags keywords={result.missingKeywords} variant="missing" />
              </div>
            </div>
          )}
        </div>

        {/* Bullet rewrites */}
        <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
          <button
            onClick={() => toggleSection("bullets")}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-semibold text-ink">Weak Bullet Point Rewrites</h3>
            </div>
            {expandedSection === "bullets" ? <ChevronUp className="w-4 h-4 text-ink-faint" /> : <ChevronDown className="w-4 h-4 text-ink-faint" />}
          </button>
          {expandedSection === "bullets" && (
            <div className="px-6 pb-6">
              <BulletRewriter original={result.weakBullets} rewritten={result.rewrittenBullets} />
            </div>
          )}
        </div>

        {/* Tailored summary */}
        <div className="bg-white rounded-2xl border border-surface-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">AI-Tailored Professional Summary</h3>
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copiedSummary ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-sm text-ink leading-relaxed bg-surface-muted rounded-xl p-4 border border-surface-border">
            {result.tailoredSummary}
          </p>
        </div>

        {/* Formatting warnings + missing items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-surface-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-ink">Formatting Warnings</h3>
            </div>
            <ul className="space-y-2">
              {result.formattingWarnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-surface-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-ink">Missing Items</h3>
            </div>
            <ul className="space-y-2">
              {result.missingItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
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
